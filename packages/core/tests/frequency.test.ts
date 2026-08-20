/**
 * Frequency-limit tests.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { isAllowedByFrequency, markSeenThisSession, _resetSessionState } from '../src/schema/frequency.js';

describe('isAllowedByFrequency', () => {
  beforeEach(() => _resetSessionState());

  it('always allows when frequency is "always"', () => {
    expect(isAllowedByFrequency('always', { status: 'completed', lastRunAt: new Date().toISOString() }, 't')).toBe(true);
  });

  it('defaults to "once" — only allows not-started', () => {
    expect(isAllowedByFrequency(undefined, { status: 'not-started' }, 't')).toBe(true);
    expect(isAllowedByFrequency(undefined, { status: 'completed' }, 't')).toBe(false);
    expect(isAllowedByFrequency(undefined, { status: 'dismissed' }, 't')).toBe(false);
  });

  it('session mode: first time yes, second time no', () => {
    expect(isAllowedByFrequency('session', { status: 'not-started' }, 't')).toBe(true);
    markSeenThisSession('t');
    expect(isAllowedByFrequency('session', { status: 'not-started' }, 't')).toBe(false);
  });

  it('day mode: allows once per rolling 24h', () => {
    const now = new Date('2026-08-20T12:00:00Z');
    // Never run — allow.
    expect(isAllowedByFrequency('day', { status: 'not-started' }, 't', now)).toBe(true);
    // Ran 25 hours ago — allow.
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
    expect(isAllowedByFrequency('day', { status: 'completed', lastRunAt: yesterday }, 't', now)).toBe(true);
    // Ran 1 hour ago — deny.
    const oneHrAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(isAllowedByFrequency('day', { status: 'completed', lastRunAt: oneHrAgo }, 't', now)).toBe(false);
  });

  it('week mode: allows once per rolling 7 days', () => {
    const now = new Date('2026-08-20T12:00:00Z');
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAllowedByFrequency('week', { status: 'completed', lastRunAt: eightDaysAgo }, 't', now)).toBe(true);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAllowedByFrequency('week', { status: 'completed', lastRunAt: threeDaysAgo }, 't', now)).toBe(false);
  });
});
