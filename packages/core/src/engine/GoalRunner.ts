/**
 * GoalRunner — Sprint 10 T-132.
 *
 * Owns one tour instance's goal check. Created on `tour_started`, cancelled
 * on tour end (complete, dismiss, or new tour starts). Polls the wired
 * `GoalsSink` at `pollMs` cadence; at window expiry fires the final check
 * and emits `tour_goal_missed` if still unreached.
 *
 * Dedupe is inherent — one runner per tour instance, and once
 * `tour_goal_reached` fires it cancels itself.
 *
 * Never throws. A sink that throws is treated as a `false` return (log once,
 * try again next tick). See `docs/wiring-goals.md` for the sink contract.
 */
import type { Goal } from '../schema/v1.js';
import type { GoalsSink } from '../adapters/goals.js';

export interface GoalRunnerOptions {
  tourId: string;
  goal: Goal;
  sink: GoalsSink;
  /** ISO timestamp of `tour_started` — the `sinceIso` for hasEventOccurred. */
  startedAtIso: string;
  onReached: (matchedAtIso: string) => void;
  onMissed: (windowEndedAtIso: string) => void;
}

const DEFAULT_POLL_MS = 60_000;
const DEFAULT_WINDOW_MINUTES = 60;

export class GoalRunner {
  private readonly opts: GoalRunnerOptions;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private expiryHandle: ReturnType<typeof setTimeout> | null = null;
  private settled = false;
  private inFlight = false;
  private warnedSinkError = false;

  constructor(opts: GoalRunnerOptions) {
    this.opts = opts;
  }

  start(): void {
    const pollMs = Math.max(1, this.opts.sink.pollMs ?? DEFAULT_POLL_MS);
    const windowMinutes = this.opts.goal.windowMinutes ?? DEFAULT_WINDOW_MINUTES;
    const windowMs = windowMinutes * 60_000;

    // First check happens on the poll tick, not immediately — the goal event
    // fires *after* tour_started by definition. Immediate check would be a
    // race we always lose.
    this.pollHandle = setInterval(() => {
      void this.tick();
    }, pollMs);

    this.expiryHandle = setTimeout(() => {
      // Final check at expiry: give the sink one last chance in case an event
      // fired between the last poll and the window edge.
      void this.tick(/*isExpiry*/ true);
    }, windowMs);
  }

  cancel(): void {
    if (this.settled) return;
    this.settled = true;
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    if (this.expiryHandle !== null) {
      clearTimeout(this.expiryHandle);
      this.expiryHandle = null;
    }
  }

  private async tick(isExpiry = false): Promise<void> {
    if (this.settled) return;
    if (this.inFlight) return;
    this.inFlight = true;
    let occurred = false;
    try {
      occurred = await this.opts.sink.hasEventOccurred(
        this.opts.goal.event,
        this.opts.goal.match ?? {},
        this.opts.startedAtIso,
      );
    } catch (err) {
      if (!this.warnedSinkError) {
        this.warnedSinkError = true;
        // eslint-disable-next-line no-console
        console.warn(
          `[in-app-training] GoalsSink.hasEventOccurred threw for tour "${this.opts.tourId}"; treating as false.`,
          err,
        );
      }
      occurred = false;
    }
    this.inFlight = false;
    if (this.settled) return;

    if (occurred) {
      this.settled = true;
      this.clearTimers();
      this.opts.onReached(new Date().toISOString());
      return;
    }
    if (isExpiry) {
      this.settled = true;
      this.clearTimers();
      this.opts.onMissed(new Date().toISOString());
    }
  }
}
