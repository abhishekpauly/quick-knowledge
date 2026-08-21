/**
 * Vue provide/inject keys.
 *
 * Typed InjectionKey means components that use these get compile-time errors
 * if a required provider is missing at the type level, and clean errors at
 * runtime if the runtime lookup fails.
 */
import type { InjectionKey } from 'vue';
import type { Trainer, HintsFile, Pin, Analytics } from '@in-app-training/sdk';

export const TrainerKey: InjectionKey<Trainer> = Symbol('in-app-training-trainer');
export const HintsKey: InjectionKey<{ hintsById: Map<string, HintsFile['hints'][number]> }> =
  Symbol('in-app-training-hints');

/**
 * Sprint 09 (T-113). Provides access to the pins registry + dismiss action so
 * the `<Pin>` escape-hatch component can render outside the auto-portal.
 */
export interface PinsContextValue {
  pinsById: Map<string, Pin>;
  isDismissed(id: string): boolean;
  dismiss(id: string): void;
  locale: string;
  analytics?: Analytics;
}
export const PinsKey: InjectionKey<PinsContextValue> = Symbol('in-app-training-pins');
