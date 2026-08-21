/**
 * ConsentAdapter gate + Trainer.forgetUser tests. Sprint 12.
 */
import { describe, it, expect } from 'vitest';
import { Trainer } from '../src/engine/Trainer.js';
import { memoryAnalytics } from '../src/adapters/analytics.js';
import { memoryPersistence } from '../src/adapters/persistence.js';
import { isCategoryAllowed } from '../src/adapters/consent.js';
import type { Tour } from '../src/schema/v1.js';

function tour(id = 'unit-tour', consentCategory?: Tour['consentCategory']): Tour {
  return {
    schemaVersion: 'v1',
    id,
    product: 'test-product',
    title: 'T',
    difficulty: 'basic',
    triggers: [{ type: 'manual' }],
    consentCategory,
    steps: [{ id: 'a', target: '[data-tour="target-a"]', placement: 'bottom', body: 'A' }],
  };
}

describe('isCategoryAllowed', () => {
  it('strictly-necessary is always allowed', () => {
    expect(isCategoryAllowed('strictly-necessary', { granted: [] })).toBe(true);
  });
  it('defaults undefined to functional', () => {
    expect(isCategoryAllowed(undefined, { granted: ['functional'] })).toBe(true);
    expect(isCategoryAllowed(undefined, { granted: [] })).toBe(false);
  });
  it('gates by exact category match', () => {
    expect(isCategoryAllowed('analytics', { granted: ['analytics'] })).toBe(true);
    expect(isCategoryAllowed('analytics', { granted: ['functional'] })).toBe(false);
    expect(isCategoryAllowed('marketing', { granted: ['analytics', 'functional'] })).toBe(false);
  });
});

describe('Trainer with consent', () => {
  it('drops analytics for tours whose category is not granted', async () => {
    document.body.innerHTML = '<div data-tour="target-a">A</div>';
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour('unit-tour', 'marketing')],
      analytics,
      persistence: memoryPersistence(),
      consent: { read: () => ({ granted: ['functional'] }) },
    });
    await trainer.start('unit-tour');
    // Marketing category not granted → no analytics emissions for its events.
    expect(analytics.events.filter((e) => e.name === 'tour_started')).toHaveLength(0);
  });

  it('emits analytics when the category is granted', async () => {
    document.body.innerHTML = '<div data-tour="target-a">A</div>';
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour('unit-tour', 'analytics')],
      analytics,
      persistence: memoryPersistence(),
      consent: { read: () => ({ granted: ['analytics', 'functional'] }) },
    });
    await trainer.start('unit-tour');
    expect(analytics.events.some((e) => e.name === 'tour_started')).toBe(true);
  });
});

describe('Trainer.forgetUser', () => {
  it('is idempotent, clears persistence, and emits user_forget_requested', async () => {
    const analytics = memoryAnalytics();
    const persistence = memoryPersistence();
    await persistence.set('progress', { foo: 'bar' });
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics,
      persistence,
    });
    const r1 = await trainer.forgetUser();
    expect(r1.clearedLocal).toBe(true);
    expect(r1.emittedAnalyticsSignal).toBe(true);
    expect(r1.errors).toHaveLength(0);
    expect(analytics.events.filter((e) => e.name === 'user_forget_requested')).toHaveLength(1);
    // Idempotent — second call still succeeds and emits again.
    const r2 = await trainer.forgetUser('user-123');
    expect(r2.clearedLocal).toBe(true);
    expect(analytics.events.filter((e) => e.name === 'user_forget_requested')).toHaveLength(2);
  });
});
