/**
 * Targeting tests — the wait-for-element utility.
 *
 * jsdom is enough. MutationObserver works there. We use real timers plus
 * micro-delays to simulate late-render.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { waitForElement, TargetTimeoutError } from '../src/engine/targeting.js';

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves immediately for elements already in the DOM', async () => {
    document.body.innerHTML = '<div data-tour="already-here">A</div>';
    const el = await waitForElement('[data-tour="already-here"]', { timeoutMs: 100 });
    expect(el).toBeDefined();
    expect(el.getAttribute('data-tour')).toBe('already-here');
  });

  it('resolves when the element appears after mount', async () => {
    const promise = waitForElement('[data-tour="late"]', { timeoutMs: 500 });
    setTimeout(() => {
      document.body.innerHTML = '<div data-tour="late">L</div>';
    }, 50);
    const el = await promise;
    expect(el.getAttribute('data-tour')).toBe('late');
  });

  it('rejects with TargetTimeoutError when the element never appears', async () => {
    await expect(waitForElement('[data-tour="never"]', { timeoutMs: 100 })).rejects.toBeInstanceOf(
      TargetTimeoutError,
    );
  });

  it('honors AbortSignal', async () => {
    const controller = new AbortController();
    const promise = waitForElement('[data-tour="waiting"]', {
      timeoutMs: 1000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 20);
    await expect(promise).rejects.toThrow(/Aborted/);
  });
});
