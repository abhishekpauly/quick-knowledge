/**
 * useAllTourProgress — reactive Map<tourId, TourProgress> for every registered tour.
 * Vue counterpart of the React hook of the same name. Powers the checklist widget.
 */
import { inject, ref, onBeforeUnmount, type Ref } from 'vue';
import type { TourProgress } from '@uptiq/training-sdk';
import { TrainerKey } from './inject-keys.js';

export function useAllTourProgress(): Ref<Map<string, TourProgress>> {
  const trainer = inject(TrainerKey);
  if (!trainer) {
    throw new Error(
      'useAllTourProgress() must be called inside <TourProvider>. Wrap your app in <TourProvider :trainer="...">.',
    );
  }

  const compute = (): Map<string, TourProgress> => {
    const map = new Map<string, TourProgress>();
    for (const tour of trainer.getTours()) {
      map.set(tour.id, trainer.getProgress(tour.id));
    }
    return map;
  };

  const progress = ref<Map<string, TourProgress>>(compute());
  const refresh = (): void => {
    progress.value = compute();
  };

  const offs = [
    trainer.on('tour_started', refresh),
    trainer.on('step_viewed', refresh),
    trainer.on('tour_completed', refresh),
    trainer.on('tour_dismissed', refresh),
  ];
  onBeforeUnmount(() => offs.forEach((off) => off()));

  return progress;
}
