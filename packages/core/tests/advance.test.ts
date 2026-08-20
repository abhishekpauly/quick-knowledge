/**
 * AdvanceOnHandler tests — the per-step listener install/tear-down.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvanceOnHandler } from '../src/engine/advance.js';

describe('AdvanceOnHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches nothing when condition is null', () => {
    const h = new AdvanceOnHandler();
    const onAdvance = vi.fn();
    h.attach(null, { onAdvance, onTrainerEvent: () => () => {} });
    h.detach();
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('fires onAdvance when the click target (or descendant) is clicked', () => {
    document.body.innerHTML = `
      <button data-tour="btn"><span class="label">Click</span></button>
    `;
    const h = new AdvanceOnHandler();
    const onAdvance = vi.fn();
    h.attach(
      { type: 'click', target: '[data-tour="btn"]' },
      { onAdvance, onTrainerEvent: () => () => {} },
    );

    (document.querySelector('.label') as HTMLElement).click();
    expect(onAdvance).toHaveBeenCalledTimes(1);

    h.detach();
    (document.querySelector('.label') as HTMLElement).click();
    // No additional calls after detach.
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('fires on input when value becomes non-empty', () => {
    document.body.innerHTML = `<input data-tour="field" />`;
    const h = new AdvanceOnHandler();
    const onAdvance = vi.fn();
    h.attach(
      { type: 'input', target: '[data-tour="field"]' },
      { onAdvance, onTrainerEvent: () => () => {} },
    );

    const input = document.querySelector('[data-tour="field"]') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onAdvance).not.toHaveBeenCalled();

    input.value = 'x';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onAdvance).toHaveBeenCalledTimes(1);
    h.detach();
  });

  it('fires on event via the trainer event bus', () => {
    const listeners: Array<() => void> = [];
    const onTrainerEvent = (name: string, cb: () => void) => {
      expect(name).toBe('signup_completed');
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    };
    const h = new AdvanceOnHandler();
    const onAdvance = vi.fn();
    h.attach({ type: 'event', name: 'signup_completed' }, { onAdvance, onTrainerEvent });
    listeners.forEach((l) => l());
    expect(onAdvance).toHaveBeenCalledTimes(1);
    h.detach();
    expect(listeners).toHaveLength(0);
  });
});
