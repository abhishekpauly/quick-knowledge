/**
 * pickFreeCorner tests — corner picking based on elementFromPoint probes.
 * The same logic ships in packages/vue; tests are duplicated per package.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pickFreeCorner, isCornerFree, type Corner } from '../src/pickFreeCorner.js';

function stubElementFromPoint(pointToEl: Record<string, Element | null>): void {
  // jsdom does not implement elementFromPoint; define it before spying so the
  // spy has something to replace.
  (
    document as unknown as { elementFromPoint: (x: number, y: number) => Element | null }
  ).elementFromPoint = () => null;
  vi.spyOn(document, 'elementFromPoint').mockImplementation((x: number, y: number) => {
    return pointToEl[`${x},${y}`] ?? null;
  });
}

describe('pickFreeCorner', () => {
  const W = 1024;
  const H = 768;
  const OFFSET = 40;

  const POINTS = {
    'bottom-right': `${W - OFFSET},${H - OFFSET}`,
    'bottom-left': `${OFFSET},${H - OFFSET}`,
    'top-right': `${W - OFFSET},${OFFSET}`,
    'top-left': `${OFFSET},${OFFSET}`,
  };

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: W, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: H, writable: true, configurable: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the first corner when every corner is free', () => {
    stubElementFromPoint({});
    const candidates: Corner[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    expect(pickFreeCorner(candidates)).toBe('bottom-right');
  });

  it('skips a corner occupied by a host widget and picks the next free one', () => {
    const helpLauncher = document.createElement('div');
    document.body.appendChild(helpLauncher);
    stubElementFromPoint({ [POINTS['bottom-right']]: helpLauncher });
    const candidates: Corner[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    expect(pickFreeCorner(candidates)).toBe('bottom-left');
  });

  it('falls back to the last candidate when every corner is occupied', () => {
    const foreign = document.createElement('div');
    document.body.appendChild(foreign);
    stubElementFromPoint({
      [POINTS['bottom-right']]: foreign,
      [POINTS['bottom-left']]: foreign,
      [POINTS['top-right']]: foreign,
      [POINTS['top-left']]: foreign,
    });
    const candidates: Corner[] = ['bottom-right', 'bottom-left', 'top-right'];
    expect(pickFreeCorner(candidates)).toBe('top-right');
  });

  it('treats a hit on document.body / html as free', () => {
    stubElementFromPoint({ [POINTS['bottom-right']]: document.body });
    expect(isCornerFree('bottom-right')).toBe(true);
  });

  it('treats a hit inside our own [data-uptiq-training] widget as free', () => {
    const ourWidget = document.createElement('div');
    ourWidget.setAttribute('data-uptiq-training', '1');
    const inner = document.createElement('span');
    ourWidget.appendChild(inner);
    document.body.appendChild(ourWidget);
    stubElementFromPoint({ [POINTS['bottom-right']]: inner });
    expect(isCornerFree('bottom-right')).toBe(true);
  });

  it('returns "bottom-right" when passed an empty candidate list', () => {
    expect(pickFreeCorner([])).toBe('bottom-right');
  });
});
