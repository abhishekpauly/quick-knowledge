/**
 * pickFreeCorner (Vue) — identical logic to the React version. Kept as a
 * per-package copy rather than a core dependency so the framework adapters
 * stay independently publishable.
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
  return el.closest('[data-uptiq-training="1"]') !== null;
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
