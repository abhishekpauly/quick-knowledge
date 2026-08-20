/**
 * useTourProgress — reactive read of a specific tour's progress.
 *
 * Re-renders whenever the underlying trainer emits a lifecycle event for
 * this tour. Use in checklist widgets, "you're 3 of 5 done" badges, or
 * conditional rendering ("show upgrade CTA only after workflow tour done").
 */
import { useContext, useEffect, useState } from 'react';
import type { TourProgress } from '@uptiq/training-sdk';
import { TrainerContext } from './context.js';

export function useTourProgress(tourId: string): TourProgress {
  const trainer = useContext(TrainerContext);
  if (!trainer) {
    throw new Error(
      'useTourProgress() must be called inside <TourProvider>. Wrap your app in <TourProvider trainer={...}>.',
    );
  }

  const [progress, setProgress] = useState<TourProgress>(() => trainer.getProgress(tourId));

  useEffect(() => {
    const refresh = () => setProgress(trainer.getProgress(tourId));
    // Refresh on any event that could change progress for THIS tour.
    // Filtering by tourId inside the handler keeps the code simple; the trainer's
    // event volume is low enough that this is fine.
    const offs = [
      trainer.on('tour_started', (e) => e.payload.tourId === tourId && refresh()),
      trainer.on('step_viewed', (e) => e.payload.tourId === tourId && refresh()),
      trainer.on('tour_completed', (e) => e.payload.tourId === tourId && refresh()),
      trainer.on('tour_dismissed', (e) => e.payload.tourId === tourId && refresh()),
    ];
    return () => offs.forEach((off) => off());
  }, [trainer, tourId]);

  return progress;
}
