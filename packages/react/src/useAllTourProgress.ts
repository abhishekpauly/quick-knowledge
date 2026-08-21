/**
 * useAllTourProgress — a single reactive read of progress for every registered tour.
 *
 * Returns a Map<tourId, TourProgress>. Re-renders when any progress-affecting
 * event fires. Preferred over N × useTourProgress calls in a loop, which
 * violates the Rules of Hooks when the tour list is dynamic.
 *
 * Sprint 5 addition.
 */
import { useContext, useEffect, useState } from 'react';
import type { TourProgress } from '@in-app-training/sdk';
import { TrainerContext } from './context.js';

export function useAllTourProgress(): Map<string, TourProgress> {
  const trainer = useContext(TrainerContext);
  if (!trainer) {
    throw new Error(
      'useAllTourProgress() must be called inside <TourProvider>. Wrap your app in <TourProvider trainer={...}>.',
    );
  }

  const compute = (): Map<string, TourProgress> => {
    const map = new Map<string, TourProgress>();
    for (const tour of trainer.getTours()) {
      map.set(tour.id, trainer.getProgress(tour.id));
    }
    return map;
  };

  const [progress, setProgress] = useState<Map<string, TourProgress>>(compute);

  useEffect(() => {
    const refresh = (): void => setProgress(compute());
    const offs = [
      trainer.on('tour_started', refresh),
      trainer.on('step_viewed', refresh),
      trainer.on('tour_completed', refresh),
      trainer.on('tour_dismissed', refresh),
    ];
    return () => offs.forEach((off) => off());
    // The `compute` closure captures `trainer`, so re-run this effect if trainer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainer]);

  return progress;
}
