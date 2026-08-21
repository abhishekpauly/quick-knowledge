/**
 * The typed event union emitted by the engine.
 *
 * Every event carries the same shape into the Analytics adapter. Adding a new
 * event type here is a breaking API change — bump minor version and update the
 * analytics adapter contract in ADR-0004 comments.
 */

export type TrainingEventName =
  | 'tour_started'
  | 'step_viewed'
  | 'step_completed'
  | 'tour_completed'
  | 'tour_dismissed'
  | 'tour_error'
  | 'pin_shown'
  | 'pin_dismissed'
  | 'tour_goal_reached'
  | 'tour_goal_missed'
  | 'user_forget_requested'
  | 'content_bundle_updated'
  | 'content_bundle_update_failed';

export interface TourStartedPayload {
  tourId: string;
  product: string;
  triggerSource: 'manual' | 'first-run' | 'url' | 'event';
  timestamp: string;
}

export interface StepViewedPayload {
  tourId: string;
  stepId: string;
  stepIndex: number;
  totalSteps: number;
  timestamp: string;
}

export interface StepCompletedPayload {
  tourId: string;
  stepId: string;
  stepIndex: number;
  durationMs: number;
  timestamp: string;
}

export interface TourCompletedPayload {
  tourId: string;
  totalSteps: number;
  durationMs: number;
  timestamp: string;
}

export interface TourDismissedPayload {
  tourId: string;
  stepId: string;
  stepIndex: number;
  timestamp: string;
}

export interface TourErrorPayload {
  tourId: string;
  stepId?: string;
  reason: 'target-not-found' | 'timeout' | 'unknown';
  message: string;
  timestamp: string;
}

/**
 * Sprint 09 (T-114). Pin lifecycle events.
 *
 * `pin_shown` fires the first time a pin renders for a given browser session
 * (dedupe is per-session, not per-lifetime — analytics gets one impression per
 * session per pin, not one per rect update).
 *
 * `pin_dismissed` fires when the user clicks the Dismiss button on the
 * popover. Not fired when a pin auto-hides (past showUntil, audience change).
 */
export interface PinShownPayload {
  pinId: string;
  target: string;
  timestamp: string;
}

export interface PinDismissedPayload {
  pinId: string;
  target: string;
  timestamp: string;
}

/**
 * Sprint 10 (T-133). Goal lifecycle events.
 *
 * `tour_goal_reached` fires the first time `GoalsSink.hasEventOccurred(...)`
 * returns true within the tour's goal window. Deduped per tour instance
 * (identified by `tourStartedAt`).
 *
 * `tour_goal_missed` fires once at window expiry if no reach ever fired.
 */
export interface TourGoalReachedPayload {
  tourId: string;
  event: string;
  tourStartedAt: string;
  matchedAt: string;
}

export interface TourGoalMissedPayload {
  tourId: string;
  event: string;
  tourStartedAt: string;
  windowEndedAt: string;
}

/**
 * Sprint 12 (ADR-0005). Right-to-erasure signal — the SDK fires this so the
 * host can propagate deletion to their analytics sink.
 */
export interface UserForgetRequestedPayload {
  userId?: string;
  timestamp: string;
  scope: 'local' | 'remote' | 'both';
}

/**
 * Sprint 17 (ADR-0008). Content bundle refresh lifecycle from
 * `RemoteContentSource`. Both are `functional` consent category —
 * no user identifiers, only bundle identity.
 */
export interface ContentBundleUpdatedPayload {
  product: string;
  version: string;
  etag: string;
  prevEtag?: string;
  timestamp: string;
}

export interface ContentBundleUpdateFailedPayload {
  product: string;
  reason: 'network' | 'validation' | 'schema-version-mismatch' | 'timeout';
  message: string;
  timestamp: string;
}

// Discriminated union keyed by name — one entry per event type.
export type TrainingEvent =
  | { name: 'tour_started'; payload: TourStartedPayload }
  | { name: 'step_viewed'; payload: StepViewedPayload }
  | { name: 'step_completed'; payload: StepCompletedPayload }
  | { name: 'tour_completed'; payload: TourCompletedPayload }
  | { name: 'tour_dismissed'; payload: TourDismissedPayload }
  | { name: 'tour_error'; payload: TourErrorPayload }
  | { name: 'pin_shown'; payload: PinShownPayload }
  | { name: 'pin_dismissed'; payload: PinDismissedPayload }
  | { name: 'tour_goal_reached'; payload: TourGoalReachedPayload }
  | { name: 'tour_goal_missed'; payload: TourGoalMissedPayload }
  | { name: 'user_forget_requested'; payload: UserForgetRequestedPayload }
  | { name: 'content_bundle_updated'; payload: ContentBundleUpdatedPayload }
  | { name: 'content_bundle_update_failed'; payload: ContentBundleUpdateFailedPayload };

export type EventListener<N extends TrainingEventName = TrainingEventName> = (
  event: Extract<TrainingEvent, { name: N }>,
) => void;
