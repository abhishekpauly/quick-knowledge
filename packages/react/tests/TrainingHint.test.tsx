/**
 * TrainingHint tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HintsProvider } from '../src/HintsProvider.js';
import { TrainingHint } from '../src/TrainingHint.js';

const hints = {
  schemaVersion: 'v1' as const,
  product: 'test',
  hints: [
    { id: 'foo', title: 'Foo title', body: 'Foo body' },
    { id: 'bar', body: 'Bar body' },
  ],
};

describe('TrainingHint', () => {
  it('renders a trigger button by default', () => {
    const { getByTestId } = render(
      <HintsProvider hints={hints}>
        <TrainingHint id="foo" />
      </HintsProvider>,
    );
    expect(getByTestId('training-hint-trigger-foo')).toBeDefined();
  });

  it('shows the hint body on click (pinned)', () => {
    const { getByTestId, queryByTestId } = render(
      <HintsProvider hints={hints}>
        <TrainingHint id="foo" />
      </HintsProvider>,
    );
    expect(queryByTestId('training-hint-body-foo')).toBeNull();
    fireEvent.click(getByTestId('training-hint-trigger-foo'));
    expect(getByTestId('training-hint-body-foo')).toBeDefined();
  });

  it('renders a visible warning for a missing id in dev', () => {
    const { getByText } = render(
      <HintsProvider hints={hints}>
        <TrainingHint id="does-not-exist" />
      </HintsProvider>,
    );
    // Visible dev-only warning.
    expect(getByText(/does-not-exist/)).toBeDefined();
  });

  it('throws outside a HintsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TrainingHint id="foo" />)).toThrow(/HintsProvider/);
    spy.mockRestore();
  });
});
