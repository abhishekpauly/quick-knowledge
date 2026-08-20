# Training event dictionary

**Generated** — do not edit by hand. Regenerate via `npm run docs:events`.
**Source:** `packages/core/src/engine/events.ts`

Every event emitted by `@uptiq/training-sdk` through the `Analytics.track(name, properties)` contract.

Dashboard authors: filter names below are exact. Property names are camelCase in the payload as delivered to `track()`; if your sink rewrites to snake_case, that is a sink-side concern.

## `tour_started`

Payload interface: `TourStartedPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `product` | `string` | ✓ |
| `triggerSource` | `'manual' | 'first-run' | 'url' | 'event'` | ✓ |
| `timestamp` | `string` | ✓ |

## `step_viewed`

Payload interface: `StepViewedPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `stepId` | `string` | ✓ |
| `stepIndex` | `number` | ✓ |
| `totalSteps` | `number` | ✓ |
| `timestamp` | `string` | ✓ |

## `step_completed`

Payload interface: `StepCompletedPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `stepId` | `string` | ✓ |
| `stepIndex` | `number` | ✓ |
| `durationMs` | `number` | ✓ |
| `timestamp` | `string` | ✓ |

## `tour_completed`

Payload interface: `TourCompletedPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `totalSteps` | `number` | ✓ |
| `durationMs` | `number` | ✓ |
| `timestamp` | `string` | ✓ |

## `tour_dismissed`

Payload interface: `TourDismissedPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `stepId` | `string` | ✓ |
| `stepIndex` | `number` | ✓ |
| `timestamp` | `string` | ✓ |

## `tour_error`

Payload interface: `TourErrorPayload`

| Property | Type | Required |
| --- | --- | --- |
| `tourId` | `string` | ✓ |
| `stepId` | `string` | — |
| `reason` | `'target-not-found' | 'timeout' | 'unknown'` | ✓ |
| `message` | `string` | ✓ |
| `timestamp` | `string` | ✓ |
