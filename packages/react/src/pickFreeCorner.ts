/**
 * pickFreeCorner — pick the first corner in a preference list whose probe
 * point is not occupied by another fixed-position widget in the host page.
 *
 * Motivation: Sprint 08 T-092, itself a follow-up from the v0.1.0 5-user
 * test where the checklist collided with the example app's help-chat launcher
 * for 1 of 5 users. The host product doesn't know we exist; we don't know
 * what they've placed at each corner. Probing is the cheapest defence.
 *
 * Contract:
 * - `elementFromPoint` is called at each candidate's probe point (offset in
 *   from the corner by PROBE_OFFSET_PX so we sample where the pill would sit,
 *   not the exact page edge).
 * - A candidate is "free" if the probe hits nothing, hits `<html>`/`<body>`,
 *   or hits an element inside a `data-in-app-training="1"` root (our own
 *   widget doesn't disqualify itself, so re-picks on resize don't oscillate).
 * - If every candidate is occupied, the last one is returned. Better a busy
 *   corner than an unplaced widget.
 * - Called in browsers only; if `document` is not defined (SSR), returns the
 *   first candidate unchanged.
 */

export type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const PROBE_OFFSET_PX = 40;

function probePoint(corner: Corner): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (corner) {
    case 'bottom-right':
      return { x: w - PROBE_OFFSET_PX, y: h - PROBE_OFFSET_PX };
    case 'bottom-left':
      return { x: PROBE_OFFSET_PX, y: h - PROBE_OFFSET_PX };
    case 'top-right':
      return { x: w - PROBE_OFFSET_PX, y: PROBE_OFFSET_PX };
    case 'top-left':
      return { x: PROBE_OFFSET_PX, y: PROBE_OFFSET_PX };
  }
}

function isOurOwnWidget(el: Element | null): boolean {
  if (!el) return false;
  return el.closest('[data-in-app-training="1"]') !== null;
}

export function isCornerFree(corner: Corner): boolean {
  if (typeof document === 'undefined') return true;
  const { x, y } = probePoint(corner);
  const el = document.elementFromPoint(x, y);
  if (!el) return true;
  if (el === document.body || el === document.documentElement) return true;
  if (isOurOwnWidget(el)) return true;
  return false;
}

export function pickFreeCorner(candidates: readonly Corner[]): Corner {
  if (candidates.length === 0) return 'bottom-right';
  if (typeof document === 'undefined') return candidates[0]!;
  for (const c of candidates) {
    if (isCornerFree(c)) return c;
  }
  return candidates[candidates.length - 1]!;
}
