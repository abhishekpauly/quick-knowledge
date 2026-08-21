/**
 * TourProvider tests — provider error paths and theme application.
 *
 * The trainer itself is exercised by core's tests. Here we only check that the
 * provider correctly puts it into context and that misuse errors are clear.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TourProvider } from '../src/TourProvider.js';
import type { Trainer } from '@in-app-training/sdk';

// Minimal Trainer stub — enough to satisfy the type at the provider boundary.
function stubTrainer(): Trainer {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    on: vi.fn(() => () => {}),
    getProgress: vi.fn(() => ({ tourId: '', status: 'not-started', currentStepIndex: 0 })),
    getActiveTourId: vi.fn(() => null),
  } as unknown as Trainer;
}

describe('TourProvider', () => {
  it('renders children', () => {
    const trainer = stubTrainer();
    const { getByText } = render(
      <TourProvider trainer={trainer}>
        <div>child</div>
      </TourProvider>,
    );
    expect(getByText('child')).toBeDefined();
  });

  it('throws a helpful error when trainer prop is missing', () => {
    // Suppress React error boundary log noise for this expected failure.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        // @ts-expect-error deliberately omitting trainer
        <TourProvider>
          <div>child</div>
        </TourProvider>,
      ),
    ).toThrow(/requires a `trainer` prop/);
    spy.mockRestore();
  });

  it('applies theme CSS variables to documentElement when a theme is provided', () => {
    const trainer = stubTrainer();
    render(
      <TourProvider trainer={trainer} theme={{ primary: '#ff0000' }}>
        <div>child</div>
      </TourProvider>,
    );
    // Effect runs after mount — value on documentElement reflects the theme.
    expect(document.documentElement.style.getPropertyValue('--in-app-training-primary')).toBe(
      '#ff0000',
    );
  });
});
