/**
 * Public types for the Trainer engine.
 *
 * These are stable across schema-version bumps — the engine always deals in
 * whatever the loader gives it as a Tour. See src/schema/v1.ts.
 */
import type { Tour } from '../schema/v1.js';
import type { Analytics } from '../adapters/analytics.js';
import type { Persistence } from '../adapters/persistence.js';
import type { GoalsSink } from '../adapters/goals.js';
import type { Theme } from '../theme/default.js';
import type { UserAttributes } from '../schema/audience.js';

export interface TrainerConfig {
  /** All tours available to this trainer. Load via `loadContent` or import directly. */
  tours: Tour[];

  /** Product identifier (matches Tour.product). Used for namespacing persistence keys. */
  product: string;

  /** Analytics sink. Provide a console adapter in dev; wire the real sink in production. */
  analytics: Analytics;

  /** Persistence adapter. Defaults to localStorage with in-memory fallback. */
  persistence: Persistence;

  /** Theme tokens applied via CSS variables. Optional; falls back to defaults. */
  theme?: Theme;

  /**
   * Attributes about the current user. Powers two things:
   *   - Audience targeting — tours with `audience: ["plan:enterprise"]` filter
   *     against these values.
   *   - Personalization — `{{user.firstName}}` interpolation reads from here.
   *
   * Sprint 5 addition. Optional for backward compatibility.
   */
  userAttributes?: UserAttributes;

  /**
   * BCP-47-ish locale (e.g. "en", "en-US", "es"). Powers LocalizedString resolution
   * for tour title/body/description. If omitted, resolver falls back to first key.
   *
   * Sprint 5 addition. Optional for backward compatibility.
   */
  locale?: string;

  /**
   * Sprint 10 (T-131) · Goals sink.
   *
   * When a tour with a `goal` starts, the trainer polls this sink (default
   * 60s cadence) until either the goal event fires — `tour_goal_reached`
   * — or `goal.windowMinutes` elapses — `tour_goal_missed`. Omit this
   * field and goal-configured tours run normally; the trainer just skips
   * the check loop. Full contract in `adapters/goals.ts`.
   */
  goals?: GoalsSink;
}

export interface TourProgress {
  tourId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'dismissed';
  currentStepIndex: number;
  completedAt?: string; // ISO timestamp
  /** Sprint 6: ISO timestamp of the most recent start/complete/dismiss. Powers frequency limits. */
  lastRunAt?: string;
}

/**
 * A serializable snapshot of everything the engine emits to consumers.
 * Not the internal state — that stays private to the Trainer.
 */
export interface TrainerState {
  activeTourId: string | null;
  currentStepIndex: number | null;
  progress: Record<string, TourProgress>;
}
