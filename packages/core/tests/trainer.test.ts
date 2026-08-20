/**
 * Trainer tests — the engine's public contract.
 *
 * We test the observable behavior: what events fire, in what order, with what
 * payload. We do NOT test Shepherd internals — trust the library.
 *
 * NOTE: Shepherd.js requires a real DOM. jsdom is enough. If a specific test
 * needs a Chromium behavior (scroll, focus timing), promote it to Playwright.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Trainer } from '../src/engine/Trainer.js';
import { memoryAnalytics } from '../src/adapters/analytics.js';
import { memoryPersistence } from '../src/adapters/persistence.js';
import type { Tour } from '../src/schema/v1.js';

function tour(): Tour {
  return {
    schemaVersion: 'v1',
    id: 'unit-tour',
    product: 'test-product',
    title: 'Unit tour',
    difficulty: 'basic',
    triggers: [{ type: 'manual' }],
    steps: [
      { id: 'a', target: '[data-tour="target-a"]', placement: 'bottom', body: 'A' },
      { id: 'b', target: '[data-tour="target-b"]', placement: 'bottom', body: 'B' },
    ],
  };
}

function paintTargets(): void {
  document.body.innerHTML = `
    <div data-tour="target-a">A</div>
    <div data-tour="target-b">B</div>
  `;
}

describe('Trainer', () => {
  beforeEach(() => {
    paintTargets();
    window.localStorage.clear();
  });

  it('throws on unknown tour id', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    await expect(trainer.start('does-not-exist')).rejects.toThrow(/Unknown tour/);
  });

  it('emits tour_started and step_viewed on start', async () => {
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics,
      persistence: memoryPersistence(),
    });
    await trainer.start('unit-tour', 'manual');
    const names = analytics.events.map((e) => e.name);
    expect(names).toContain('tour_started');
    expect(names).toContain('step_viewed');
    expect(trainer.getActiveTourId()).toBe('unit-tour');
  });

  it('records progress after start', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(trainer.getProgress('unit-tour').status).toBe('not-started');
    await trainer.start('unit-tour');
    expect(trainer.getProgress('unit-tour').status).toBe('in-progress');
  });

  it('does not throw when the analytics adapter throws', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: {
        track: () => {
          throw new Error('sink down');
        },
      },
      persistence: memoryPersistence(),
    });
    // Must not reject — a broken sink cannot break a user's tour.
    await expect(trainer.start('unit-tour')).resolves.not.toThrow();
  });

  it('subscribing to an event returns an unsubscribe function', async () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    let calls = 0;
    const off = trainer.on('tour_started', () => calls++);
    await trainer.start('unit-tour');
    expect(calls).toBe(1);
    off();
    await trainer.start('unit-tour');
    expect(calls).toBe(1); // Not incremented after unsubscribe.
  });

  it('getTours returns every registered tour', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour(), { ...tour(), id: 'second' }],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    const ids = trainer.getTours().map((t) => t.id);
    expect(ids).toEqual(['unit-tour', 'second']);
  });

  it('getActiveTourId is null before any start', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(trainer.getActiveTourId()).toBeNull();
  });

  it('dismiss with no active tour is a safe no-op', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(() => trainer.dismiss('user-skip')).not.toThrow();
    expect(trainer.getActiveTourId()).toBeNull();
  });

  it('dismiss ends the active tour and clears activeTourId', async () => {
    const analytics = memoryAnalytics();
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics,
      persistence: memoryPersistence(),
    });
    await trainer.start('unit-tour');
    expect(trainer.getActiveTourId()).toBe('unit-tour');
    trainer.dismiss('user-skip');
    expect(trainer.getActiveTourId()).toBeNull();
    expect(analytics.events.some((e) => e.name === 'tour_dismissed')).toBe(true);
  });

  it('next / prev on an idle trainer do not throw', () => {
    const trainer = new Trainer({
      product: 'test-product',
      tours: [tour()],
      analytics: memoryAnalytics(),
      persistence: memoryPersistence(),
    });
    expect(() => trainer.next()).not.toThrow();
    expect(() => trainer.prev()).not.toThrow();
  });
});
