/**
 * Localized-string resolver tests.
 */
import { describe, it, expect } from 'vitest';
import { resolveLocale } from '../src/schema/localize.js';

describe('resolveLocale', () => {
  it('returns a plain string as-is', () => {
    expect(resolveLocale('Hello', 'en')).toBe('Hello');
    expect(resolveLocale('Hello', undefined)).toBe('Hello');
  });

  it('picks the exact locale match', () => {
    expect(resolveLocale({ en: 'Hello', es: 'Hola' }, 'es')).toBe('Hola');
  });

  it('falls back to the language-only key when full BCP-47 is missing', () => {
    expect(resolveLocale({ en: 'Hello', es: 'Hola' }, 'es-MX')).toBe('Hola');
  });

  it('picks the exact locale over language fallback when both exist', () => {
    expect(resolveLocale({ 'es-MX': 'Hola MX', es: 'Hola' }, 'es-MX')).toBe('Hola MX');
  });

  it('falls back to the first key when no locale matches', () => {
    expect(resolveLocale({ en: 'Hello', es: 'Hola' }, 'fr')).toBe('Hello');
  });

  it('falls back to the first key when locale is undefined', () => {
    expect(resolveLocale({ es: 'Hola', en: 'Hello' }, undefined)).toBe('Hola');
  });

  it('returns empty string when value is undefined', () => {
    expect(resolveLocale(undefined, 'en')).toBe('');
  });
});
