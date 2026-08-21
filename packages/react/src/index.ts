/**
 * Public API for @in-app-training/react.
 *
 * Everything here is part of the stable contract. Removing or renaming an
 * export is a MAJOR bump.
 */
export { TourProvider, type TourProviderProps } from './TourProvider.js';
export { useTour, type UseTourResult } from './useTour.js';
export { useTourProgress } from './useTourProgress.js';
export { useAllTourProgress } from './useAllTourProgress.js';
export { FirstRunTour, type FirstRunTourProps } from './FirstRunTour.js';
export { TrainingChecklist, type TrainingChecklistProps } from './TrainingChecklist.js';
export { HintsProvider, type HintsProviderProps } from './HintsProvider.js';
export { TrainingHint, type TrainingHintProps } from './TrainingHint.js';

// Sprint 09 (T-112) — Pins.
export { PinsProvider, Pin, type PinsProviderProps } from './PinsProvider.js';
