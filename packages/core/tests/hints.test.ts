/**
 * Hints schema tests.
 */
import { describe, it, expect } from 'vitest';
import { parseHints } from '../src/schema/hints.js';

const valid = {
  schemaVersion: 'v1' as const,
  product: 'example-app',
  hints: [
    { id: 'ok-hint', body: 'A short helpful body.' },
    { id: 'another', title: 'Title', body: 'Body.', learnMoreUrl: 'https://docs.example/x' },
  ],
};

describe('parseHints', () => {
  it('accepts valid hints', () => {
    const r = parseHints(valid);
    expect(r.ok).toBe(true);
    expect(r.file?.hints).toHaveLength(2);
  });

  it('rejects a hint body over 280 characters', () => {
    const bad = { ...valid, hints: [{ id: 'x', body: 'a'.repeat(281) }] };
    const r = parseHints(bad);
    expect(r.ok).toBe(false);
    expect(r.errors?.some((e) => e.message.includes('280'))).toBe(true);
  });

  it('rejects an empty hints array', () => {
    const bad = { ...valid, hints: [] };
    expect(parseHints(bad).ok).toBe(false);
  });

  it('rejects a bad learnMoreUrl', () => {
    const bad = { ...valid, hints: [{ id: 'x', body: 'b', learnMoreUrl: 'not-a-url' }] };
    expect(parseHints(bad).ok).toBe(false);
  });
});
