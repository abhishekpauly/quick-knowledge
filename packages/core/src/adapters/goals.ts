/**
 * GoalsSink — the seam between a tour's declared `goal` and the host
 * product's own analytics store.
 *
 * The trainer never queries the analytics sink itself. When a goal-configured
 * tour starts, the trainer polls `hasEventOccurred` at `pollMs` (default
 * 60000ms) until either:
 *   - the sink returns `true` → `tour_goal_reached` fires (once); or
 *   - `windowMinutes` elapses → `tour_goal_missed` fires (once).
 *
 * Contract for the host implementation:
 *   - Never throw. Return `false` on network / auth failure so the trainer
 *     tries again next tick.
 *   - Subset semantics on `match` — the event's properties are a superset
 *     of `match`.
 *   - `sinceIso` is inclusive.
 *   - "The current user" is whoever the sink knows about client-side
 *     (typically the identified user in PostHog/Amplitude).
 *
 * Full recipes for PostHog + Amplitude + in-house warehouse live in
 * `docs/wiring-goals.md`.
 *
 * If `TrainerConfig.goals` is undefined, goal-configured tours run
 * normally — the trainer just skips the check loop for them.
 */

export interface GoalsSink {
  /**
   * True if `event` has been observed for the current user with properties
   * that are a superset of `match`, at or after `sinceIso`.
   */
  hasEventOccurred(
    event: string,
    match: Record<string, unknown>,
    sinceIso: string,
  ): Promise<boolean>;

  /**
   * How often the trainer polls this sink. Optional; default 60000ms.
   * Kept on the sink (not the tour) so a single knob covers every goal.
   */
  pollMs?: number;
}
