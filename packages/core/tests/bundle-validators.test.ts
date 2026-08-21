import { describe, expect, it } from 'vitest';
import {
  toursBundleValidator,
  pinsBundleValidator,
  mixedBundleValidator,
} from '../src/engine/bundleValidators.js';

const goodTour = {
  schemaVersion: 'v1',
  id: 'tour-a',
  product: 'test-product',
  title: 't',
  difficulty: 'basic',
  triggers: [{ type: 'manual' }],
  steps: [{ id: 'step-a', target: '[data-tour="target-x"]', placement: 'bottom', body: 'x' }],
};

const goodPins = {
  schemaVersion: 'v1',
  product: 'test-product',
  pins: [
    {
      id: 'pin-a',
      target: '[data-tour="target-x"]',
      title: 'T',
      body: 'B',
      dismissible: true,
    },
  ],
};

describe('toursBundleValidator', () => {
  it('accepts a plain array of tours', () => {
    const v = toursBundleValidator();
    const res = v([goodTour]);
    expect(res.ok).toBe(true);
  });

  it('accepts an object with a tours field', () => {
    const v = toursBundleValidator();
    const res = v({ tours: [goodTour] });
    expect(res.ok).toBe(true);
  });

  it('reports validation failure on the wrong shape', () => {
    const v = toursBundleValidator();
    const res = v({ nope: true });
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('unreachable');
    expect(res.reason).toBe('validation');
  });

  it('reports validation failure on a bad tour', () => {
    const v = toursBundleValidator();
    const res = v([{ ...goodTour, id: 42 }]);
    expect(res.ok).toBe(false);
  });
});

describe('pinsBundleValidator', () => {
  it('accepts a PinsFile', () => {
    const v = pinsBundleValidator();
    const res = v(goodPins);
    expect(res.ok).toBe(true);
  });

  it('rejects a plain array', () => {
    const v = pinsBundleValidator();
    const res = v([]);
    expect(res.ok).toBe(false);
  });
});

describe('mixedBundleValidator', () => {
  it('accepts pins-only', () => {
    const v = mixedBundleValidator();
    const res = v(goodPins);
    expect(res.ok).toBe(true);
  });

  it('accepts tours-only', () => {
    const v = mixedBundleValidator();
    const res = v({ tours: [goodTour] });
    expect(res.ok).toBe(true);
  });

  it('rejects an empty bundle with neither tours nor pins', () => {
    const v = mixedBundleValidator();
    const res = v({});
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('unreachable');
    expect(res.message).toMatch(/neither/);
  });

  it('rejects a non-object bundle', () => {
    const v = mixedBundleValidator();
    const res = v(null);
    expect(res.ok).toBe(false);
  });

  it('reports validation failure when tours are malformed', () => {
    const v = mixedBundleValidator();
    const res = v({ tours: [{ bad: 'shape' }] });
    expect(res.ok).toBe(false);
  });
});
