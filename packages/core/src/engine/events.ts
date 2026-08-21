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
  | 'pin_dismissed';

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

// Discriminated union keyed by name — one entry per event type.
export type TrainingEvent =
  | { name: 'tour_started'; payload: TourStartedPayload }
  | { name: 'step_viewed'; payload: StepViewedPayload }
  | { name: 'step_completed'; payload: StepCompletedPayload }
  | { name: 'tour_completed'; payload: TourCompletedPayload }
  | { name: 'tour_dismissed'; payload: TourDismissedPayload }
  | { name: 'tour_error'; payload: TourErrorPayload }
  | { name: 'pin_shown'; payload: PinShownPayload }
  | { name: 'pin_dismissed'; payload: PinDismissedPayload };

export type EventListener<N extends TrainingEventName = TrainingEventName> = (
  event: Extract<TrainingEvent, { name: N }>,
) => void;
