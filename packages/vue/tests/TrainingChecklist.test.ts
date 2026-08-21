/**
 * TrainingChecklist (Vue) tests — smoke coverage mirroring the React suite.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { TourProvider } from '../src/TourProvider.js';
import { TrainingChecklist } from '../src/TrainingChecklist.js';
import type { Trainer, Tour, TourProgress } from '@in-app-training/sdk';

function tour(id: string, difficulty: Tour['difficulty']): Tour {
  return {
    schemaVersion: 'v1',
    id,
    product: 'p',
    title: `Tour ${id}`,
    difficulty,
    triggers: [{ type: 'manual' }],
    steps: [{ id: 's', target: '[data-tour="x"]', placement: 'bottom', body: 'b' }],
  };
}

function stubTrainer(tours: Tour[], progressMap: Record<string, TourProgress> = {}): Trainer {
  return {
    getTours: () => tours,
    getProgress: (id: string) =>
      progressMap[id] ?? { tourId: id, status: 'not-started', currentStepIndex: 0 },
    getActiveTourId: () => null,
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    on: () => () => {},
  } as unknown as Trainer;
}

function mountWith(trainer: Trainer) {
  return mount(TourProvider, {
    props: { trainer },
    slots: { default: () => h(TrainingChecklist) },
    attachTo: document.body,
  });
}

describe('TrainingChecklist (Vue)', () => {
  it('renders the collapsed pill by default', () => {
    const trainer = stubTrainer([tour('t1', 'onboarding')]);
    const wrapper = mountWith(trainer);
    expect(document.querySelector('[data-testid="training-checklist-pill"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('renders nothing when there are no tours', () => {
    const trainer = stubTrainer([]);
    const wrapper = mountWith(trainer);
    expect(document.querySelector('[data-testid="training-checklist-pill"]')).toBeNull();
    wrapper.unmount();
  });

  it('expands to a panel on pill click', async () => {
    const trainer = stubTrainer([tour('a', 'onboarding'), tour('b', 'basic')]);
    const wrapper = mountWith(trainer);
    expect(document.querySelector('[data-testid="training-checklist-panel"]')).toBeNull();
    const pill = document.querySelector('[data-testid="training-checklist-pill"]') as HTMLElement;
    pill.click();
    await wrapper.vm.$nextTick();
    expect(document.querySelector('[data-testid="training-checklist-panel"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('renders items for every registered tour', async () => {
    const trainer = stubTrainer([
      tour('a', 'onboarding'),
      tour('b', 'basic'),
      tour('c', 'advanced'),
    ]);
    const wrapper = mountWith(trainer);
    (document.querySelector('[data-testid="training-checklist-pill"]') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    expect(document.querySelector('[data-testid="training-checklist-item-a"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="training-checklist-item-b"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="training-checklist-item-c"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('locks items whose prerequisites are not met', async () => {
    const gated: Tour = { ...tour('gated', 'intermediate'), prerequisites: ['a'] };
    const trainer = stubTrainer([tour('a', 'basic'), gated]);
    const wrapper = mountWith(trainer);
    (document.querySelector('[data-testid="training-checklist-pill"]') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    const item = document.querySelector(
      '[data-testid="training-checklist-item-gated"]',
    ) as HTMLButtonElement;
    expect(item.disabled).toBe(true);
    wrapper.unmount();
  });

  it('clicks an unlocked row and starts the tour with a trigger source', async () => {
    const rich: Tour = {
      ...tour('rich', 'basic'),
      description: 'A short description',
      estimatedMinutes: 5,
    };
    const trainer = stubTrainer([rich]);
    const wrapper = mountWith(trainer);
    (document.querySelector('[data-testid="training-checklist-pill"]') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    expect(document.body.textContent).toContain('A short description');
    expect(document.body.textContent).toContain('5m');
    const item = document.querySelector(
      '[data-testid="training-checklist-item-rich"]',
    ) as HTMLButtonElement;
    item.click();
    expect(trainer.start).toHaveBeenCalledWith('rich', 'manual');
    wrapper.unmount();
  });

  it('honors the tourIds filter', async () => {
    const trainer = stubTrainer([tour('a', 'basic'), tour('b', 'basic'), tour('c', 'basic')]);
    const wrapper = mount(TourProvider, {
      props: { trainer },
      slots: { default: () => h(TrainingChecklist, { tourIds: ['a', 'c'] }) },
      attachTo: document.body,
    });
    (document.querySelector('[data-testid="training-checklist-pill"]') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    expect(document.querySelector('[data-testid="training-checklist-item-a"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="training-checklist-item-b"]')).toBeNull();
    expect(document.querySelector('[data-testid="training-checklist-item-c"]')).not.toBeNull();
    wrapper.unmount();
  });
});
