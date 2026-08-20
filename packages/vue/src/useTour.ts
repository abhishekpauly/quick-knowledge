/**
 * useTour — Vue composable mirroring the React hook.
 *
 * Returns reactive refs for activeTourId + isActive, plus start/stop/next/prev
 * bound to the injected trainer. Throws a clear error if used outside a
 * <TourProvider>.
 */
import { inject, ref, onBeforeUnmount, computed, type Ref, type ComputedRef } from 'vue';
import { TrainerKey } from './inject-keys.js';

export interface UseTourResult {
  start: (tourId: string, triggerSource?: 'manual' | 'first-run' | 'url' | 'event') => Promise<void>;
  stop: () => void;
  next: () => void;
  prev: () => void;
  activeTourId: Ref<string | null>;
  isActive: ComputedRef<boolean>;
}

export function useTour(): UseTourResult {
  const trainer = inject(TrainerKey);
  if (!trainer) {
    throw new Error(
      'useTour() must be called inside <TourProvider>. Wrap your app in <TourProvider :trainer="...">.',
    );
  }

  const activeTourId = ref<string | null>(trainer.getActiveTourId());

  const offStarted = trainer.on('tour_started', (e) => (activeTourId.value = e.payload.tourId));
  const offCompleted = trainer.on('tour_completed', () => (activeTourId.value = null));
  const offDismissed = trainer.on('tour_dismissed', () => (activeTourId.value = null));

  onBeforeUnmount(() => {
    offStarted();
    offCompleted();
    offDismissed();
  });

  return {
    start: (tourId, triggerSource = 'manual') => trainer.start(tourId, triggerSource),
    stop: () => trainer.stop(),
    next: () => trainer.next(),
    prev: () => trainer.prev(),
    activeTourId,
    isActive: computed(() => activeTourId.value !== null),
  };
}
