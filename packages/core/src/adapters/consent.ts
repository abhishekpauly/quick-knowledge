/**
 * ConsentAdapter — Sprint 12 · implements ADR-0006.
 *
 * Reactive plug for the host's consent framework. When wired, the trainer
 * uses it to gate tour execution and analytics emission by category.
 */

export type ConsentCategory = 'strictly-necessary' | 'functional' | 'analytics' | 'marketing';

export interface ConsentDecision {
  granted: ReadonlyArray<ConsentCategory>;
}

export interface ConsentAdapter {
  /** Current decision — synchronous. */
  read(): ConsentDecision;
  /** Optional: subscribe to changes. Return an unsubscribe. */
  subscribe?(listener: (decision: ConsentDecision) => void): () => void;
}

export function isCategoryAllowed(
  category: ConsentCategory | undefined,
  decision: ConsentDecision,
): boolean {
  const c = category ?? 'functional';
  if (c === 'strictly-necessary') return true;
  return decision.granted.includes(c);
}
