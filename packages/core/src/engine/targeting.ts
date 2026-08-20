/**
 * Advanced element targeting.
 *
 * Many tour targets don't exist at tour start — they render after a click, an
 * API response, or a route change. `waitForElement` returns as soon as the
 * element appears, or rejects on timeout. Uses MutationObserver (efficient) with
 * a fast `querySelector` short-circuit for elements already in the DOM.
 *
 * The engine calls this before each step; on timeout the step is skipped with
 * a `tour_error` event so a stuck target never hangs a user's tour.
 */

export interface WaitForElementOptions {
  /** Maximum wait in ms. Default 3000. */
  timeoutMs?: number;
  /** Root to observe. Default document.body. Scope this to a container for perf. */
  root?: HTMLElement;
  /** AbortSignal to cancel the wait early (e.g. user dismissed the tour). */
  signal?: AbortSignal;
}

export class TargetTimeoutError extends Error {
  constructor(selector: string, timeoutMs: number) {
    super(`Target "${selector}" did not appear within ${timeoutMs}ms`);
    this.name = 'TargetTimeoutError';
  }
}

/**
 * Resolve when the first element matching `selector` exists, or reject on timeout.
 *
 * Fast path: if the element is already in the DOM, resolves synchronously (next
 * microtask). Slow path: MutationObserver on `root` watches child additions.
 */
export function waitForElement(
  selector: string,
  opts: WaitForElementOptions = {},
): Promise<Element> {
  const { timeoutMs = 3000, root = document.body, signal } = opts;

  // Fast path — synchronous DOM check first.
  const immediate = document.querySelector(selector);
  if (immediate) return Promise.resolve(immediate);

  return new Promise<Element>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    let settled = false;
    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timeoutHandle);
      signal?.removeEventListener('abort', onAbort);
      fn();
    };

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) settle(() => resolve(el));
    });

    const timeoutHandle = setTimeout(() => {
      settle(() => reject(new TargetTimeoutError(selector, timeoutMs)));
    }, timeoutMs);

    const onAbort = (): void => {
      settle(() => reject(new DOMException('Aborted', 'AbortError')));
    };
    signal?.addEventListener('abort', onAbort);

    observer.observe(root, { childList: true, subtree: true });

    // One more synchronous check — the element might have appeared between the
    // fast-path query and observer.observe() (unlikely but not impossible).
    const late = document.querySelector(selector);
    if (late) settle(() => resolve(late));
  });
}
