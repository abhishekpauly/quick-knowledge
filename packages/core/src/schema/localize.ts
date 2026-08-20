/**
 * Localized-string resolver.
 *
 * A LocalizedString is either a plain string or a `{ locale: string }` map.
 * The resolver picks a value based on TrainerConfig.locale with this fallback:
 *
 *   1. Exact match — `locale = "es-MX"` picks `map["es-MX"]`.
 *   2. Language-only fallback — `locale = "es-MX"` falls back to `map["es"]`.
 *   3. First key in the map — deterministic (Object.keys order), used as last resort.
 *   4. Plain-string LocalizedStrings return as-is.
 *
 * Missing keys never throw. Content is user-facing; better to render a fallback
 * language than to crash.
 */
import type { LocalizedString } from './v1.js';

export function resolveLocale(value: LocalizedString | undefined, locale?: string): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;

  // Object form. Try locale, then language fallback, then first key.
  if (locale) {
    if (value[locale]) return value[locale];
    const dash = locale.indexOf('-');
    if (dash > 0) {
      const lang = locale.slice(0, dash);
      if (value[lang]) return value[lang];
    }
  }
  const firstKey = Object.keys(value)[0];
  return firstKey ? value[firstKey]! : '';
}
