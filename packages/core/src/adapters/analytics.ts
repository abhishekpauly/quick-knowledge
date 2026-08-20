/**
 * Analytics adapter — the seam between the engine's typed events and each
 * product's own analytics sink (Amplitude, Mixpanel, PostHog, internal).
 *
 * Contract: `track` must NOT throw. If it does, the engine will log a warning
 * and continue — the tour must not crash because analytics is down. See ADR-0004.
 */
import type { TrainingEventName } from '../engine/events.js';

export interface Analytics {
  track(event: TrainingEventName, properties: Record<string, unknown>): void;
}

/**
 * Console adapter for local development.
 * Prints events in a scannable format. Never use in production.
 */
export function consoleAnalytics(): Analytics {
  return {
    track(event, properties) {
      // eslint-disable-next-line no-console
      console.log(`[training-sdk] ${event}`, properties);
    },
  };
}

/**
 * No-op adapter for tests and for products that haven't wired their sink yet.
 * Silent by design.
 */
export function noopAnalytics(): Analytics {
  return {
    track() {
      /* no-op */
    },
  };
}

/**
 * Placeholder adapter for the AI Platform pre-launch window.
 *
 * The concrete sink is not yet confirmed (see plan-of-record open questions).
 * Use this in production temporarily to keep the SDK live end-to-end without
 * committing to a sink — events are logged with a WARN prefix so anyone watching
 * the console notices and asks to wire the real one.
 *
 * When the sink is confirmed, replace with the concrete implementation from
 * docs/analytics-adapters.md or docs/wiring-analytics-sink.md.
 */
export function placeholderAnalytics(): Analytics {
  let warned = false;
  return {
    track(event, properties) {
      if (!warned) {
        // eslint-disable-next-line no-console
        console.warn(
          '[training-sdk] placeholderAnalytics is active — no sink is wired. ' +
            'Events are logged to console only. See docs/wiring-analytics-sink.md.',
        );
        warned = true;
      }
      // eslint-disable-next-line no-console
      console.log(`[training-sdk] (placeholder) ${event}`, properties);
    },
  };
}

/**
 * In-memory adapter for tests that want to assert on emitted events.
 * Exposes an `events` array in insertion order.
 */
export function memoryAnalytics(): Analytics & {
  events: Array<{ name: TrainingEventName; properties: Record<string, unknown> }>;
} {
  const events: Array<{ name: TrainingEventName; properties: Record<string, unknown> }> = [];
  return {
    events,
    track(name, properties) {
      events.push({ name, properties });
    },
  };
}
