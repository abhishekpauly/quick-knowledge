/**
 * Personalization templating tests. XSS safety is the biggest risk here —
 * cover the escaping paths.
 */
import { describe, it, expect, vi } from 'vitest';
import { personalize } from '../src/schema/personalize.js';

describe('personalize', () => {
  it('interpolates a top-level key', () => {
    expect(personalize('Hi {{firstName}}', { firstName: 'Alex' })).toBe('Hi Alex');
  });

  it('interpolates a dotted path', () => {
    expect(personalize('Hi {{user.firstName}}', { user: { firstName: 'Alex' } })).toBe('Hi Alex');
  });

  it('leaves plain text untouched', () => {
    expect(personalize('Hello world', { user: { firstName: 'Alex' } })).toBe('Hello world');
  });

  it('resolves unknown keys to empty string with a dev warning', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(personalize('Hi {{user.missing}}', { user: {} })).toBe('Hi ');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('handles missing context', () => {
    expect(personalize('Hi {{user.firstName}}', undefined)).toBe('Hi {{user.firstName}}');
  });

  it('escapes HTML in interpolated values to prevent XSS', () => {
    const dangerous = { firstName: '<script>alert(1)</script>' };
    const out = personalize('Hi {{firstName}}', dangerous);
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('escapes attribute-breaking chars', () => {
    const out = personalize('Hi {{firstName}}', { firstName: `"' & < >` });
    expect(out).toBe('Hi &quot;&#39; &amp; &lt; &gt;');
  });

  it('handles multiple templates in one string', () => {
    expect(personalize('{{a}} + {{b}} = {{c}}', { a: 1, b: 2, c: 3 })).toBe('1 + 2 = 3');
  });
});
