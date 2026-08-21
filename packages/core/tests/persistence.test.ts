/**
 * Persistence tests — the adapters other products depend on for durable state.
 *
 * These tests run in jsdom so `window.localStorage` behaves like the browser's.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { localStoragePersistence, memoryPersistence } from '../src/adapters/persistence.js';

describe('memoryPersistence', () => {
  it('round-trips values', async () => {
    const p = memoryPersistence();
    await p.set('foo', { bar: 1 });
    expect(await p.get('foo')).toEqual({ bar: 1 });
  });

  it('returns undefined for unknown keys', async () => {
    const p = memoryPersistence();
    expect(await p.get('missing')).toBeUndefined();
  });

  it('removes values', async () => {
    const p = memoryPersistence();
    await p.set('foo', 1);
    await p.remove('foo');
    expect(await p.get('foo')).toBeUndefined();
  });
});

describe('localStoragePersistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes to localStorage under a namespace', async () => {
    const p = localStoragePersistence();
    await p.set('foo', { bar: 1 });
    expect(window.localStorage.getItem('in-app-training:foo')).toBe(JSON.stringify({ bar: 1 }));
  });

  it('reads back typed values', async () => {
    const p = localStoragePersistence();
    await p.set('foo', { bar: 1 });
    expect(await p.get('foo')).toEqual({ bar: 1 });
  });

  it('returns undefined when a stored value is corrupted JSON', async () => {
    window.localStorage.setItem('in-app-training:corrupt', 'not-json-{{');
    const p = localStoragePersistence();
    expect(await p.get('corrupt')).toBeUndefined();
    // Corrupted value should have been removed.
    expect(window.localStorage.getItem('in-app-training:corrupt')).toBeNull();
  });

  it('removes values from localStorage', async () => {
    const p = localStoragePersistence();
    await p.set('foo', 1);
    await p.remove('foo');
    expect(window.localStorage.getItem('in-app-training:foo')).toBeNull();
  });
});
