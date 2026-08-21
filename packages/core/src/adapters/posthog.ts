/**
 * PostHog analytics adapter — the chosen default sink for the example app launch.
 *
 * Why PostHog as the default:
 *   - Product-analytics native. Funnels, cohorts, and session recordings live
 *     next to our training events, which is where PM/curriculum want to look.
 *   - Open source with a self-hostable option. Compliance-friendly.
 *   - Zero code change on our side to swap to Amplitude / Mixpanel / GA4 later —
 *     any adapter matching the Analytics interface drops in.
 *
 * If actually uses a different sink, swap: import from a different factory
 * in this file's neighbors (`docs/wiring-analytics-sink.md` has recipes for
 * PostHog, Amplitude, Mixpanel, Segment, GA4, custom internal, and multi-sink).
 *
 * Contract per ADR-0004: track() MUST NOT throw. Every call is wrapped in try/catch.
 */
import type { Analytics } from './analytics.js';

/**
 * Minimal PostHog surface we depend on. Kept as a structural type so consumers
 * can pass either the real `posthog-js` singleton, a mocked wrapper, or a
 * server-side PostHog instance without our SDK needing a hard dependency on
 * `posthog-js` itself. Keeps our bundle lean.
 */
export interface PostHogLike {
  capture(eventName: string, properties?: Record<string, unknown>): unknown;
}

export interface PosthogAnalyticsOptions {
  /**
   * Prefix prepended to every event name. Default `training.` so training
   * events don't collide with the host product's own events in the dashboard.
   */
  prefix?: string;
}

/**
 * Wrap a PostHog instance as an Analytics adapter.
 *
 * Usage:
 *   import posthog from 'posthog-js';
 *   posthog.init('phc_...', { api_host: 'https://us.i.posthog.com' });
 *   const analytics = posthogAnalytics(posthog);
 *   const trainer = new Trainer({ analytics, ... });
 */
export function posthogAnalytics(
  posthog: PostHogLike,
  options: PosthogAnalyticsOptions = {},
): Analytics {
  const prefix = options.prefix ?? 'training.';
  return {
    track(event, properties) {
      try {
        posthog.capture(`${prefix}${event}`, properties);
      } catch (err) {
        // Never propagate. A broken sink cannot crash a user's tour.
        // eslint-disable-next-line no-console
        console.warn('[in-app-training] posthog capture failed', err);
      }
    },
  };
}
