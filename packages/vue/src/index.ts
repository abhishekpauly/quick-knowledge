/**
 * Public API for @in-app-training/vue.
 *
 * API parity with @in-app-training/react — same names, same shapes, different
 * framework idioms. Devs moving between codebases should have no cognitive load.
 */
export { TourProvider } from './TourProvider.js';
export { useTour, type UseTourResult } from './useTour.js';
export { useTourProgress } from './useTourProgress.js';
export { useAllTourProgress } from './useAllTourProgress.js';
export { FirstRunTour } from './FirstRunTour.js';
export { TrainingChecklist } from './TrainingChecklist.js';
export { HintsProvider } from './HintsProvider.js';
export { TrainingHint } from './TrainingHint.js';
export { TrainerKey, HintsKey } from './inject-keys.js';
