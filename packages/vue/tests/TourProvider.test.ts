/**
 * TourProvider (Vue) tests — provider error paths and theme application.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, inject } from 'vue';
import { TourProvider } from '../src/TourProvider.js';
import { TrainerKey } from '../src/inject-keys.js';
import type { Trainer } from '@uptiq/training-sdk';

function stubTrainer(): Trainer {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    on: vi.fn(() => () => {}),
    getProgress: vi.fn(() => ({ tourId: '', status: 'not-started', currentStepIndex: 0 })),
    getActiveTourId: vi.fn(() => null),
    getTours: vi.fn(() => []),
  } as unknown as Trainer;
}

const Child = defineComponent({
  setup() {
    const trainer = inject(TrainerKey);
    return () => h('div', { 'data-testid': 'child' }, trainer ? 'has-trainer' : 'no-trainer');
  },
});

describe('TourProvider (Vue)', () => {
  it('provides the trainer to descendants', () => {
    const trainer = stubTrainer();
    const wrapper = mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(Child) },
    });
    expect(wrapper.text()).toContain('has-trainer');
  });

  it('applies the theme to documentElement on mount', () => {
    const trainer = stubTrainer();
    mount(TourProvider, {
      props: { trainer, theme: { primary: '#ff00ff' } },
      slots: { default: () => h('div', 'child') },
    });
    expect(document.documentElement.style.getPropertyValue('--uptiq-training-primary')).toBe('#ff00ff');
  });
});
