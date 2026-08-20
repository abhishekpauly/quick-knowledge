/**
 * useTourProgress — reactive per-tour progress. Vue composable.
 */
import { inject, ref, onBeforeUnmount, type Ref } from 'vue';
import type { TourProgress } from '@uptiq/training-sdk';
import { TrainerKey } from './inject-keys.js';

export function useTourProgress(tourId: string): Ref<TourProgress> {
  const trainer = inject(TrainerKey);
  if (!trainer) {
    throw new Error(
      'useTourProgress() must be called inside <TourProvider>. Wrap your app in <TourProvider :trainer="...">.',
    );
  }

  const progress = ref<TourProgress>(trainer.getProgress(tourId));

  const refresh = (): void => {
    progress.value = trainer.getProgress(tourId);
  };

  const offs = [
    trainer.on('tour_started', (e) => e.payload.tourId === tourId && refresh()),
    trainer.on('step_viewed', (e) => e.payload.tourId === tourId && refresh()),
    trainer.on('tour_completed', (e) => e.payload.tourId === tourId && refresh()),
    trainer.on('tour_dismissed', (e) => e.payload.tourId === tourId && refresh()),
  ];

  onBeforeUnmount(() => offs.forEach((off) => off()));

  return progress;
}
