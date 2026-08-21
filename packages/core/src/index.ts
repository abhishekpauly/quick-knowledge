/**
 * Public API for @in-app-training/sdk.
 *
 * This file is the contract other host products depend on. Every export here
 * is stable across MINOR versions. Removing or renaming anything here requires
 * a MAJOR bump and a note in CHANGELOG.md.
 */

// Core engine
export { Trainer } from './engine/Trainer.js';
export type { TrainerConfig, TourProgress, TrainerState } from './engine/types.js';

// Event types
export type {
  TrainingEvent,
  TrainingEventName,
  EventListener,
  TourStartedPayload,
  StepViewedPayload,
  StepCompletedPayload,
  TourCompletedPayload,
  TourDismissedPayload,
  TourErrorPayload,
  PinShownPayload,
  PinDismissedPayload,
  TourGoalReachedPayload,
  TourGoalMissedPayload,
} from './engine/events.js';

// Adapters
export {
  consoleAnalytics,
  noopAnalytics,
  memoryAnalytics,
  placeholderAnalytics,
  type Analytics,
} from './adapters/analytics.js';

export {
  posthogAnalytics,
  type PostHogLike,
  type PosthogAnalyticsOptions,
} from './adapters/posthog.js';

export {
  localStoragePersistence,
  memoryPersistence,
  type Persistence,
} from './adapters/persistence.js';

// Theme
export { defaultTheme, exampleAppTheme, applyTheme, type Theme } from './theme/default.js';

// Content schema (re-exported here for convenience; also available at @in-app-training/sdk/schema/v1)
export {
  TourSchema,
  StepSchema,
  LocalizedStringSchema,
  SCHEMA_VERSION,
  type Tour,
  type Step,
  type Trigger,
  type AdvanceOn,
  type Difficulty,
  type Placement,
  type LocalizedString,
} from './schema/v1.js';

// Sprint 5 helpers — exposed for custom Vue adapter, tests, and advanced consumers.
export { matchesAudience, type UserAttributes } from './schema/audience.js';
export { resolveLocale } from './schema/localize.js';
export { personalize, type PersonalizationContext } from './schema/personalize.js';

// Sprint 6 helpers.
export {
  isAllowedByFrequency,
  markSeenThisSession,
  _resetSessionState,
} from './schema/frequency.js';
export { readPermalinkTourId } from './schema/permalink.js';
export { StepTypeSchema, FrequencySchema, type StepType, type Frequency } from './schema/v1.js';

// Content loader
export { loadContent, parseTour, loadPins, parsePinsFile } from './schema/loader.js';

// Sprint 09 (T-110) — Pin content schema.
export { PinSchema, PinsFileSchema, type Pin, type PinsFile } from './schema/v1.js';

// Sprint 10 (T-130) — Goal schema.
export { GoalSchema, type Goal } from './schema/v1.js';

// Sprint 10 (T-131) — Goals sink adapter.
export type { GoalsSink } from './adapters/goals.js';

// Sprint 09 (T-111) — Pin anchoring primitive.
export { PinAnchor, type PinAnchorOptions } from './engine/PinAnchor.js';

// Hints schema (companion to tours — see docs/how-to-author-a-tour.md)
export {
  HintSchema,
  HintsFileSchema,
  parseHints,
  type Hint,
  type HintsFile,
} from './schema/hints.js';

// Targeting utility (exposed for custom integrations, e.g. Vue adapter)
export { waitForElement, TargetTimeoutError } from './engine/targeting.js';
