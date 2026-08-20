/**
 * Analytics adapter tests — factories, contract compliance, memory helper.
 *
 * The engine only relies on `track(name, properties)`; every adapter also
 * carries its own quirks (console noise, warn-once, event capture) that we
 * exercise here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  consoleAnalytics,
  noopAnalytics,
  placeholderAnalytics,
  memoryAnalytics,
} from '../src/adapters/analytics.js';

describe('analytics adapters', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('consoleAnalytics', () => {
    it('logs each track call with the prefixed event name', () => {
      const a = consoleAnalytics();
      a.track('tour_started', { tourId: 't' });
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]![0]).toContain('tour_started');
      expect(logSpy.mock.calls[0]![1]).toEqual({ tourId: 't' });
    });
  });

  describe('noopAnalytics', () => {
    it('does not throw or log', () => {
      const a = noopAnalytics();
      expect(() => a.track('step_viewed', {})).not.toThrow();
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('placeholderAnalytics', () => {
    it('warns exactly once, no matter how many events fire', () => {
      const a = placeholderAnalytics();
      a.track('tour_started', {});
      a.track('step_viewed', {});
      a.track('tour_completed', {});
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]![0]).toContain('placeholderAnalytics is active');
    });

    it('logs every event with a (placeholder) marker', () => {
      const a = placeholderAnalytics();
      a.track('tour_started', { tourId: 't' });
      a.track('step_viewed', { tourId: 't', stepIndex: 0 });
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy.mock.calls[0]![0]).toContain('(placeholder)');
      expect(logSpy.mock.calls[0]![0]).toContain('tour_started');
    });

    it('warns per instance, not once per module', () => {
      const first = placeholderAnalytics();
      const second = placeholderAnalytics();
      first.track('tour_started', {});
      second.track('tour_started', {});
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoryAnalytics', () => {
    it('captures events in insertion order and exposes them on .events', () => {
      const a = memoryAnalytics();
      a.track('tour_started', { tourId: 't1' });
      a.track('step_viewed', { tourId: 't1', stepIndex: 0 });
      a.track('tour_completed', { tourId: 't1' });
      expect(a.events).toHaveLength(3);
      expect(a.events.map((e) => e.name)).toEqual([
        'tour_started',
        'step_viewed',
        'tour_completed',
      ]);
      expect(a.events[0]!.properties).toEqual({ tourId: 't1' });
    });

    it('gives each instance its own events array', () => {
      const a = memoryAnalytics();
      const b = memoryAnalytics();
      a.track('tour_started', {});
      expect(a.events).toHaveLength(1);
      expect(b.events).toHaveLength(0);
    });
  });
});
