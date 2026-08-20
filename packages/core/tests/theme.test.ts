/**
 * Theme tests — applyTheme writes CSS variables, merges over defaults, and
 * skips explicit undefined values.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, defaultTheme, aiPlatformTheme } from '../src/theme/default.js';

describe('applyTheme', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
  });

  it('writes every defaultTheme token as a --uptiq-training-* CSS variable', () => {
    applyTheme({}, root);
    expect(root.style.getPropertyValue('--uptiq-training-primary')).toBe(defaultTheme.primary);
    expect(root.style.getPropertyValue('--uptiq-training-background')).toBe(
      defaultTheme.background,
    );
    expect(root.style.getPropertyValue('--uptiq-training-foreground')).toBe(
      defaultTheme.foreground,
    );
    expect(root.style.getPropertyValue('--uptiq-training-border')).toBe(defaultTheme.border);
    expect(root.style.getPropertyValue('--uptiq-training-radius')).toBe(defaultTheme.radius);
    expect(root.style.getPropertyValue('--uptiq-training-shadow')).toBe(defaultTheme.shadow);
    expect(root.style.getPropertyValue('--uptiq-training-font-family')).toBe(
      defaultTheme.fontFamily,
    );
    expect(root.style.getPropertyValue('--uptiq-training-font-size')).toBe(defaultTheme.fontSize);
  });

  it('overrides only the tokens the caller supplies (rest fall back to defaults)', () => {
    applyTheme({ primary: '#ff0000', radius: '2px' }, root);
    expect(root.style.getPropertyValue('--uptiq-training-primary')).toBe('#ff0000');
    expect(root.style.getPropertyValue('--uptiq-training-radius')).toBe('2px');
    // Untouched tokens still come from defaultTheme.
    expect(root.style.getPropertyValue('--uptiq-training-background')).toBe(
      defaultTheme.background,
    );
  });

  it('skips tokens that are explicitly undefined', () => {
    // Note: only tokens missing from the caller's object take defaults; tokens
    // explicitly set to `undefined` are treated as "do not write."
    applyTheme({ primary: undefined }, root);
    // Primary reverts to the default merged-in value (spread of defaults wins over undefined? no —
    // { ...defaultTheme, primary: undefined } produces primary: undefined, and setVar skips it).
    expect(root.style.getPropertyValue('--uptiq-training-primary')).toBe('');
  });

  it('defaults to document.documentElement when no root is passed', () => {
    // Snapshot original values so we can restore.
    const before = document.documentElement.style.getPropertyValue('--uptiq-training-primary');
    try {
      applyTheme({ primary: '#123456' });
      expect(document.documentElement.style.getPropertyValue('--uptiq-training-primary')).toBe(
        '#123456',
      );
    } finally {
      document.documentElement.style.setProperty('--uptiq-training-primary', before);
    }
  });

  it('applies the aiPlatformTheme exports as a full theme', () => {
    applyTheme(aiPlatformTheme, root);
    expect(root.style.getPropertyValue('--uptiq-training-primary')).toBe(aiPlatformTheme.primary);
    expect(root.style.getPropertyValue('--uptiq-training-font-family')).toBe(
      aiPlatformTheme.fontFamily,
    );
  });
});
