/**
 * Frequency-limit gating.
 *
 * Called by Trainer before auto-triggered starts (first-run / url / event).
 * Manual starts bypass frequency (a user clicking "show me" should always work).
 * Returns true if the tour is eligible to auto-start.
 *
 * Uses lastRunAt timestamps stored in progress. See TourProgress.completedAt +
 * the new lastRunAt field.
 */
import type { Frequency } from './v1.js';

export interface FrequencyState {
  /** ISO timestamp of the most recent completion, dismissal, or start. */
  lastRunAt?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'dismissed';
}

/**
 * Session-scoped tracking uses in-memory state that clears on page reload —
 * effectively "once per browser session." We keep a module-local set of tour IDs
 * seen this session for the "session" frequency mode.
 */
const seenThisSession = new Set<string>();

/**
 * Mark a tour as seen this session. Called by Trainer whenever a tour starts.
 */
export function markSeenThisSession(tourId: string): void {
  seenThisSession.add(tourId);
}

/** Reset for tests. */
export function _resetSessionState(): void {
  seenThisSession.clear();
}

export function isAllowedByFrequency(
  frequency: Frequency | undefined,
  state: FrequencyState,
  tourId: string,
  now: Date = new Date(),
): boolean {
  const mode = frequency ?? 'once';

  switch (mode) {
    case 'always':
      return true;
    case 'once':
      return state.status === 'not-started';
    case 'session':
      return !seenThisSession.has(tourId);
    case 'day':
      return !runWithin(state.lastRunAt, now, 24 * 60 * 60 * 1000);
    case 'week':
      return !runWithin(state.lastRunAt, now, 7 * 24 * 60 * 60 * 1000);
  }
}

function runWithin(lastRunAt: string | undefined, now: Date, windowMs: number): boolean {
  if (!lastRunAt) return false;
  const then = Date.parse(lastRunAt);
  if (Number.isNaN(then)) return false;
  return now.getTime() - then < windowMs;
}
