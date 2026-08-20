/**
 * Personalization — Mustache-style `{{path.to.value}}` interpolation into
 * step body / title / description.
 *
 * Draws from TrainerConfig.userAttributes. Values are HTML-escaped before
 * interpolation so a hostile attribute value can't inject markup into a
 * tooltip. Unknown keys resolve to empty string with a dev-mode console warning.
 *
 * Supported path forms:
 *   {{user.firstName}} — dotted path into a nested attribute object
 *   {{firstName}}      — top-level shortcut
 *
 * We do NOT support helpers, loops, or conditionals. If we ever need those,
 * swap for a real templating engine — but for MVP, keep the surface tiny.
 */

const TEMPLATE_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

// Attribute type alias — same shape as UserAttributes but tolerant of nesting
// for dotted paths like `user.firstName`.
export type PersonalizationContext = Record<string, unknown>;

const IS_DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

export function personalize(text: string, ctx: PersonalizationContext | undefined): string {
  if (!ctx) return text;
  return text.replace(TEMPLATE_RE, (_full, path: string) => {
    const value = resolvePath(ctx, path);
    if (value === undefined) {
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `[training-sdk] personalization: unknown path "{{${path}}}" — inserted empty string`,
        );
      }
      return '';
    }
    return escapeHtml(String(value));
  });
}

function resolvePath(ctx: PersonalizationContext, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = ctx;
  for (const part of parts) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
    if (cursor === undefined) return undefined;
  }
  return cursor;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}
