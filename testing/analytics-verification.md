# Analytics verification checklist

Run before every production release. Confirms that every event the SDK emits arrives at the sink with the right payload, and that dashboards pointed at those events read what we expect.

Time: ~20 minutes.

## Setup

- Staging environment (NOT prod).
- Sink dashboard / debug view open (Amplitude Debugger, PostHog live events, etc.).
- Fresh browser profile.
- One test user with a distinguishable identifier.

## Event catalog we're verifying

| Event | Fires on | Key fields |
| --- | --- | --- |
| `training.tour_started` | Any tour starts | `tourId`, `product`, `triggerSource`, `timestamp` |
| `training.step_viewed` | Each step is shown | `tourId`, `stepId`, `stepIndex`, `totalSteps` |
| `training.step_completed` | User clicks Next or advanceOn fires | `tourId`, `stepId`, `stepIndex`, `durationMs` |
| `training.tour_completed` | Reaches last step + confirms | `tourId`, `totalSteps`, `durationMs` |
| `training.tour_dismissed` | User skips or closes | `tourId`, `stepId`, `stepIndex` |
| `training.tour_error` | Target not found / timeout | `tourId`, `stepId?`, `reason`, `message` |

## Verification steps

### 1. Complete a tour, end to end
- [ ] Start onboarding tour.
- [ ] Advance through all steps normally.
- [ ] Check sink: exactly one `tour_started` event with `triggerSource: "first-run"` (or "manual" if triggered from the checklist).
- [ ] Check sink: N `step_viewed` events, one per step, `stepIndex` 0..N-1.
- [ ] Check sink: N `step_completed` events, in order.
- [ ] Check sink: exactly one `tour_completed` with `totalSteps === N` and `durationMs` > 0.
- [ ] All events have consistent `tourId`. All timestamps are ISO 8601 and monotonically increasing.

### 2. Dismiss a tour mid-way
- [ ] Reset localStorage.
- [ ] Start onboarding tour.
- [ ] Click X on step 3.
- [ ] Check sink: `tour_started` + 3 × `step_viewed` + `tour_dismissed` with `stepIndex: 2`.
- [ ] NO `tour_completed`.

### 3. advanceOn: click
- [ ] Start the "create a workflow" tour.
- [ ] At the step whose `advanceOn` is a click, click the target (not the Next button).
- [ ] Check sink: `step_completed` fires immediately after the click, followed by the next `step_viewed`.

### 4. advanceOn: URL
- [ ] Start a tour with a URL-advance step.
- [ ] Navigate to the matching URL.
- [ ] Check sink: `step_completed` + next `step_viewed`.

### 5. First-run trigger
- [ ] Reset localStorage. Reload.
- [ ] Onboarding auto-starts.
- [ ] Check sink: `tour_started` with `triggerSource: "first-run"`.

### 6. URL trigger
- [ ] For a tour with a `{ "type": "url" }` trigger, navigate to the matching path.
- [ ] Tour auto-starts.
- [ ] Check sink: `tour_started` with `triggerSource: "url"`.

### 7. tour_error: target missing
- [ ] Author a temporary tour with a `data-tour` id that doesn't exist in the app.
- [ ] Start it.
- [ ] Wait ~3s.
- [ ] Check sink: `tour_error` with `reason: "target-not-found"`.
- [ ] Tour advances past the broken step gracefully.
- [ ] Remove the temporary tour before merging.

### 8. Persistence
- [ ] Complete onboarding.
- [ ] Reload page.
- [ ] Onboarding does NOT re-trigger.
- [ ] Sink has zero new `tour_started` events post-reload.

### 9. Analytics-adapter resilience
- [ ] Temporarily point the adapter's sink URL to an invalid host (or block it via devtools network).
- [ ] Start a tour.
- [ ] Tour runs to completion normally.
- [ ] Console has warnings, but no unhandled errors and no UI breakage.
- [ ] Restore the sink URL.

## Dashboard smoke check

Once events are landing:

- [ ] Onboarding completion rate query returns a value (may be 100% in staging).
- [ ] Drop-off by step chart renders for each tour.
- [ ] `tour_error` count is queryable and shows the intentional error from step 7.
- [ ] Median `tour_completed.durationMs` is a plausible number (i.e. positive, roughly matches `estimatedMinutes`).

## Pass criteria

- Every event above landed with the expected payload.
- Zero unhandled errors in the console during any step.
- Dashboards read what we expect.

## What to do if it fails

- Missing event: check the trainer's `emit()` and the adapter's `track()`. Log the event before it reaches the sink.
- Wrong payload: check the payload shape in `src/engine/events.ts`. Bump minor version if we changed it.
- Sink dropping events: check the sink's own debug view for rate limits, blocked properties, or size limits.
- Event fires twice: usually a double-mount of the provider. Check for `<TourProvider>` rendered above your app's remount boundary.
