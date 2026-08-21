/**
 * Vue provide/inject keys.
 *
 * Typed InjectionKey means components that use these get compile-time errors
 * if a required provider is missing at the type level, and clean errors at
 * runtime if the runtime lookup fails.
 */
import type { InjectionKey } from 'vue';
import type { Trainer, HintsFile } from '@in-app-training/sdk';

export const TrainerKey: InjectionKey<Trainer> = Symbol('in-app-training-trainer');
export const HintsKey: InjectionKey<{ hintsById: Map<string, HintsFile['hints'][number]> }> =
  Symbol('in-app-training-hints');
