/**
 * useTourProgress tests — reactive progress readout for a single tour.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TourProvider } from '../src/TourProvider.js';
import { useTourProgress } from '../src/useTourProgress.js';
import type {
  Trainer,
  TourProgress,
  TrainingEventName,
  EventListener,
  TrainingEvent,
} from '@uptiq/training-sdk';

function stubTrainer(initial: TourProgress) {
  const listeners = new Map<TrainingEventName, Set<EventListener>>();
  const state = { current: initial };
  const emit = (event: TrainingEvent): void => {
    listeners.get(event.name)?.forEach((l) => (l as EventListener)(event as never));
  };
  const trainer = {
    getProgress: vi.fn(() => state.current),
    on: vi.fn(<N extends TrainingEventName>(name: N, listener: EventListener<N>) => {
      let set = listeners.get(name);
      if (!set) {
        set = new Set();
        listeners.set(name, set);
      }
      set.add(listener as EventListener);
      return () => set!.delete(listener as EventListener);
    }),
  } as unknown as Trainer;
  return { trainer, emit, state };
}

function wrap(trainer: Trainer): (props: { children: ReactNode }) => JSX.Element {
  return function Wrapper({ children }) {
    return <TourProvider trainer={trainer}>{children}</TourProvider>;
  };
}

describe('useTourProgress', () => {
  it('returns initial progress on mount', () => {
    const { trainer } = stubTrainer({
      tourId: 't',
      status: 'not-started',
      currentStepIndex: 0,
    });
    const { result } = renderHook(() => useTourProgress('t'), { wrapper: wrap(trainer) });
    expect(result.current.status).toBe('not-started');
  });

  it('updates when trainer emits a step_viewed for this tour', () => {
    const { trainer, emit, state } = stubTrainer({
      tourId: 't',
      status: 'not-started',
      currentStepIndex: 0,
    });
    const { result } = renderHook(() => useTourProgress('t'), { wrapper: wrap(trainer) });
    act(() => {
      state.current = { tourId: 't', status: 'in-progress', currentStepIndex: 2 };
      emit({
        name: 'step_viewed',
        payload: { tourId: 't', stepId: 's', stepIndex: 2, totalSteps: 5, timestamp: '' },
      });
    });
    expect(result.current.status).toBe('in-progress');
    expect(result.current.currentStepIndex).toBe(2);
  });

  it('ignores events for other tours', () => {
    const { trainer, emit, state } = stubTrainer({
      tourId: 't',
      status: 'not-started',
      currentStepIndex: 0,
    });
    const { result } = renderHook(() => useTourProgress('t'), { wrapper: wrap(trainer) });
    act(() => {
      state.current = { tourId: 't', status: 'in-progress', currentStepIndex: 1 };
      // Emit event for a DIFFERENT tour — hook should not refresh.
      emit({
        name: 'step_viewed',
        payload: {
          tourId: 'other',
          stepId: 's',
          stepIndex: 0,
          totalSteps: 3,
          timestamp: '',
        },
      });
    });
    expect(result.current.status).toBe('not-started');
  });
});
