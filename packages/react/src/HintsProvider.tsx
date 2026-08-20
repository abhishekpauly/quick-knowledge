/**
 * HintsProvider — loads hints into React context so <TrainingHint> can find them.
 *
 * Mounted alongside <TourProvider>. Hints are cheap to load; the whole set
 * fits in a single JSON object per product.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Hint, HintsFile } from '@uptiq/training-sdk';

interface HintsContextValue {
  hintsById: Map<string, Hint>;
}

export const HintsContext = createContext<HintsContextValue | null>(null);
HintsContext.displayName = 'HintsContext';

export interface HintsProviderProps {
  hints: HintsFile;
  children: ReactNode;
}

export function HintsProvider({ hints, children }: HintsProviderProps): JSX.Element {
  const value = useMemo(() => ({ hintsById: new Map(hints.hints.map((h) => [h.id, h])) }), [hints]);
  return <HintsContext.Provider value={value}>{children}</HintsContext.Provider>;
}

/** Internal — used by <TrainingHint>. */
export function useHintsContext(): HintsContextValue {
  const ctx = useContext(HintsContext);
  if (!ctx) {
    throw new Error(
      '<TrainingHint> requires a <HintsProvider>. Add <HintsProvider hints={...}> to your app root.',
    );
  }
  return ctx;
}
