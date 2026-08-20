# Wiring the analytics sink

The SDK ships with a `placeholderAnalytics()` for the pre-launch window — it emits `console.warn` on first call and logs events to console. **Do not ship to production on this.** Wire a real sink from the recipes below before the first user hits a tour.

## Prerequisite

You need to know which analytics sink your host product already uses. If you don't know, ask analytics ops or search the frontend codebase for `amplitude`, `posthog`, `mixpanel`, `gtag`, `segment`, or an internal `analytics.` import. The answer is almost always in one of those.

## Recipes

Full recipes for PostHog, Amplitude, Mixpanel, Segment, GA4, custom internal, and a multi-sink combinator live in `docs/analytics-adapters.md`. Below is the minimum "drop this in and go" version.

### PostHog

```ts
// src/analytics-adapter.ts (in the HOST product, or as an internal shim in the SDK repo)
import type { Analytics } from '@uptiq/training-sdk';
import posthog from 'posthog-js';

export const analytics: Analytics = {
  track(event, properties) {
    try {
      posthog.capture(`training.${event}`, properties);
    } catch (err) {
      // Never propagate — the tour must not crash if the sink is down.
      console.warn('[training-sdk] posthog capture failed', err);
    }
  },
};
```

### Amplitude

```ts
import type { Analytics } from '@uptiq/training-sdk';
import * as amplitude from '@amplitude/analytics-browser';

export const analytics: Analytics = {
  track(event, properties) {
    try {
      amplitude.track(`training.${event}`, properties);
    } catch (err) {
      console.warn('[training-sdk] amplitude track failed', err);
    }
  },
};
```

### Mixpanel

```ts
import type { Analytics } from '@uptiq/training-sdk';
import mixpanel from 'mixpanel-browser';

export const analytics: Analytics = {
  track(event, properties) {
    try {
      mixpanel.track(`training.${event}`, properties);
    } catch (err) {
      console.warn('[training-sdk] mixpanel track failed', err);
    }
  },
};
```

### Custom internal sink

If UPTIQ has an in-house analytics service:

```ts
import type { Analytics } from '@uptiq/training-sdk';

export function uptiqInternalAnalytics(userId: string): Analytics {
  return {
    track(event, properties) {
      void fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event: `training.${event}`,
          properties,
          userId,
        }),
      }).catch((err) => console.warn('[training-sdk] internal analytics failed', err));
    },
  };
}
```

## Wiring the adapter in

Once you have an adapter file, swap it in wherever the Trainer is constructed:

```ts
// Before
import { placeholderAnalytics } from '@uptiq/training-sdk';
const trainer = new Trainer({ analytics: placeholderAnalytics(), /* ... */ });

// After
import { analytics } from './analytics-adapter';
const trainer = new Trainer({ analytics, /* ... */ });
```

That's it. No other engine changes required.

## Verification

Follow `testing/analytics-verification.md` to confirm the sink is receiving what the SDK is emitting.

## Checklist for launch day

- [ ] Real sink adapter file exists in the host product or SDK content repo.
- [ ] Trainer is constructed with the real adapter (NOT `placeholderAnalytics()`, NOT `consoleAnalytics()`).
- [ ] Adapter wraps every `track()` call in try/catch.
- [ ] Events use the `training.` prefix so they don't collide with product events.
- [ ] Sink dashboard confirms events in staging before production.
