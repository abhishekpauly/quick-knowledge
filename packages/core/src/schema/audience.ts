/**
 * Audience matching — evaluates a tour's `audience` field against user
 * attributes passed via TrainerConfig.userAttributes.
 *
 * Semantics:
 *   - Every atom is a key:value predicate. All atoms must match (AND).
 *   - `key:value` requires userAttributes[key] === value (string-compared).
 *   - `!key:value` requires userAttributes[key] !== value.
 *   - Missing user attribute makes a positive atom fail; makes a negative atom pass.
 *   - Empty audience array or omitted field → tour qualifies for everyone.
 *
 * We keep this simple by design. Complex boolean logic (OR, nested groups) can
 * be added when a real UPTIQ product needs it — likely in v0.5 with segments.
 */

export type UserAttributes = Record<string, string | number | boolean>;

export function matchesAudience(
  audience: readonly string[] | undefined,
  attributes: UserAttributes | undefined,
): boolean {
  if (!audience || audience.length === 0) return true;
  const attrs = attributes ?? {};
  return audience.every((atom) => matchAtom(atom, attrs));
}

function matchAtom(atom: string, attrs: UserAttributes): boolean {
  const negate = atom.startsWith('!');
  const body = negate ? atom.slice(1) : atom;
  const idx = body.indexOf(':');
  // Schema guarantees a colon; if it slipped through, fail closed.
  if (idx <= 0) return false;
  const key = body.slice(0, idx);
  const expected = body.slice(idx + 1);
  const actual = attrs[key];
  const equals = actual !== undefined && String(actual) === expected;
  return negate ? !equals : equals;
}
