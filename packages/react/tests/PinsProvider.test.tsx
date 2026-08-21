/**
 * PinsProvider (React) tests — Sprint 09 T-112.
 *
 * Covers audience filtering, showUntil skipping, dismissal persistence,
 * portal render location, and the `<Pin>` escape hatch.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { PinsFile } from '@in-app-training/sdk';
import { PinsProvider, Pin, _resetPinDismissals } from '../src/PinsProvider.js';

function makeTarget(id: string): void {
  const el = document.createElement('div');
  el.setAttribute('data-tour', id);
  el.style.position = 'absolute';
  el.style.top = '100px';
  el.style.left = '50px';
  el.style.width = '80px';
  el.style.height = '30px';
  document.body.appendChild(el);
}

function pinsFile(pins: PinsFile['pins']): PinsFile {
  return { schemaVersion: 'v1', product: 'example-app', pins };
}

async function flush(): Promise<void> {
  // Let the PinAnchor attach() microtask and the state updates settle.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
}

describe('PinsProvider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetPinDismissals();
  });
  afterEach(() => {
    _resetPinDismissals();
  });

  it('renders a portal for pin dots', async () => {
    makeTarget('t1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    const { getByTestId } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    expect(getByTestId('pins-portal')).toBeDefined();
    expect(getByTestId('pin-dot-p1')).toBeDefined();
  });

  it('filters out pins whose audience does not match', async () => {
    makeTarget('t1');
    makeTarget('t2');
    const file = pinsFile([
      {
        id: 'p1',
        target: '[data-tour="t1"]',
        title: 'Enterprise only',
        audience: ['plan:enterprise'],
      },
      { id: 'p2', target: '[data-tour="t2"]', title: 'Always' },
    ]);
    const { queryByTestId, getByTestId } = render(
      <PinsProvider pins={file} userAttributes={{ plan: 'free' }}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    expect(queryByTestId('pin-dot-p1')).toBeNull();
    expect(getByTestId('pin-dot-p2')).toBeDefined();
  });

  it('skips a pin past its showUntil date', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'expired', target: '[data-tour="t1"]', title: 'Old', showUntil: '2000-01-01' },
    ]);
    const { queryByTestId } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    expect(queryByTestId('pin-dot-expired')).toBeNull();
  });

  it('clicking the dot opens the popover; dismiss removes the pin and persists', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'p1', target: '[data-tour="t1"]', title: 'Pin one', body: 'Body' },
    ]);
    const { getByTestId, queryByTestId } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    fireEvent.click(getByTestId('pin-dot-p1'));
    expect(getByTestId('pin-pop-p1')).toBeDefined();
    fireEvent.click(getByTestId('pin-dismiss-p1'));
    expect(queryByTestId('pin-dot-p1')).toBeNull();
    expect(window.localStorage.getItem('in-app-training:pins:dismissed:p1')).toBe('1');
  });

  it('honors an existing dismissal from localStorage on mount', async () => {
    makeTarget('t1');
    window.localStorage.setItem('in-app-training:pins:dismissed:p1', '1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    const { queryByTestId } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    expect(queryByTestId('pin-dot-p1')).toBeNull();
  });

  it('renders a Learn more link when learnMoreUrl is set', async () => {
    makeTarget('t1');
    const file = pinsFile([
      {
        id: 'p1',
        target: '[data-tour="t1"]',
        title: 'Pin one',
        learnMoreUrl: 'https://example.com/docs',
      },
    ]);
    const { getByTestId, getByText } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    fireEvent.click(getByTestId('pin-dot-p1'));
    const link = getByText(/Learn more/) as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.href).toBe('https://example.com/docs');
    expect(link.rel).toContain('noopener');
  });

  it('hides the dismiss button when dismissible is false', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'p1', target: '[data-tour="t1"]', title: 'Safety pin', dismissible: false },
    ]);
    const { getByTestId, queryByTestId } = render(
      <PinsProvider pins={file}>
        <div>app</div>
      </PinsProvider>,
    );
    await flush();
    fireEvent.click(getByTestId('pin-dot-p1'));
    expect(queryByTestId('pin-dismiss-p1')).toBeNull();
  });

  it('<Pin id> escape hatch renders inline in the tree', async () => {
    makeTarget('t1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    const { getAllByTestId } = render(
      <PinsProvider pins={file}>
        <Pin id="p1" />
      </PinsProvider>,
    );
    await flush();
    // Both the portal and the escape hatch render a dot; expect at least 2.
    const dots = getAllByTestId('pin-dot-p1');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('<Pin id> throws outside a provider', () => {
    expect(() => render(<Pin id="p1" />)).toThrow(/PinsProvider/);
  });
});
