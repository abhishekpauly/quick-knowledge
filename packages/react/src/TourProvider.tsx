/**
 * TourProvider — mount once at the app root.
 *
 * Puts the Trainer instance into React context so hooks can find it. Also
 * applies the theme's CSS variables to the provided root element (defaults to
 * documentElement) so tooltip styling works without importing any CSS.
 *
 * Usage:
 *
 *   const trainer = new Trainer({...});
 *
 *   <TourProvider trainer={trainer}>
 *     <App />
 *   </TourProvider>
 */
import { useEffect, type ReactNode } from 'react';
import type { Trainer, Theme } from '@in-app-training/sdk';
import { applyTheme } from '@in-app-training/sdk';
import { TrainerContext } from './context.js';

export interface TourProviderProps {
  /** The Trainer instance. Construct it once at the app root. */
  trainer: Trainer;
  /** Theme tokens. If provided, applied as CSS variables to the theme root. */
  theme?: Theme;
  /** Element to apply theme CSS variables to. Defaults to documentElement. */
  themeRoot?: HTMLElement;
  children: ReactNode;
}

export function TourProvider({
  trainer,
  theme,
  themeRoot,
  children,
}: TourProviderProps): JSX.Element {
  // Apply theme on mount and whenever it changes. Safe to run in effect (SSR-friendly).
  useEffect(() => {
    if (!theme) return;
    if (typeof document === 'undefined') return;
    applyTheme(theme, themeRoot ?? document.documentElement);
  }, [theme, themeRoot]);

  if (!trainer) {
    throw new Error(
      '<TourProvider> requires a `trainer` prop. Construct a Trainer instance and pass it in.',
    );
  }

  return <TrainerContext.Provider value={trainer}>{children}</TrainerContext.Provider>;
}
