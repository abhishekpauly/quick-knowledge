/**
 * PinSchema + PinsFileSchema tests. Sprint 09 T-110.
 */
import { describe, it, expect } from 'vitest';
import { PinSchema, PinsFileSchema } from '../src/schema/v1.js';
import { parsePinsFile, loadPins } from '../src/schema/loader.js';

const validPin = {
  id: 'share-workflow',
  target: '[data-tour="workflows-canvas-share-button"]',
  title: 'Share this workflow',
  body: 'Click the paper-plane icon to hand a workflow to a teammate.',
};

const validFile = {
  schemaVersion: 'v1' as const,
  product: 'example-app',
  pins: [validPin],
};

describe('PinSchema', () => {
  it('accepts a minimal valid pin', () => {
    const result = PinSchema.safeParse(validPin);
    expect(result.success).toBe(true);
  });

  it('accepts every optional field filled', () => {
    const rich = {
      ...validPin,
      body: 'Body copy',
      learnMoreUrl: 'https://example.com/docs',
      audience: ['plan:enterprise', '!role:trial'],
      dismissible: false,
      showUntil: '2026-12-31',
    };
    expect(PinSchema.safeParse(rich).success).toBe(true);
  });

  it('accepts learnMoreUrl explicitly null', () => {
    const p = { ...validPin, learnMoreUrl: null };
    expect(PinSchema.safeParse(p).success).toBe(true);
  });

  it('rejects a non-kebab-case id', () => {
    const bad = { ...validPin, id: 'ShareWorkflow' };
    const result = PinSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('id'))).toBe(true);
    }
  });

  it('rejects a target that is not the data-tour selector shape', () => {
    const bad = { ...validPin, target: '.some-class' };
    expect(PinSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-URL learnMoreUrl', () => {
    const bad = { ...validPin, learnMoreUrl: 'not a url' };
    expect(PinSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a badly-shaped showUntil', () => {
    const bad = { ...validPin, showUntil: '2026/12/31' };
    expect(PinSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an audience atom missing the colon', () => {
    const bad = { ...validPin, audience: ['enterprise'] };
    expect(PinSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts a localized title (locale map)', () => {
    const p = { ...validPin, title: { en: 'Share', 'en-US': 'Share' } };
    expect(PinSchema.safeParse(p).success).toBe(true);
  });
});

describe('PinsFileSchema', () => {
  it('accepts a minimal valid file', () => {
    expect(PinsFileSchema.safeParse(validFile).success).toBe(true);
  });

  it('rejects an empty pins array', () => {
    const bad = { ...validFile, pins: [] };
    expect(PinsFileSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects the wrong schemaVersion', () => {
    const bad = { ...validFile, schemaVersion: 'v0' as unknown as 'v1' };
    expect(PinsFileSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-kebab-case product', () => {
    const bad = { ...validFile, product: 'ExampleApp' };
    expect(PinsFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe('parsePinsFile', () => {
  it('returns typed file on success', () => {
    const result = parsePinsFile(validFile);
    expect(result.ok).toBe(true);
    expect(result.file?.pins).toHaveLength(1);
    expect(result.file?.pins[0]!.id).toBe('share-workflow');
  });

  it('returns issues on failure', () => {
    const result = parsePinsFile({ ...validFile, pins: [] });
    expect(result.ok).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('at least one pin'))).toBe(true);
  });
});

describe('loadPins', () => {
  it('flattens valid files into a single pins list', () => {
    const fileA = {
      ...validFile,
      pins: [validPin, { ...validPin, id: 'pin-b' }],
    };
    const fileB = { ...validFile, pins: [{ ...validPin, id: 'pin-c' }] };
    const result = loadPins([fileA, fileB]);
    expect(result.pins.map((p) => p.id)).toEqual(['share-workflow', 'pin-b', 'pin-c']);
    expect(result.failures).toHaveLength(0);
  });

  it('reports duplicate pin ids across files as a failure on the second file', () => {
    const fileA = validFile;
    const fileB = { ...validFile, pins: [validPin] };
    const result = loadPins([fileA, fileB]);
    expect(result.pins).toHaveLength(1); // the first
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.index).toBe(1);
    expect(result.failures[0]!.errors[0]!.message).toContain('Duplicate pin id');
  });

  it('separates successful files from invalid ones without throwing', () => {
    const result = loadPins([validFile, { garbage: true }, validFile]);
    expect(result.pins).toHaveLength(1);
    expect(result.failures).toHaveLength(2); // one bad, one dupe
  });
});
