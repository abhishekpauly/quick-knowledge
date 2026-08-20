/**
 * TrainingHint (Vue) tests — provider error, render, click-to-pin, missing id.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { HintsProvider } from '../src/HintsProvider.js';
import { TrainingHint } from '../src/TrainingHint.js';

const hintsFile = {
  schemaVersion: 'v1' as const,
  product: 'test',
  hints: [
    { id: 'foo', title: 'Foo title', body: 'Foo body' },
    { id: 'bar', body: 'Bar body' },
  ],
};

describe('TrainingHint (Vue)', () => {
  it('renders the trigger button', () => {
    const wrapper = mount(HintsProvider, {
      props: { hints: hintsFile },
      slots: { default: () => h(TrainingHint, { id: 'foo' }) },
    });
    expect(wrapper.find('[data-testid="training-hint-trigger-foo"]').exists()).toBe(true);
  });

  it('reveals the body on click (pinned)', async () => {
    const wrapper = mount(HintsProvider, {
      props: { hints: hintsFile },
      slots: { default: () => h(TrainingHint, { id: 'foo' }) },
    });
    expect(wrapper.find('[data-testid="training-hint-body-foo"]').exists()).toBe(false);
    await wrapper.get('[data-testid="training-hint-trigger-foo"]').trigger('click');
    expect(wrapper.find('[data-testid="training-hint-body-foo"]').exists()).toBe(true);
  });

  it('renders a dev warning for a missing id', () => {
    const wrapper = mount(HintsProvider, {
      props: { hints: hintsFile },
      slots: { default: () => h(TrainingHint, { id: 'does-not-exist' }) },
    });
    expect(wrapper.text()).toContain('does-not-exist');
  });

  it('throws outside a HintsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => mount(TrainingHint, { props: { id: 'foo' } })).toThrow(/HintsProvider/);
    spy.mockRestore();
  });
});
