/**
 * Audience matcher tests. Every documented behavior gets a fixture.
 */
import { describe, it, expect } from 'vitest';
import { matchesAudience } from '../src/schema/audience.js';

describe('matchesAudience', () => {
  it('returns true when audience is undefined', () => {
    expect(matchesAudience(undefined, { plan: 'enterprise' })).toBe(true);
  });

  it('returns true when audience is empty', () => {
    expect(matchesAudience([], { plan: 'enterprise' })).toBe(true);
  });

  it('matches a simple key:value predicate', () => {
    expect(matchesAudience(['plan:enterprise'], { plan: 'enterprise' })).toBe(true);
    expect(matchesAudience(['plan:enterprise'], { plan: 'free' })).toBe(false);
  });

  it('requires ALL atoms to match (AND semantics)', () => {
    const audience = ['plan:enterprise', 'role:admin'];
    expect(matchesAudience(audience, { plan: 'enterprise', role: 'admin' })).toBe(true);
    expect(matchesAudience(audience, { plan: 'enterprise', role: 'user' })).toBe(false);
  });

  it('supports negation with `!`', () => {
    expect(matchesAudience(['!plan:trial'], { plan: 'enterprise' })).toBe(true);
    expect(matchesAudience(['!plan:trial'], { plan: 'trial' })).toBe(false);
  });

  it('missing user attribute makes positive atom fail', () => {
    expect(matchesAudience(['plan:enterprise'], {})).toBe(false);
  });

  it('missing user attribute makes negative atom pass', () => {
    expect(matchesAudience(['!plan:trial'], {})).toBe(true);
  });

  it('coerces attribute values to string for comparison', () => {
    expect(matchesAudience(['seatCount:5'], { seatCount: 5 })).toBe(true);
    expect(matchesAudience(['isAdmin:true'], { isAdmin: true })).toBe(true);
  });
});
