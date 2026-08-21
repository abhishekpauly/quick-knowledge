/**
 * <PinsProvider /> + <Pin /> — Vue counterparts of the React PinsProvider.
 *
 * Sprint 09 T-113. API parity with @in-app-training/react — same names, same
 * behaviour, different framework idioms. See the React source for design
 * commentary; this file mirrors it.
 */
import {
  defineComponent,
  provide,
  inject,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  h,
  Teleport,
  Fragment,
  ref,
  type PropType,
} from 'vue';
import {
  matchesAudience,
  resolveLocale,
  PinAnchor,
  type Pin as PinDef,
  type PinsFile,
  type UserAttributes,
} from '@in-app-training/sdk';
import { PinsKey, type PinsContextValue } from './inject-keys.js';

const DISMISS_PREFIX = 'in-app-training:pins:dismissed:';

function readDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const out = new Set<string>();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(DISMISS_PREFIX)) out.add(k.slice(DISMISS_PREFIX.length));
    }
  } catch {
    /* localStorage inaccessible — best effort */
  }
  return out;
}

function isPastShowUntil(showUntil: string | undefined): boolean {
  if (!showUntil) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today > showUntil;
}

export const PinsProvider = defineComponent({
  name: 'PinsProvider',
  props: {
    pins: { type: Object as PropType<PinsFile>, required: true },
    userAttributes: { type: Object as PropType<UserAttributes>, required: false },
    locale: { type: String, default: 'en' },
  },
  setup(props, { slots }) {
    const dismissed = reactive(new Set<string>(readDismissed()));

    const dismiss = (id: string): void => {
      try {
        window.localStorage.setItem(`${DISMISS_PREFIX}${id}`, '1');
      } catch {
        /* still track in-memory */
      }
      dismissed.add(id);
    };

    const pinsById = computed(() => {
      const m = new Map<string, PinDef>();
      for (const p of props.pins.pins) m.set(p.id, p);
      return m;
    });

    const value: PinsContextValue = {
      get pinsById() {
        return pinsById.value;
      },
      isDismissed: (id) => dismissed.has(id),
      dismiss,
      get locale() {
        return props.locale;
      },
    };
    provide(PinsKey, value);

    const visiblePins = computed(() =>
      props.pins.pins.filter(
        (p) =>
          !dismissed.has(p.id) &&
          !isPastShowUntil(p.showUntil) &&
          matchesAudience(p.audience, props.userAttributes),
      ),
    );

    return () =>
      h(Fragment, null, [
        slots.default?.() ?? null,
        typeof document !== 'undefined'
          ? h(
              Teleport,
              { to: 'body' },
              h(
                'div',
                { 'data-in-app-training': '1', 'data-testid': 'pins-portal' },
                visiblePins.value.map((pin) =>
                  h(PinDot, {
                    key: pin.id,
                    pin,
                    locale: props.locale,
                    onDismiss: () => dismiss(pin.id),
                  }),
                ),
              ),
            )
          : null,
      ]);
  },
});

/**
 * Escape hatch — render a single Pin by id inline. `PinsProvider` renders every
 * visible pin already; this component is for cases where an explicit render
 * location is needed. Requires a surrounding `<PinsProvider>`.
 */
export const Pin = defineComponent({
  name: 'Pin',
  props: {
    id: { type: String, required: true },
  },
  setup(props) {
    const ctx = inject(PinsKey);
    if (!ctx) throw new Error('<Pin> must be inside <PinsProvider>');
    return () => {
      const pin = ctx.pinsById.get(props.id);
      if (!pin) return null;
      if (ctx.isDismissed(props.id)) return null;
      if (isPastShowUntil(pin.showUntil)) return null;
      return h(PinDot, {
        pin,
        locale: ctx.locale,
        onDismiss: () => ctx.dismiss(props.id),
      });
    };
  },
});

const PinDot = defineComponent({
  name: 'PinDot',
  props: {
    pin: { type: Object as PropType<PinDef>, required: true },
    locale: { type: String, required: true },
    onDismiss: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const rect = ref<DOMRect | null>(null);
    const expanded = ref(false);
    const lost = ref(false);
    let anchor: PinAnchor | null = null;

    onMounted(() => {
      if (typeof document === 'undefined') return;
      anchor = new PinAnchor({
        selector: props.pin.target,
        onRect: (r) => {
          rect.value = r;
        },
        onLost: () => {
          lost.value = true;
        },
      });
      void anchor.attach();
    });
    onBeforeUnmount(() => anchor?.detach());

    return () => {
      if (lost.value || !rect.value) return null;
      const title = resolveLocale(props.pin.title, props.locale);
      const body = props.pin.body ? resolveLocale(props.pin.body, props.locale) : null;
      const dismissible = props.pin.dismissible !== false;

      const dotSize = 14;
      const dotStyle = {
        position: 'fixed' as const,
        top: `${rect.value.top - dotSize / 2}px`,
        left: `${rect.value.right - dotSize / 2}px`,
        width: `${dotSize}px`,
        height: `${dotSize}px`,
        borderRadius: '50%',
        background: 'var(--in-app-training-primary, #2563eb)',
        boxShadow: '0 0 0 3px rgba(37,99,235,0.25)',
        cursor: 'pointer',
        zIndex: '9998',
        border: '0',
        padding: '0',
      };

      const popStyle = {
        position: 'fixed' as const,
        top: `${rect.value.bottom + 8}px`,
        left: `${rect.value.left}px`,
        maxWidth: '280px',
        background: 'var(--in-app-training-background, #fff)',
        color: 'var(--in-app-training-foreground, #111827)',
        border: '1px solid var(--in-app-training-border, #e2e8f0)',
        borderRadius: 'var(--in-app-training-radius, 8px)',
        boxShadow: 'var(--in-app-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
        padding: '10px 12px',
        fontFamily: 'var(--in-app-training-font-family, system-ui, sans-serif)',
        fontSize: 'var(--in-app-training-font-size, 14px)',
        zIndex: '9999',
      };

      return h(Fragment, null, [
        h('button', {
          type: 'button',
          'aria-label': title,
          title,
          onClick: () => (expanded.value = !expanded.value),
          style: dotStyle,
          'data-testid': `pin-dot-${props.pin.id}`,
        }),
        expanded.value
          ? h('div', { style: popStyle, 'data-testid': `pin-pop-${props.pin.id}` }, [
              h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, title),
              body ? h('div', { style: { marginBottom: '4px' } }, body) : null,
              props.pin.learnMoreUrl
                ? h(
                    'a',
                    {
                      href: props.pin.learnMoreUrl,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      style: {
                        color: 'var(--in-app-training-primary, #2563eb)',
                        fontWeight: '500',
                        fontSize: '12px',
                      },
                    },
                    'Learn more →',
                  )
                : null,
              dismissible
                ? h(
                    'div',
                    { style: { marginTop: '8px', textAlign: 'right' as const } },
                    h(
                      'button',
                      {
                        type: 'button',
                        onClick: () => props.onDismiss(),
                        style: {
                          background: 'transparent',
                          border: '0',
                          color: 'var(--in-app-training-foreground, #64748b)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        },
                        'data-testid': `pin-dismiss-${props.pin.id}`,
                      },
                      'Dismiss',
                    ),
                  )
                : null,
            ])
          : null,
      ]);
    };
  },
});

/** Test helper — clears every dismissed-pin key. Not part of the public API. */
export function _resetPinDismissals(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(DISMISS_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
