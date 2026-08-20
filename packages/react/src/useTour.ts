/**
 * useTour — trigger tours and read active-tour state.
 *
 * Reactive: `activeTourId` and `isActive` update when a tour starts, completes,
 * or dismisses. Subscribe/unsubscribe follows the component lifecycle.
 *
 * Throws a clear error if used outside <TourProvider>.
 */
import { useCallback, useContext, useEffect, useState } from 'react';
import { TrainerContext } from './context.js';

export interface UseTourResult {
  /** Start a tour by id. Optional trigger source is passed through to analytics. */
  start: (
    tourId: string,
    triggerSource?: 'manual' | 'first-run' | 'url' | 'event',
  ) => Promise<void>;
  /** Stop the active tour (emits tour_dismissed). No-op if nothing is active. */
  stop: () => void;
  /** Advance to the next step manually. Rarely needed — the tour's own Next button does this. */
  next: () => void;
  /** Go back one step. */
  prev: () => void;
  /** The id of the currently active tour, or null. Reactive. */
  activeTourId: string | null;
  /** Whether any tour is currently active. Reactive. */
  isActive: boolean;
}

export function useTour(): UseTourResult {
  const trainer = useContext(TrainerContext);
  if (!trainer) {
    throw new Error(
      'useTour() must be called inside <TourProvider>. Wrap your app in <TourProvider trainer={...}>.',
    );
  }

  const [activeTourId, setActiveTourId] = useState<string | null>(trainer.getActiveTourId());

  useEffect(() => {
    const offStarted = trainer.on('tour_started', (e) => setActiveTourId(e.payload.tourId));
    const offCompleted = trainer.on('tour_completed', () => setActiveTourId(null));
    const offDismissed = trainer.on('tour_dismissed', () => setActiveTourId(null));
    return () => {
      offStarted();
      offCompleted();
      offDismissed();
    };
  }, [trainer]);

  const start = useCallback(
    (tourId: string, triggerSource: 'manual' | 'first-run' | 'url' | 'event' = 'manual') => {
      return trainer.start(tourId, triggerSource);
    },
    [trainer],
  );

  const stop = useCallback(() => trainer.stop(), [trainer]);
  const next = useCallback(() => trainer.next(), [trainer]);
  const prev = useCallback(() => trainer.prev(), [trainer]);

  return { start, stop, next, prev, activeTourId, isActive: activeTourId !== null };
}
