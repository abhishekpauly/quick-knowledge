/**
 * PinsProvider (Vue) tests — Sprint 09 T-113. Mirrors the React suite.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import { memoryAnalytics, type PinsFile } from '@in-app-training/sdk';
import {
  PinsProvider,
  Pin,
  _resetPinDismissals,
  _resetPinShownDedupe,
} from '../src/PinsProvider.js';

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
  await flushPromises();
  await new Promise((r) => setTimeout(r, 10));
  await flushPromises();
}

describe('PinsProvider (Vue)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetPinDismissals();
    _resetPinShownDedupe();
  });
  afterEach(() => {
    _resetPinDismissals();
    _resetPinShownDedupe();
  });

  it('renders a portal with a dot for a matching pin', async () => {
    makeTarget('t1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div', 'app') },
      attachTo: document.body,
    });
    await flush();
    expect(document.querySelector('[data-testid="pins-portal"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="pin-dot-p1"]')).not.toBeNull();
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
    mount(PinsProvider, {
      props: { pins: file, userAttributes: { plan: 'free' } },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    expect(document.querySelector('[data-testid="pin-dot-p1"]')).toBeNull();
    expect(document.querySelector('[data-testid="pin-dot-p2"]')).not.toBeNull();
  });

  it('skips a pin past its showUntil date', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'expired', target: '[data-tour="t1"]', title: 'Old', showUntil: '2000-01-01' },
    ]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    expect(document.querySelector('[data-testid="pin-dot-expired"]')).toBeNull();
  });

  it('clicking the dot opens the popover; dismiss removes the pin and persists', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'p1', target: '[data-tour="t1"]', title: 'Pin one', body: 'Body' },
    ]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    (document.querySelector('[data-testid="pin-dot-p1"]') as HTMLElement).click();
    await flush();
    expect(document.querySelector('[data-testid="pin-pop-p1"]')).not.toBeNull();
    (document.querySelector('[data-testid="pin-dismiss-p1"]') as HTMLElement).click();
    await flush();
    expect(document.querySelector('[data-testid="pin-dot-p1"]')).toBeNull();
    expect(window.localStorage.getItem('in-app-training:pins:dismissed:p1')).toBe('1');
  });

  it('honors an existing dismissal from localStorage on mount', async () => {
    makeTarget('t1');
    window.localStorage.setItem('in-app-training:pins:dismissed:p1', '1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    expect(document.querySelector('[data-testid="pin-dot-p1"]')).toBeNull();
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
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    (document.querySelector('[data-testid="pin-dot-p1"]') as HTMLElement).click();
    await flush();
    const link = document.querySelector('[data-testid="pin-pop-p1"] a') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://example.com/docs');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('hides the dismiss button when dismissible is false', async () => {
    makeTarget('t1');
    const file = pinsFile([
      { id: 'p1', target: '[data-tour="t1"]', title: 'Safety pin', dismissible: false },
    ]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    (document.querySelector('[data-testid="pin-dot-p1"]') as HTMLElement).click();
    await flush();
    expect(document.querySelector('[data-testid="pin-dismiss-p1"]')).toBeNull();
  });

  it('<Pin id> escape hatch renders inline in the tree', async () => {
    makeTarget('t1');
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'Pin one' }]);
    mount(PinsProvider, {
      props: { pins: file },
      slots: { default: () => h(Pin, { id: 'p1' }) },
      attachTo: document.body,
    });
    await flush();
    // Both the portal and the escape hatch render a dot; expect at least 2.
    const dots = document.querySelectorAll('[data-testid="pin-dot-p1"]');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('<Pin id> throws outside a provider', () => {
    expect(() => mount(Pin, { props: { id: 'p1' } })).toThrow(/PinsProvider/);
  });

  it('emits pin_shown once per session when a pin first renders', async () => {
    makeTarget('t1');
    makeTarget('t2');
    const analytics = memoryAnalytics();
    const file = pinsFile([
      { id: 'p1', target: '[data-tour="t1"]', title: 'One' },
      { id: 'p2', target: '[data-tour="t2"]', title: 'Two' },
    ]);
    mount(PinsProvider, {
      props: { pins: file, analytics },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    const shown = analytics.events.filter((e) => e.name === 'pin_shown');
    expect(shown.map((e) => (e.properties as { pinId: string }).pinId).sort()).toEqual([
      'p1',
      'p2',
    ]);
  });

  it('emits pin_dismissed with pinId + target on Dismiss click', async () => {
    makeTarget('t1');
    const analytics = memoryAnalytics();
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'One' }]);
    mount(PinsProvider, {
      props: { pins: file, analytics },
      slots: { default: () => h('div') },
      attachTo: document.body,
    });
    await flush();
    (document.querySelector('[data-testid="pin-dot-p1"]') as HTMLElement).click();
    await flush();
    (document.querySelector('[data-testid="pin-dismiss-p1"]') as HTMLElement).click();
    await flush();
    const dismissed = analytics.events.find((e) => e.name === 'pin_dismissed');
    expect(dismissed).toBeDefined();
    expect(dismissed?.properties).toMatchObject({ pinId: 'p1', target: '[data-tour="t1"]' });
  });

  it('does not throw when analytics.track throws', async () => {
    makeTarget('t1');
    const throwingAnalytics = {
      track: () => {
        throw new Error('sink is down');
      },
    };
    const file = pinsFile([{ id: 'p1', target: '[data-tour="t1"]', title: 'One' }]);
    // pin_shown fires on the very first onRect emit — mount alone should not throw.
    expect(() => {
      mount(PinsProvider, {
        props: { pins: file, analytics: throwingAnalytics },
        slots: { default: () => h('div') },
        attachTo: document.body,
      });
    }).not.toThrow();
    await flush();
    // Then a Dismiss click, which fires pin_dismissed on the throwing sink.
    (document.querySelector('[data-testid="pin-dot-p1"]') as HTMLElement).click();
    await flush();
    const dismiss = document.querySelector('[data-testid="pin-dismiss-p1"]') as HTMLElement | null;
    expect(dismiss).not.toBeNull();
    expect(() => dismiss!.click()).not.toThrow();
  });
});
