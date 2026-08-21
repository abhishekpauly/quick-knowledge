/**
 * Schema tests — the contract every tour must satisfy.
 *
 * These fixtures ARE the documentation for what's allowed and what isn't.
 * If a real tour breaks in ways the schema didn't catch, first add a fixture
 * that reproduces the break, then fix the schema.
 */
import { describe, it, expect } from 'vitest';
import { parseTour, loadContent } from '../src/schema/loader.js';

const validTour = {
  schemaVersion: 'v1',
  id: 'test-tour',
  product: 'example-app',
  title: 'Test tour',
  difficulty: 'basic',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="test-target"]',
      placement: 'bottom',
      body: 'Hello',
    },
  ],
};

describe('parseTour', () => {
  it('accepts a minimal valid tour', () => {
    const result = parseTour(validTour);
    expect(result.ok).toBe(true);
    expect(result.tour?.id).toBe('test-tour');
  });

  it('rejects the wrong schemaVersion', () => {
    const bad = { ...validTour, schemaVersion: 'v0' };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
    expect(result.errors?.some((e) => e.path === 'schemaVersion')).toBe(true);
  });

  it('rejects a CSS selector (must be [data-tour=...])', () => {
    const bad = {
      ...validTour,
      steps: [{ ...validTour.steps[0], target: '.button-primary' }],
    };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
    expect(
      result.errors?.some((e) => e.path.includes('target') && e.message.includes('[data-tour=')),
    ).toBe(true);
  });

  it('rejects an id in non-kebab-case', () => {
    const bad = { ...validTour, id: 'TestTour' };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects a tour with zero steps', () => {
    const bad = { ...validTour, steps: [] };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('at least one step'))).toBe(true);
  });

  it('rejects a tour with zero triggers', () => {
    const bad = { ...validTour, triggers: [] };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
  });

  it('accepts advanceOn with all supported types', () => {
    const withAdvanceOn = {
      ...validTour,
      steps: [
        {
          ...validTour.steps[0],
          id: 's1',
          advanceOn: { type: 'click', target: '[data-tour="xx"]' },
        },
        {
          ...validTour.steps[0],
          id: 's2',
          advanceOn: { type: 'input', target: '[data-tour="yy"]' },
        },
        { ...validTour.steps[0], id: 's3', advanceOn: { type: 'url', pattern: '/foo' } },
        { ...validTour.steps[0], id: 's4', advanceOn: { type: 'event', name: 'signed_up' } },
      ],
    };
    expect(parseTour(withAdvanceOn).ok).toBe(true);
  });

  it('rejects an unknown advanceOn type', () => {
    const bad = {
      ...validTour,
      steps: [{ ...validTour.steps[0], advanceOn: { type: 'telepathy' } }],
    };
    expect(parseTour(bad).ok).toBe(false);
  });

  it('reports the field path for nested errors', () => {
    const bad = {
      ...validTour,
      steps: [{ ...validTour.steps[0], placement: 'diagonally' }],
    };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
    expect(result.errors?.some((e) => e.path.includes('steps.0.placement'))).toBe(true);
  });
});

describe('parseTour — Sprint 5 additions', () => {
  it('accepts a tour with an audience array', () => {
    const withAudience = { ...validTour, audience: ['plan:enterprise', '!role:trial'] };
    const result = parseTour(withAudience);
    expect(result.ok).toBe(true);
  });

  it('rejects a malformed audience atom', () => {
    const bad = { ...validTour, audience: ['not-a-valid-atom'] };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
  });

  it('accepts a localized title object', () => {
    const localized = { ...validTour, title: { en: 'Hello', es: 'Hola' } };
    const result = parseTour(localized);
    expect(result.ok).toBe(true);
  });

  it('accepts a plain string title (backward compat)', () => {
    // The base fixture already uses a plain string — verify it still passes.
    const result = parseTour(validTour);
    expect(result.ok).toBe(true);
  });

  it('rejects a localized title with an invalid locale key', () => {
    const bad = { ...validTour, title: { English: 'Hello' } };
    const result = parseTour(bad);
    expect(result.ok).toBe(false);
  });

  it('accepts a localized step body', () => {
    const localized = {
      ...validTour,
      steps: [{ ...validTour.steps[0], body: { en: 'Hello', es: 'Hola' } }],
    };
    const result = parseTour(localized);
    expect(result.ok).toBe(true);
  });
});

describe('parseTour — Sprint 6 additions', () => {
  it('accepts a tour with frequency + priority', () => {
    const withFreq = { ...validTour, frequency: 'week', priority: 10 };
    expect(parseTour(withFreq).ok).toBe(true);
  });

  it('rejects a bad frequency value', () => {
    const bad = { ...validTour, frequency: 'monthly' };
    expect(parseTour(bad).ok).toBe(false);
  });

  it('accepts a step with stepType=slideout', () => {
    const slideout = {
      ...validTour,
      steps: [{ ...validTour.steps[0], stepType: 'slideout' }],
    };
    expect(parseTour(slideout).ok).toBe(true);
  });

  it('accepts a step with stepType=hotspot', () => {
    const hotspot = {
      ...validTour,
      steps: [{ ...validTour.steps[0], stepType: 'hotspot' }],
    };
    expect(parseTour(hotspot).ok).toBe(true);
  });

  it('accepts a redirect step with redirectUrl', () => {
    const redirect = {
      ...validTour,
      steps: [
        {
          ...validTour.steps[0],
          stepType: 'redirect',
          redirectUrl: '/workflows',
          redirectWaitMs: 100,
        },
      ],
    };
    expect(parseTour(redirect).ok).toBe(true);
  });

  it('rejects a bad stepType value', () => {
    const bad = { ...validTour, steps: [{ ...validTour.steps[0], stepType: 'floating' }] };
    expect(parseTour(bad).ok).toBe(false);
  });
});

describe('loadContent', () => {
  it('separates successes from failures without throwing', () => {
    const result = loadContent([validTour, { garbage: true }, { ...validTour, id: 'another' }]);
    expect(result.tours).toHaveLength(2);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.index).toBe(1);
  });
});
