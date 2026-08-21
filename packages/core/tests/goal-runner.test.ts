/**
 * GoalRunner tests — poll cadence, expiry, dedupe, sink-error safety.
 * Sprint 10 T-132 / T-133.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoalRunner } from '../src/engine/GoalRunner.js';
import type { GoalsSink } from '../src/adapters/goals.js';

function makeSink(has: (call: number) => boolean, pollMs?: number): GoalsSink & { calls: number } {
  const state = { calls: 0 };
  return {
    calls: 0,
    pollMs,
    async hasEventOccurred() {
      state.calls++;
      (this as { calls: number }).calls = state.calls;
      return has(state.calls);
    },
  };
}

describe('GoalRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls at pollMs and calls onReached on the first affirmative', async () => {
    const sink = makeSink((n) => n === 2, 1000); // second poll returns true
    const onReached = vi.fn();
    const onMissed = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 60 },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached,
      onMissed,
    });
    runner.start();
    await vi.advanceTimersByTimeAsync(1000);
    // First tick: sink returned false. No callback yet.
    expect(sink.calls).toBe(1);
    expect(onReached).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    // Second tick: sink returned true. onReached fires exactly once.
    expect(sink.calls).toBe(2);
    expect(onReached).toHaveBeenCalledTimes(1);
    expect(onMissed).not.toHaveBeenCalled();
    // Further time does not re-trigger — runner settled + cleared timers.
    await vi.advanceTimersByTimeAsync(10000);
    expect(sink.calls).toBe(2);
    expect(onReached).toHaveBeenCalledTimes(1);
  });

  it('calls onMissed exactly once at window expiry when the sink never returns true', async () => {
    const sink = makeSink(() => false, 1000);
    const onReached = vi.fn();
    const onMissed = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 1 }, // 60_000 ms
      sink,
      startedAtIso: new Date().toISOString(),
      onReached,
      onMissed,
    });
    runner.start();
    // Advance past the expiry (60_000 ms). Polls fire along the way.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onReached).not.toHaveBeenCalled();
    expect(onMissed).toHaveBeenCalledTimes(1);
  });

  it('defaults pollMs to 60000 and windowMinutes to 60 when omitted', async () => {
    const sink: GoalsSink = {
      async hasEventOccurred() {
        return false;
      },
    };
    const onMissed = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x' }, // no windowMinutes → 60 min = 3_600_000 ms
      sink,
      startedAtIso: new Date().toISOString(),
      onReached: () => {},
      onMissed,
    });
    runner.start();
    // Just short of expiry (60 min - 1s) — no miss yet.
    await vi.advanceTimersByTimeAsync(3_600_000 - 1000);
    expect(onMissed).not.toHaveBeenCalled();
    // Cross the expiry boundary.
    await vi.advanceTimersByTimeAsync(2000);
    expect(onMissed).toHaveBeenCalledTimes(1);
  });

  it('cancel() stops future polls and expiry', async () => {
    const sink = makeSink(() => true, 1000);
    const onReached = vi.fn();
    const onMissed = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 60 },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached,
      onMissed,
    });
    runner.start();
    runner.cancel();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sink.calls).toBe(0);
    expect(onReached).not.toHaveBeenCalled();
    expect(onMissed).not.toHaveBeenCalled();
  });

  it('cancel() is idempotent', () => {
    const sink = makeSink(() => false, 1000);
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x' },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached: () => {},
      onMissed: () => {},
    });
    runner.start();
    expect(() => {
      runner.cancel();
      runner.cancel();
      runner.cancel();
    }).not.toThrow();
  });

  it('treats a throwing sink as false and continues polling', async () => {
    let call = 0;
    const sink: GoalsSink = {
      pollMs: 1000,
      async hasEventOccurred() {
        call++;
        if (call === 1) throw new Error('network');
        return call === 3;
      },
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onReached = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 60 },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached,
      onMissed: () => {},
    });
    runner.start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(warnSpy).toHaveBeenCalledTimes(1); // deduped
    expect(onReached).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('does not double-emit onReached if the sink is affirmative on multiple ticks', async () => {
    const sink = makeSink(() => true, 1000);
    const onReached = vi.fn();
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 60 },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached,
      onMissed: () => {},
    });
    runner.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onReached).toHaveBeenCalledTimes(1);
  });

  it('does not overlap ticks: while one poll is in flight, the next tick is skipped', async () => {
    let inflight = 0;
    let peak = 0;
    const sink: GoalsSink = {
      pollMs: 1000,
      async hasEventOccurred() {
        inflight++;
        peak = Math.max(peak, inflight);
        await new Promise((r) => setTimeout(r, 5000));
        inflight--;
        return false;
      },
    };
    const runner = new GoalRunner({
      tourId: 't1',
      goal: { event: 'x', windowMinutes: 60 },
      sink,
      startedAtIso: new Date().toISOString(),
      onReached: () => {},
      onMissed: () => {},
    });
    runner.start();
    await vi.advanceTimersByTimeAsync(6000);
    expect(peak).toBe(1);
    runner.cancel();
  });
});
