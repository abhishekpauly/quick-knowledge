/**
 * FirstRunTour tests — auto-start behavior on mount, delay handling,
 * suppression when the tour has been started/completed/dismissed already.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { TourProvider } from '../src/TourProvider.js';
import { FirstRunTour } from '../src/FirstRunTour.js';
import type {
  Trainer,
  TrainingEventName,
  EventListener,
  TrainingEvent,
  TourProgress,
} from '@uptiq/training-sdk';

function stubTrainer(initialStatus: TourProgress['status'] = 'not-started') {
  const listeners = new Map<TrainingEventName, Set<EventListener>>();
  const emit = (event: TrainingEvent): void => {
    listeners.get(event.name)?.forEach((l) => (l as EventListener)(event as never));
  };
  const trainer = {
    start: vi.fn(async () => {}),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    on: vi.fn(<N extends TrainingEventName>(name: N, listener: EventListener<N>) => {
      let set = listeners.get(name);
      if (!set) {
        set = new Set();
        listeners.set(name, set);
      }
      set.add(listener as unknown as EventListener);
      return () => set!.delete(listener as unknown as EventListener);
    }),
    getProgress: vi.fn((tourId: string): TourProgress => ({
      tourId,
      status: initialStatus,
      currentStepIndex: 0,
    })),
    getActiveTourId: vi.fn(() => null),
  } as unknown as Trainer;
  return { trainer, emit };
}

describe('FirstRunTour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing', () => {
    const { trainer } = stubTrainer();
    const { container } = render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" />
      </TourProvider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it("starts the tour on mount when progress is 'not-started'", () => {
    const { trainer } = stubTrainer('not-started');
    render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" />
      </TourProvider>,
    );
    expect(trainer.start).toHaveBeenCalledWith('onboarding', 'first-run');
  });

  it('does NOT start when the tour is already in-progress', () => {
    const { trainer } = stubTrainer('in-progress');
    render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" />
      </TourProvider>,
    );
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('does NOT start when the tour is already completed', () => {
    const { trainer } = stubTrainer('completed');
    render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" />
      </TourProvider>,
    );
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('does NOT start when the tour was dismissed', () => {
    const { trainer } = stubTrainer('dismissed');
    render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" />
      </TourProvider>,
    );
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('defers the start by delayMs when specified', () => {
    const { trainer } = stubTrainer();
    render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" delayMs={500} />
      </TourProvider>,
    );
    // Not called synchronously.
    expect(trainer.start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(trainer.start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(trainer.start).toHaveBeenCalledWith('onboarding', 'first-run');
  });

  it('cancels the deferred start if the component unmounts first', () => {
    const { trainer } = stubTrainer();
    const { unmount } = render(
      <TourProvider trainer={trainer}>
        <FirstRunTour tourId="onboarding" delayMs={500} />
      </TourProvider>,
    );
    unmount();
    vi.advanceTimersByTime(1000);
    expect(trainer.start).not.toHaveBeenCalled();
  });
});
