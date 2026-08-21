/**
 * Trainer tests — the engine's public contract.
 *
 * We test the observable behavior: what events fire, in what order, with what
 * payload. We do NOT test Shepherd internals — trust the library.
 *
 * NOTE: Shepherd.js requires a real DOM. jsdom is enough. If a specific test
 * needs a Chromium behavior (scroll, focus timing), promote it to Playwright.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Trainer } from '../src/engine/Trainer.js';
import { memoryAnalytics } from '../src/adapters/analytics.js';
import { memoryPersistence } from '../src/adapters/persistence.js';
import type { Tour } from '../src/schema/v1.js';

function tour(): Tour {
  return {
    schemaVersion: 'v1',
    id: 'unit-tour',
    product: 'test-product',
    title: 'Unit tour',
    difficulty: 'basic',
    triggers: [{ type: 'manual' }],
    steps: [
      { id: 'a', target: '[data-tour="target-a"]', placement: 'bottom', body: 'A' },
      { id: 'b', target: '[data-tour="target-b"]', placement: 'bottom', body: 'B' },
    ],
  };
}

function paintTargets(): void {
  document.body.innerHTML = `
    <div data-tour="target-a">A</div>
    <div data-tour="target-b">B</div>
  `;
}

describe('Trainer', () => {
  beforeEach(() => {
    paintTargets();
    window.localStorage.clear();
  });

  it('throws on unknown tour id', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    await expect(trainer.start('does-not-exist')).rejects.toThrow(/Unknown tour/);
  });

  it('emits tour_started and step_viewed on start', async () => {
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics,
      persistence: memoryPersistence(),
    });
    await trainer.start('unit-tour', 'manual');
    const names = analytics.events.map((e) => e.name);
    expect(names).toContain('tour_started');
    expect(names).toContain('step_viewed');
    expect(trainer.getActiveTourId()).toBe('unit-tour');
  });

  it('records progress after start', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(trainer.getProgress('unit-tour').status).toBe('not-started');
    await trainer.start('unit-tour');
    expect(trainer.getProgress('unit-tour').status).toBe('in-progress');
  });

  it('does not throw when the analytics adapter throws', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: {
        track: () => {
          throw new Error('sink down');
        },
      },
      persistence: memoryPersistence(),
    });
    // Must not reject — a broken sink cannot break a user's tour.
    await expect(trainer.start('unit-tour')).resolves.not.toThrow();
  });

  it('subscribing to an event returns an unsubscribe function', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    let calls = 0;
    const off = trainer.on('tour_started', () => calls++);
    await trainer.start('unit-tour');
    expect(calls).toBe(1);
    off();
    await trainer.start('unit-tour');
    expect(calls).toBe(1); // Not incremented after unsubscribe.
  });

  it('getTours returns every registered tour', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour(), { ...tour(), id: 'second' }],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    const ids = trainer.getTours().map((t) => t.id);
    expect(ids).toEqual(['unit-tour', 'second']);
  });

  it('getActiveTourId is null before any start', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(trainer.getActiveTourId()).toBeNull();
  });

  it('stop() with no active tour is a safe no-op', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(() => trainer.stop()).not.toThrow();
    expect(trainer.getActiveTourId()).toBeNull();
  });

  it('stop() ends the active tour and clears activeTourId', async () => {
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics,
      persistence: memoryPersistence(),
    });
    await trainer.start('unit-tour');
    expect(trainer.getActiveTourId()).toBe('unit-tour');
    trainer.stop();
    expect(trainer.getActiveTourId()).toBeNull();
    expect(analytics.events.some((e) => e.name === 'tour_dismissed')).toBe(true);
  });

  it('next / prev on an idle trainer do not throw', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(() => trainer.next()).not.toThrow();
    expect(() => trainer.prev()).not.toThrow();
  });

  it('with a goal + wired GoalsSink, emits tour_goal_reached when the sink turns affirmative', async () => {
    vi.useFakeTimers();
    try {
      const analytics = memoryAnalytics();
      const goalTour = { ...tour(), goal: { event: 'exampleapp.done', windowMinutes: 5 } };
      let calls = 0;
      const trainer = new Trainer({
        product: 'test-product',
        tours: [goalTour],
        analytics,
        persistence: memoryPersistence(),
        goals: {
          pollMs: 1000,
          async hasEventOccurred() {
            calls++;
            return calls >= 2;
          },
        },
      });
      await trainer.start('unit-tour');
      await vi.advanceTimersByTimeAsync(2500);
      const reached = analytics.events.find((e) => e.name === 'tour_goal_reached');
      expect(reached).toBeDefined();
      expect(reached?.properties).toMatchObject({
        tourId: 'unit-tour',
        event: 'exampleapp.done',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('with a goal + no GoalsSink wired, skips the check loop silently', async () => {
    const analytics = memoryAnalytics();
    const goalTour = { ...tour(), goal: { event: 'exampleapp.done' } };
    const trainer = new Trainer({
      product: 'test-product',
      tours: [goalTour],
      analytics,
      persistence: memoryPersistence(),
      // no goals: field
    });
    await trainer.start('unit-tour');
    // No goal events should fire at all — trainer skipped the runner entirely.
    expect(analytics.events.some((e) => e.name.startsWith('tour_goal_'))).toBe(false);
  });

  it('cancels the goal runner on user dismissal so a late goal event does not fire', async () => {
    vi.useFakeTimers();
    try {
      const analytics = memoryAnalytics();
      const goalTour = { ...tour(), goal: { event: 'exampleapp.done', windowMinutes: 5 } };
      let calls = 0;
      const trainer = new Trainer({
        product: 'test-product',
        tours: [goalTour],
        analytics,
        persistence: memoryPersistence(),
        goals: {
          pollMs: 1000,
          async hasEventOccurred() {
            calls++;
            return calls >= 5; // would fire on the fifth tick
          },
        },
      });
      await trainer.start('unit-tour');
      trainer.stop(); // user-initiated dismiss
      await vi.advanceTimersByTimeAsync(10_000);
      expect(analytics.events.some((e) => e.name === 'tour_goal_reached')).toBe(false);
      expect(analytics.events.some((e) => e.name === 'tour_goal_missed')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
