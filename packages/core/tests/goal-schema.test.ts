/**
 * GoalSchema tests. Sprint 10 T-130.
 */
import { describe, it, expect } from 'vitest';
import { GoalSchema, TourSchema } from '../src/schema/v1.js';

const validTour = {
  schemaVersion: 'v1' as const,
  id: 'sample',
  product: 'example-app',
  title: 'Sample',
  difficulty: 'basic' as const,
  triggers: [{ type: 'manual' }],
  steps: [{ id: 's1', target: '[data-tour="xx"]', placement: 'bottom', body: 'body' }],
};

describe('GoalSchema', () => {
  it('accepts a minimal goal (event only)', () => {
    expect(GoalSchema.safeParse({ event: 'exampleapp.project_created' }).success).toBe(true);
  });

  it('accepts a fully-populated goal', () => {
    const g = {
      event: 'exampleapp.project_created',
      windowMinutes: 30,
      match: { source: 'onboarding-tour' },
    };
    expect(GoalSchema.safeParse(g).success).toBe(true);
  });

  it('rejects an empty event name', () => {
    expect(GoalSchema.safeParse({ event: '' }).success).toBe(false);
  });

  it('rejects a non-positive window', () => {
    expect(GoalSchema.safeParse({ event: 'x', windowMinutes: 0 }).success).toBe(false);
    expect(GoalSchema.safeParse({ event: 'x', windowMinutes: -1 }).success).toBe(false);
  });

  it('rejects a window longer than 7 days', () => {
    expect(GoalSchema.safeParse({ event: 'x', windowMinutes: 60 * 24 * 8 }).success).toBe(false);
  });

  it('accepts any property-value shape in `match` (subset filter, unknown values)', () => {
    const g = {
      event: 'x',
      match: { plan: 'enterprise', count: 3, nested: { ok: true } },
    };
    expect(GoalSchema.safeParse(g).success).toBe(true);
  });
});

describe('TourSchema with goal', () => {
  it('accepts a tour with a goal', () => {
    const t = { ...validTour, goal: { event: 'exampleapp.project_created', windowMinutes: 5 } };
    expect(TourSchema.safeParse(t).success).toBe(true);
  });

  it('accepts a tour without a goal (additive, backwards compatible)', () => {
    expect(TourSchema.safeParse(validTour).success).toBe(true);
  });

  it('rejects a tour with a malformed goal', () => {
    const t = { ...validTour, goal: { event: '', windowMinutes: 5 } };
    expect(TourSchema.safeParse(t).success).toBe(false);
  });
});
