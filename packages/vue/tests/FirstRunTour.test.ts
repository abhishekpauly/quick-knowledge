/**
 * FirstRunTour (Vue) tests — mirror of the React FirstRunTour tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
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
    getTours: vi.fn(() => []),
  } as unknown as Trainer;
  return { trainer, emit };
}

const Host = defineComponent({
  props: { tourId: { type: String, required: true }, delayMs: { type: Number, default: 0 } },
  setup(props) {
    return () => h(FirstRunTour, { tourId: props.tourId, delayMs: props.delayMs });
  },
});

describe('FirstRunTour (Vue)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing visible (setup returns () => null → Comment placeholder)', () => {
    const { trainer } = stubTrainer();
    const wrapper = mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding' }) },
    });
    // Vue represents a null render as a Comment node — no visible text or elements.
    const el = wrapper.findComponent(FirstRunTour).element as Node;
    expect(el.nodeType).toBe(Node.COMMENT_NODE);
    expect(wrapper.text()).toBe('');
  });

  it("starts the tour on mount when progress is 'not-started'", () => {
    const { trainer } = stubTrainer('not-started');
    mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding' }) },
    });
    expect(trainer.start).toHaveBeenCalledWith('onboarding', 'first-run');
  });

  it('does NOT start when the tour is already in-progress', () => {
    const { trainer } = stubTrainer('in-progress');
    mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding' }) },
    });
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('does NOT start when the tour is already completed', () => {
    const { trainer } = stubTrainer('completed');
    mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding' }) },
    });
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('does NOT start when the tour was dismissed', () => {
    const { trainer } = stubTrainer('dismissed');
    mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding' }) },
    });
    expect(trainer.start).not.toHaveBeenCalled();
  });

  it('defers the start by delayMs when specified', () => {
    const { trainer } = stubTrainer();
    mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding', delayMs: 500 }) },
    });
    expect(trainer.start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(trainer.start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(trainer.start).toHaveBeenCalledWith('onboarding', 'first-run');
  });

  it('cancels the deferred start if the component unmounts first', () => {
    const { trainer } = stubTrainer();
    const wrapper = mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Host, { tourId: 'onboarding', delayMs: 500 }) },
    });
    wrapper.unmount();
    vi.advanceTimersByTime(1000);
    expect(trainer.start).not.toHaveBeenCalled();
  });
});
