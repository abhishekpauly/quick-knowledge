/**
 * <FirstRunTour tourId="..." /> — declarative first-run auto-start.
 *
 * Mounts once at the app root inside <TourProvider>. On mount, checks progress
 * for the tour; if the user has never started it, starts it with
 * triggerSource="first-run".
 *
 * Prefer this over `useEffect(() => trainer.start(...), [])` in a component
 * because the component's placement makes intent obvious and avoids stray
 * hooks scattered across the app.
 */
import { useEffect } from 'react';
import { useTour } from './useTour.js';
import { useTourProgress } from './useTourProgress.js';

export interface FirstRunTourProps {
  /** The tour id to auto-start on first mount if not yet completed or dismissed. */
  tourId: string;
  /** Optional delay in ms before starting, to let the app finish painting. Default 0. */
  delayMs?: number;
}

/**
 * Renders nothing. Side-effect-only component.
 */
export function FirstRunTour({ tourId, delayMs = 0 }: FirstRunTourProps): null {
  const { start } = useTour();
  const progress = useTourProgress(tourId);

  useEffect(() => {
    if (progress.status !== 'not-started') return;
    if (delayMs === 0) {
      void start(tourId, 'first-run');
      return;
    }
    const handle = setTimeout(() => {
      void start(tourId, 'first-run');
    }, delayMs);
    return () => clearTimeout(handle);
    // Depend only on tourId + delayMs, NOT on progress — otherwise the tour would
    // restart every time progress changes. The initial `not-started` check is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, delayMs]);

  return null;
}
