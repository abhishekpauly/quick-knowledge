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
    { id: 'baz', title: 'Baz', body: 'Baz body', learnMoreUrl: 'https://example.com/docs' },
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

  it('renders a title-less hint body (no leading heading)', () => {
    const { getByTestId } = render(
      <HintsProvider hints={hints}>
        <TrainingHint id="bar" />
      </HintsProvider>,
    );
    fireEvent.click(getByTestId('training-hint-trigger-bar'));
    const body = getByTestId('training-hint-body-bar');
    expect(body.textContent).toBe('Bar body');
  });

  it('renders a Learn more link when learnMoreUrl is set', () => {
    const { getByTestId, getByText } = render(
      <HintsProvider hints={hints}>
        <TrainingHint id="baz" />
      </HintsProvider>,
    );
    fireEvent.click(getByTestId('training-hint-trigger-baz'));
    const link = getByText(/Learn more/) as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.href).toBe('https://example.com/docs');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('throws outside a HintsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TrainingHint id="foo" />)).toThrow(/HintsProvider/);
    spy.mockRestore();
  });
});
