/**
 * PostHog adapter tests. Verifies contract: prefix, safe error handling, no throw.
 */
import { describe, it, expect, vi } from 'vitest';
import { posthogAnalytics, type PostHogLike } from '../src/adapters/posthog.js';

function stubPosthog(): PostHogLike & {
  calls: Array<[string, Record<string, unknown> | undefined]>;
} {
  const calls: Array<[string, Record<string, unknown> | undefined]> = [];
  return {
    calls,
    capture(name, props) {
      calls.push([name, props]);
    },
  };
}

describe('posthogAnalytics', () => {
  it('prefixes event names with "training." by default', () => {
    const ph = stubPosthog();
    const analytics = posthogAnalytics(ph);
    analytics.track('tour_started', { tourId: 't' });
    expect(ph.calls[0]).toEqual(['training.tour_started', { tourId: 't' }]);
  });

  it('honors a custom prefix', () => {
    const ph = stubPosthog();
    const analytics = posthogAnalytics(ph, { prefix: 'uptiq_training_' });
    analytics.track('step_viewed', {});
    expect(ph.calls[0]![0]).toBe('uptiq_training_step_viewed');
  });

  it('swallows errors from the underlying sink and logs a warning', () => {
    const ph: PostHogLike = {
      capture: () => {
        throw new Error('sink down');
      },
    };
    const analytics = posthogAnalytics(ph);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => analytics.track('tour_started', {})).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
