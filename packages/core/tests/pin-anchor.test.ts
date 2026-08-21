/**
 * PinAnchor tests — attach happy path, missing-target timeout, mutation +
 * scroll + resize re-emit, removal detection, detach idempotency.
 *
 * Sprint 09 T-111.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PinAnchor } from '../src/engine/PinAnchor.js';

function makeTarget(id = 'pin-target'): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-tour', id);
  el.style.width = '100px';
  el.style.height = '20px';
  document.body.appendChild(el);
  return el;
}

describe('PinAnchor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('emits initial rect once the target is present', async () => {
    const target = makeTarget('a');
    const onRect = vi.fn();
    const anchor = new PinAnchor({
      selector: '[data-tour="a"]',
      onRect,
    });
    await anchor.attach();
    expect(anchor.isAnchored()).toBe(true);
    expect(onRect).toHaveBeenCalledTimes(1);
    expect(onRect.mock.calls[0]![1]).toBe(target);
    anchor.detach();
  });

  it('waits for the target to appear (slow path via MutationObserver)', async () => {
    const onRect = vi.fn();
    const anchor = new PinAnchor({
      selector: '[data-tour="late"]',
      onRect,
      timeoutMs: 500,
    });
    const attachPromise = anchor.attach();
    // Insert after a tick.
    setTimeout(() => makeTarget('late'), 5);
    await attachPromise;
    expect(anchor.isAnchored()).toBe(true);
    expect(onRect).toHaveBeenCalled();
    anchor.detach();
  });

  it('calls onError with TargetTimeoutError when the target never appears', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const anchor = new PinAnchor({
      selector: '[data-tour="ghost"]',
      onRect: () => {},
      onError,
      timeoutMs: 100,
    });
    const p = anchor.attach();
    vi.advanceTimersByTime(150);
    await p;
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].name).toBe('TargetTimeoutError');
    expect(anchor.isAnchored()).toBe(false);
    anchor.detach();
  });

  it('re-emits on a target mutation', async () => {
    const target = makeTarget('b');
    const onRect = vi.fn();
    const anchor = new PinAnchor({ selector: '[data-tour="b"]', onRect });
    await anchor.attach();
    onRect.mockClear();
    target.classList.add('changed');
    await new Promise((r) => setTimeout(r, 0));
    expect(onRect).toHaveBeenCalled();
    anchor.detach();
  });

  it('re-emits on window resize', async () => {
    makeTarget('c');
    const onRect = vi.fn();
    const anchor = new PinAnchor({ selector: '[data-tour="c"]', onRect });
    await anchor.attach();
    onRect.mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(onRect).toHaveBeenCalledTimes(1);
    anchor.detach();
  });

  it('re-emits on scroll (capture phase)', async () => {
    makeTarget('d');
    const onRect = vi.fn();
    const anchor = new PinAnchor({ selector: '[data-tour="d"]', onRect });
    await anchor.attach();
    onRect.mockClear();
    window.dispatchEvent(new Event('scroll'));
    expect(onRect).toHaveBeenCalledTimes(1);
    anchor.detach();
  });

  it('calls onLost when the target is removed from the DOM', async () => {
    const target = makeTarget('e');
    const onLost = vi.fn();
    const anchor = new PinAnchor({
      selector: '[data-tour="e"]',
      onRect: () => {},
      onLost,
    });
    await anchor.attach();
    target.remove();
    await new Promise((r) => setTimeout(r, 0));
    expect(onLost).toHaveBeenCalledTimes(1);
    anchor.detach();
  });

  it('reflow() forces an extra rect emit', async () => {
    makeTarget('f');
    const onRect = vi.fn();
    const anchor = new PinAnchor({ selector: '[data-tour="f"]', onRect });
    await anchor.attach();
    onRect.mockClear();
    anchor.reflow();
    expect(onRect).toHaveBeenCalledTimes(1);
    anchor.detach();
  });

  it('detach() is idempotent and disables further callbacks', async () => {
    makeTarget('g');
    const onRect = vi.fn();
    const anchor = new PinAnchor({ selector: '[data-tour="g"]', onRect });
    await anchor.attach();
    onRect.mockClear();
    anchor.detach();
    anchor.detach(); // twice is fine
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    expect(onRect).not.toHaveBeenCalled();
    expect(anchor.isAnchored()).toBe(false);
  });

  it('detach() before attach() resolves silently (no callbacks)', async () => {
    const onError = vi.fn();
    const anchor = new PinAnchor({
      selector: '[data-tour="never"]',
      onRect: () => {},
      onError,
      timeoutMs: 5000,
    });
    const p = anchor.attach();
    anchor.detach();
    await p;
    // Abort produces no onError (deliberate detach).
    expect(onError).not.toHaveBeenCalled();
  });
});
