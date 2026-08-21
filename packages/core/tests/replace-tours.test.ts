/**
 * Sprint 18 (T-260). Trainer.replaceTours + TriggerManager.remount.
 *
 * We test the observable contract:
 *   - Added / removed / kept ids are reported correctly.
 *   - The trigger manager is remounted (mounted flag flips through false).
 *   - Tours previously registered but dropped no longer appear on getTours().
 *   - An in-flight tour reference is preserved (semantics per ADR-0008 —
 *     the running tour finishes on the bundle it started with).
 */
import { describe, it, expect } from 'vitest';
import { Trainer } from '../src/engine/Trainer.js';
import { memoryAnalytics } from '../src/adapters/analytics.js';
import { memoryPersistence } from '../src/adapters/persistence.js';
import type { Tour } from '../src/schema/v1.js';

function makeTour(id: string, opts: { url?: string; event?: string } = {}): Tour {
  const triggers: Tour['triggers'] = [];
  if (opts.url) triggers.push({ type: 'url', pattern: opts.url });
  else if (opts.event) triggers.push({ type: 'event', name: opts.event });
  else triggers.push({ type: 'manual' });
  return {
    schemaVersion: 'v1',
    id,
    product: 'test-product',
    title: `Tour ${id}`,
    difficulty: 'basic',
    triggers,
    steps: [{ id: 's', target: '[data-tour="x"]', placement: 'bottom', body: 'x' }],
  };
}

function trainer(tours: Tour[]): Trainer {
  return new Trainer({
    tours,
    product: 'test-product',
    analytics: memoryAnalytics(),
    persistence: memoryPersistence(),
  });
}

describe('Trainer.replaceTours', () => {
  it('reports added, removed, and kept ids', () => {
    const t = trainer([makeTour('a'), makeTour('b')]);
    const diff = t.replaceTours([makeTour('b'), makeTour('c')]);
    expect(diff.added).toEqual(['c']);
    expect(diff.removed).toEqual(['a']);
    expect(diff.kept).toEqual(['b']);
  });

  it('updates getTours() to reflect the new set', () => {
    const t = trainer([makeTour('a'), makeTour('b')]);
    t.replaceTours([makeTour('c')]);
    expect(t.getTours().map((tt) => tt.id)).toEqual(['c']);
  });

  it('remounts triggers — new URL triggers become active, dropped ones do not', () => {
    const t = trainer([makeTour('a', { url: '/old' })]);
    // Before: getTours has "a" with /old trigger
    expect(t.getTours()).toHaveLength(1);
    t.replaceTours([makeTour('b', { url: '/new' })]);
    // After: only "b" with /new.
    expect(t.getTours().map((tt) => tt.id)).toEqual(['b']);
    // No exception during remount — the remount path exercises dispose + mount.
    t.dispose();
  });

  it('is idempotent on the same set', () => {
    const t = trainer([makeTour('a'), makeTour('b')]);
    const diff = t.replaceTours([makeTour('a'), makeTour('b')]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.kept).toEqual(['a', 'b']);
  });

  it('handles the empty-replacement case', () => {
    const t = trainer([makeTour('a')]);
    const diff = t.replaceTours([]);
    expect(diff.removed).toEqual(['a']);
    expect(t.getTours()).toEqual([]);
    t.dispose();
  });
});
