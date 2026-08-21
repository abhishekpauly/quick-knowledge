# Analytics adapter cookbook

The `Analytics` interface is intentionally tiny — one `track(event, properties)` method. Every host product implements it once, wiring to their own sink.

**Contract:** `track` must NOT throw. If it does, the engine logs a warning and continues. A broken analytics sink must never crash a user's tour. Wrap third-party SDKs in try/catch inside your adapter.

## Event catalog

Every payload includes `timestamp: string` (ISO 8601). Additional fields per event:

| Event | Additional fields |
| --- | --- |
| `tour_started` | `tourId`, `product`, `triggerSource` (`manual` / `first-run` / `url` / `event`) |
| `step_viewed` | `tourId`, `stepId`, `stepIndex`, `totalSteps` |
| `step_completed` | `tourId`, `stepId`, `stepIndex`, `durationMs` |
| `tour_completed` | `tourId`, `totalSteps`, `durationMs` |
| `tour_dismissed` | `tourId`, `stepId`, `stepIndex` |
| `tour_error` | `tourId`, `stepId?`, `reason` (`target-not-found` / `timeout` / `unknown`), `message` |

Namespace convention when forwarding: prefix event names with `training.` so they don't collide with your product's own events (`training.tour_started`, `training.step_viewed`, …).

## PostHog

```ts
import type { Analytics } from '@in-app-training/sdk';
import posthog from 'posthog-js';

export function posthogAnalytics(): Analytics {
  return {
    track(event, properties) {
      try {
        posthog.capture(`training.${event}`, properties);
      } catch (err) {
        console.warn('[in-app-training] posthog capture failed', err);
      }
    },
  };
}
```

## Amplitude

```ts
import type { Analytics } from '@in-app-training/sdk';
import * as amplitude from '@amplitude/analytics-browser';

export function amplitudeAnalytics(): Analytics {
  return {
    track(event, properties) {
      try {
        amplitude.track(`training.${event}`, properties);
      } catch (err) {
        console.warn('[in-app-training] amplitude track failed', err);
      }
    },
  };
}
```

## Mixpanel

```ts
import type { Analytics } from '@in-app-training/sdk';
import mixpanel from 'mixpanel-browser';

export function mixpanelAnalytics(): Analytics {
  return {
    track(event, properties) {
      try {
        mixpanel.track(`training.${event}`, properties);
      } catch (err) {
        console.warn('[in-app-training] mixpanel track failed', err);
      }
    },
  };
}
```

## Segment

```ts
import type { Analytics } from '@in-app-training/sdk';
import { analytics as segment } from './your-segment-instance';

export function segmentAnalytics(): Analytics {
  return {
    track(event, properties) {
      try {
        segment.track(`training.${event}`, properties);
      } catch (err) {
        console.warn('[in-app-training] segment track failed', err);
      }
    },
  };
}
```

## Google Analytics 4

```ts
import type { Analytics } from '@in-app-training/sdk';

export function ga4Analytics(): Analytics {
  return {
    track(event, properties) {
      try {
        // GA4 caps event names at 40 chars and disallows some characters.
        // "training_" prefix stays under the limit for every event.
        window.gtag?.('event', `training_${event}`, properties);
      } catch (err) {
        console.warn('[in-app-training] ga4 track failed', err);
      }
    },
  };
}
```

## Custom internal sink

If has an in-house analytics service:

```ts
import type { Analytics } from '@in-app-training/sdk';

export function in-app-trainingInternalAnalytics(userId: string): Analytics {
  return {
    track(event, properties) {
      // Fire-and-forget POST. Failure is logged but never thrown.
      void fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event: `training.${event}`,
          properties,
          userId,
        }),
      }).catch((err) => console.warn('[in-app-training] internal analytics failed', err));
    },
  };
}
```

## Multi-sink

To fan out to multiple destinations:

```ts
import type { Analytics } from '@in-app-training/sdk';

export function multiAnalytics(...sinks: Analytics[]): Analytics {
  return {
    track(event, properties) {
      for (const sink of sinks) {
        try {
          sink.track(event, properties);
        } catch (err) {
          console.warn('[in-app-training] sink threw', err);
        }
      }
    },
  };
}

// Usage
const analytics = multiAnalytics(
  posthogAnalytics(),
  in-app-trainingInternalAnalytics(userId),
);
```

## Testing your adapter

Use `memoryAnalytics()` from the core package in unit tests:

```ts
import { memoryAnalytics } from '@in-app-training/sdk';

const analytics = memoryAnalytics();
const trainer = new Trainer({ /*...*/, analytics });
await trainer.start('some-tour');
expect(analytics.events.map((e) => e.name)).toContain('tour_started');
```

For production sinks, add a smoke test that runs against a test/staging endpoint before shipping — the point of the adapter contract is that the interface is stable; the risk lives in your specific sink integration.

## Dashboard hints

Once you have events landing, the metrics worth watching (see `releases/v0.1.0-mvp.md`):

- **Onboarding completion rate** = `count(tour_completed WHERE tourId=onboarding) / count(tour_started WHERE tourId=onboarding)`.
- **Drop-off by step** = for each tour, `count(step_viewed) - count(step_completed)` per stepId. Reveals which step users abandon.
- **`tour_error` rate** = `count(tour_error) / count(tour_started)`. Should be < 1%. Spikes mean selectors are broken.
- **Median completion time** = median of `tour_completed.durationMs`. Compare against `estimatedMinutes` in the content — large drift means the content is wrong about how long it takes.
