/**
 * TrainingChecklist tests — smoke coverage. Full styling behavior is
 * exercised in the demo.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TourProvider } from '../src/TourProvider.js';
import { TrainingChecklist } from '../src/TrainingChecklist.js';
import type { Trainer, Tour, TourProgress } from '@uptiq/training-sdk';

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

function stubTrainer(
  tours: Tour[],
  progressMap: Record<string, TourProgress> = {},
): Trainer {
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

describe('TrainingChecklist', () => {
  it('renders the collapsed pill by default', () => {
    const trainer = stubTrainer([tour('t1', 'onboarding')]);
    const { getByTestId } = render(
      <TourProvider trainer={trainer}>
        <TrainingChecklist />
      </TourProvider>,
    );
    expect(getByTestId('training-checklist-pill')).toBeDefined();
  });

  it('expands to a panel on click', () => {
    const trainer = stubTrainer([
      tour('a', 'onboarding'),
      tour('b', 'basic'),
    ]);
    const { getByTestId, queryByTestId } = render(
      <TourProvider trainer={trainer}>
        <TrainingChecklist />
      </TourProvider>,
    );
    expect(queryByTestId('training-checklist-panel')).toBeNull();
    fireEvent.click(getByTestId('training-checklist-pill'));
    expect(getByTestId('training-checklist-panel')).toBeDefined();
  });

  it('renders items grouped by difficulty', () => {
    const trainer = stubTrainer([
      tour('a', 'onboarding'),
      tour('b', 'basic'),
      tour('c', 'advanced'),
    ]);
    const { getByTestId } = render(
      <TourProvider trainer={trainer}>
        <TrainingChecklist />
      </TourProvider>,
    );
    fireEvent.click(getByTestId('training-checklist-pill'));
    expect(getByTestId('training-checklist-item-a')).toBeDefined();
    expect(getByTestId('training-checklist-item-b')).toBeDefined();
    expect(getByTestId('training-checklist-item-c')).toBeDefined();
  });

  it('locks items whose prerequisites are not met', () => {
    const gated: Tour = {
      ...tour('gated', 'intermediate'),
      prerequisites: ['a'],
    };
    const trainer = stubTrainer([tour('a', 'basic'), gated]); // a not completed
    const { getByTestId } = render(
      <TourProvider trainer={trainer}>
        <TrainingChecklist />
      </TourProvider>,
    );
    fireEvent.click(getByTestId('training-checklist-pill'));
    const item = getByTestId('training-checklist-item-gated') as HTMLButtonElement;
    expect(item.disabled).toBe(true);
  });
});
