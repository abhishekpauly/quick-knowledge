/**
 * PinAnchor — the framework-agnostic anchoring primitive for Pins (Sprint 09
 * T-111). Owns the "where is the target on screen right now?" question so the
 * React and Vue Pin components can each be a thin styling shell around it.
 *
 * Lifecycle:
 *   1. `attach()` — wait for the target to exist. Once it does, emit an initial
 *      rect via `onRect` and start observing.
 *   2. Observers wired: window `resize` + `scroll` (passive), plus a
 *      `MutationObserver` on the target so class/attr/subtree changes that
 *      alter its layout re-fire `onRect`.
 *   3. `detach()` — disconnect every observer, remove every listener, cancel
 *      any in-flight `waitForElement`.
 *
 * Contract:
 *   - `onRect` may fire many times per second under scroll; consumers debounce
 *     if their render is expensive (React/Vue frameworks already batch state
 *     updates so a per-frame call is fine).
 *   - `onLost` fires once if the target disappears from the DOM after we
 *     attached. Consumers typically re-`attach()` on visibility restoration
 *     or drop the pin.
 *   - `onError` fires once if `waitForElement` rejects (timeout / abort).
 *   - Never throws. Every failure is delivered via a callback so hosts can
 *     decide how loud to be about it.
 *
 * jsdom note: `elementFromPoint`, `getBoundingClientRect`, `IntersectionObserver`
 * and `MutationObserver` all exist in jsdom; `ResizeObserver` does not by
 * default. We rely on window `resize` + target `MutationObserver`, which are
 * both jsdom-supported, so tests run without a polyfill.
 */
import { waitForElement, TargetTimeoutError } from './targeting.js';

export interface PinAnchorOptions {
  /** Selector to target — same `data-tour=` contract as tours. */
  selector: string;
  /** How long to wait for the target on `attach`. Default 3000ms. */
  timeoutMs?: number;
  /** DOM root to observe while waiting for the target. Default `document.body`. */
  root?: HTMLElement;
  /** Called on every rect update (initial mount + scroll/resize/mutation). */
  onRect: (rect: DOMRect, target: Element) => void;
  /** Called once if the target disappears from the DOM after being anchored. */
  onLost?: () => void;
  /** Called once if `waitForElement` rejects. */
  onError?: (err: Error) => void;
}

export class PinAnchor {
  private readonly opts: PinAnchorOptions;
  private readonly abort = new AbortController();
  private target: Element | null = null;
  private targetObserver: MutationObserver | null = null;
  private removalObserver: MutationObserver | null = null;
  private onResizeOrScroll: (() => void) | null = null;
  private disposed = false;

  constructor(opts: PinAnchorOptions) {
    this.opts = opts;
  }

  /**
   * Start anchoring. Resolves once the target is found and the first `onRect`
   * has been dispatched. Rejects (silently — via `onError`) on timeout/abort.
   */
  async attach(): Promise<void> {
    if (this.disposed) return;
    try {
      const el = await waitForElement(this.opts.selector, {
        timeoutMs: this.opts.timeoutMs ?? 3000,
        root: this.opts.root ?? document.body,
        signal: this.abort.signal,
      });
      if (this.disposed) return;
      this.target = el;
      this.emitRect();
      this.wireListeners();
      this.wireTargetObserver();
      this.wireRemovalObserver();
    } catch (err) {
      if (this.disposed) return;
      const e = err instanceof Error ? err : new Error(String(err));
      // Aborted = deliberate detach; nothing to report.
      if (e.name !== 'AbortError' && this.opts.onError) {
        this.opts.onError(e);
      }
    }
  }

  /** Force a rect recompute. Useful when the host knows layout just settled. */
  reflow(): void {
    this.emitRect();
  }

  /** Tear down every observer/listener. Idempotent. */
  detach(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    this.targetObserver?.disconnect();
    this.targetObserver = null;
    this.removalObserver?.disconnect();
    this.removalObserver = null;
    if (this.onResizeOrScroll) {
      window.removeEventListener('resize', this.onResizeOrScroll);
      window.removeEventListener('scroll', this.onResizeOrScroll, true);
      this.onResizeOrScroll = null;
    }
    this.target = null;
  }

  /** True after attach() has found the target and before detach(). */
  isAnchored(): boolean {
    return this.target !== null && !this.disposed;
  }

  private emitRect(): void {
    if (!this.target) return;
    const rect = this.target.getBoundingClientRect();
    this.opts.onRect(rect, this.target);
  }

  private wireListeners(): void {
    this.onResizeOrScroll = (): void => this.emitRect();
    window.addEventListener('resize', this.onResizeOrScroll);
    // capture:true catches scrolls in any scroll container without one listener
    // per ancestor.
    window.addEventListener('scroll', this.onResizeOrScroll, true);
  }

  private wireTargetObserver(): void {
    if (!this.target) return;
    this.targetObserver = new MutationObserver(() => this.emitRect());
    this.targetObserver.observe(this.target, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private wireRemovalObserver(): void {
    if (!this.target) return;
    // Watch document.body for the target being removed. Cheap: only childList
    // + subtree with a single check inside the callback.
    this.removalObserver = new MutationObserver(() => {
      if (this.target && !document.contains(this.target)) {
        this.removalObserver?.disconnect();
        this.removalObserver = null;
        this.opts.onLost?.();
      }
    });
    this.removalObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// Re-export for consumers that want to distinguish timeout from other errors.
export { TargetTimeoutError };
