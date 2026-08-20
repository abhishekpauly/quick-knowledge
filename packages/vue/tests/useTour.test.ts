/**
 * useTour (Vue composable) tests — reactive activeTourId + cleanup on unmount.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { TourProvider } from '../src/TourProvider.js';
import { useTour } from '../src/useTour.js';
import type {
  Trainer,
  TrainingEventName,
  EventListener,
  TrainingEvent,
} from '@uptiq/training-sdk';

function stubTrainer() {
  const listeners = new Map<TrainingEventName, Set<EventListener>>();
  const emit = (event: TrainingEvent): void => {
    listeners.get(event.name)?.forEach((l) => (l as EventListener)(event as never));
  };
  let active: string | null = null;
  const trainer = {
    start: vi.fn(async (id: string) => {
      active = id;
      emit({
        name: 'tour_started',
        payload: {
          tourId: id,
          product: 'test',
          triggerSource: 'manual',
          timestamp: new Date().toISOString(),
        },
      });
    }),
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
    getProgress: vi.fn(() => ({ tourId: '', status: 'not-started', currentStepIndex: 0 })),
    getActiveTourId: vi.fn(() => active),
    getTours: vi.fn(() => []),
  } as unknown as Trainer;
  return { trainer, emit };
}

describe('useTour (Vue)', () => {
  it('exposes reactive activeTourId that updates when a tour starts', async () => {
    const { trainer } = stubTrainer();
    const Consumer = defineComponent({
      setup() {
        const { start, activeTourId, isActive } = useTour();
        return { start, activeTourId, isActive };
      },
      render() {
        return h('div', [
          h('span', { 'data-testid': 'active' }, this.activeTourId ?? 'none'),
          h('span', { 'data-testid': 'is-active' }, String(this.isActive)),
        ]);
      },
    });
    const wrapper = mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Consumer, { ref: 'child' }) },
    });
    expect(wrapper.get('[data-testid="active"]').text()).toBe('none');
    expect(wrapper.get('[data-testid="is-active"]').text()).toBe('false');

    const child = wrapper.findComponent(Consumer);
    await child.vm.start('some-tour');
    await flushPromises();

    expect(wrapper.get('[data-testid="active"]').text()).toBe('some-tour');
    expect(wrapper.get('[data-testid="is-active"]').text()).toBe('true');
  });
});
