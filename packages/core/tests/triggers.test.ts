/**
 * TriggerManager tests — URL and event auto-triggers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TriggerManager, matchesPattern } from '../src/engine/triggers.js';
import type { Tour } from '../src/schema/v1.js';

function tour(id: string, ...triggers: Tour['triggers']): Tour {
  return {
    schemaVersion: 'v1',
    id,
    product: 'p',
    title: id,
    difficulty: 'basic',
    triggers,
    steps: [{ id: 's', target: '[data-tour="x"]', placement: 'bottom', body: 'b' }],
  };
}

describe('matchesPattern', () => {
  it('matches literal paths', () => {
    expect(matchesPattern('/workflows', '/workflows')).toBe(true);
    expect(matchesPattern('/other', '/workflows')).toBe(false);
  });
  it('matches single-segment wildcards', () => {
    expect(matchesPattern('/workflows/foo', '/workflows/*')).toBe(true);
    expect(matchesPattern('/workflows/foo/bar', '/workflows/*')).toBe(false);
  });
  it('matches multi-segment wildcards', () => {
    expect(matchesPattern('/workflows/foo/bar', '/workflows/**')).toBe(true);
    expect(matchesPattern('/workflows', '/workflows/**')).toBe(false);
  });
});

describe('TriggerManager', () => {
  let originalPushState: typeof window.history.pushState;
  let originalReplaceState: typeof window.history.replaceState;

  beforeEach(() => {
    originalPushState = window.history.pushState;
    originalReplaceState = window.history.replaceState;
  });
  afterEach(() => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  });

  it('does not fire before mount', () => {
    const onFire = vi.fn();
    new TriggerManager({ onFire, onTrainerEvent: () => () => {} });
    expect(onFire).not.toHaveBeenCalled();
  });

  it('fires url trigger when pushState navigates to a matching path', () => {
    window.history.replaceState({}, '', '/');
    const onFire = vi.fn();
    const mgr = new TriggerManager({ onFire, onTrainerEvent: () => () => {} });
    mgr.mount([tour('t1', { type: 'url', pattern: '/workflows/*' })]);
    onFire.mockClear(); // Clear the mount-time evaluation for '/'
    window.history.pushState({}, '', '/workflows/foo');
    expect(onFire).toHaveBeenCalledWith('t1', 'url');
    mgr.dispose();
  });

  it('fires event trigger when a subscribed event fires', () => {
    const listeners = new Map<string, Array<() => void>>();
    const onTrainerEvent = (name: string, cb: () => void) => {
      const list = listeners.get(name) ?? [];
      list.push(cb);
      listeners.set(name, list);
      return () => {
        const l = listeners.get(name) ?? [];
        listeners.set(
          name,
          l.filter((x) => x !== cb),
        );
      };
    };
    const onFire = vi.fn();
    const mgr = new TriggerManager({ onFire, onTrainerEvent });
    mgr.mount([tour('t1', { type: 'event', name: 'signup_completed' })]);
    listeners.get('signup_completed')?.forEach((cb) => cb());
    expect(onFire).toHaveBeenCalledWith('t1', 'event');
    mgr.dispose();
  });

  it('dispose() unsubscribes and restores history methods', () => {
    const before = window.history.pushState;
    const mgr = new TriggerManager({ onFire: () => {}, onTrainerEvent: () => () => {} });
    mgr.mount([tour('t1', { type: 'url', pattern: '/x' })]);
    expect(window.history.pushState).not.toBe(before);
    mgr.dispose();
    expect(window.history.pushState).toBe(before);
    expect(mgr.isMounted()).toBe(false);
  });
});
