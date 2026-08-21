/**
 * <PinsProvider /> — Sprint 09 T-112.
 *
 * Auto-renders every Pin in the supplied file that:
 *   - matches the user's audience (per `matchesAudience` from core)
 *   - is not past its `showUntil` date
 *   - has not been dismissed by this browser (localStorage key
 *     `in-app-training:pins:dismissed:<id>`)
 *
 * Each surviving Pin is portal-mounted next to `<body>`; the dot positions
 * itself over its target via `PinAnchor` (also from core). A `<Pin id="..." />`
 * component is exported as an escape hatch when the caller wants an explicit
 * render location — the common case is that they don't and `PinsProvider`
 * handles everything.
 *
 * Analytics-event wiring lands in T-114; this component emits nothing yet.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  matchesAudience,
  resolveLocale,
  PinAnchor,
  type Analytics,
  type Pin as PinDef,
  type PinsFile,
  type UserAttributes,
} from '@in-app-training/sdk';

const DISMISS_PREFIX = 'in-app-training:pins:dismissed:';
/**
 * Sprint 10 (T-138). Per-user `pin_shown` dedupe.
 *
 * localStorage-backed so multiple PinsProvider mounts in the same page (rare,
 * but possible in host apps with multiple app shells) share dedupe state and a
 * page reload does not re-emit. Reset in tests via `_resetPinShownDedupe`.
 * (Sprint 09's module-scoped Set only covered one tab / one mount.)
 */
const SHOWN_PREFIX = 'in-app-training:pins:shown:';

function hasShown(pinId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${SHOWN_PREFIX}${pinId}`) !== null;
  } catch {
    return false;
  }
}

function markShown(pinId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${SHOWN_PREFIX}${pinId}`, '1');
  } catch {
    // localStorage inaccessible — best effort. Analytics may double-emit
    // in that session; acceptable trade-off.
  }
}

export function _resetPinShownDedupe(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(SHOWN_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

function safeTrack(
  analytics: Analytics | undefined,
  name: 'pin_shown' | 'pin_dismissed',
  payload: Record<string, unknown>,
): void {
  if (!analytics) return;
  try {
    analytics.track(name, payload);
  } catch {
    // Contract: analytics must not crash the widget.
  }
}

interface PinsContextValue {
  pinsById: Map<string, PinDef>;
  dismissed: Set<string>;
  dismiss: (id: string) => void;
  analytics?: Analytics;
}

const PinsContext = createContext<PinsContextValue | null>(null);
PinsContext.displayName = 'PinsContext';

export interface PinsProviderProps {
  pins: PinsFile;
  /** Same shape as TrainerConfig.userAttributes. Used for audience filtering. */
  userAttributes?: UserAttributes;
  /** BCP-47 locale for `title` / `body`. Default 'en'. */
  locale?: string;
  /**
   * Optional analytics adapter — reuse the one wired for the Trainer or pass a
   * separate one. If omitted, no pin events fire. Same `Analytics` contract
   * as `TrainerConfig.analytics`.
   */
  analytics?: Analytics;
  children: ReactNode;
}

function readDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const out = new Set<string>();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(DISMISS_PREFIX)) out.add(k.slice(DISMISS_PREFIX.length));
    }
  } catch {
    // localStorage inaccessible (private mode / policy) — best effort.
  }
  return out;
}

function isPastShowUntil(showUntil: string | undefined): boolean {
  if (!showUntil) return false;
  // Compare as YYYY-MM-DD; the schema already enforces the shape.
  const today = new Date().toISOString().slice(0, 10);
  return today > showUntil;
}

export function PinsProvider({
  pins,
  userAttributes,
  locale = 'en',
  analytics,
  children,
}: PinsProviderProps): JSX.Element {
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  const dismiss = (id: string): void => {
    const pin = pins.pins.find((p) => p.id === id);
    if (pin) {
      safeTrack(analytics, 'pin_dismissed', {
        pinId: pin.id,
        target: pin.target,
        timestamp: new Date().toISOString(),
      });
    }
    try {
      window.localStorage.setItem(`${DISMISS_PREFIX}${id}`, '1');
    } catch {
      // Fall through — in-memory dismissal below still applies.
    }
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const visiblePins = useMemo(
    () =>
      pins.pins.filter(
        (p) =>
          !dismissed.has(p.id) &&
          !isPastShowUntil(p.showUntil) &&
          matchesAudience(p.audience, userAttributes),
      ),
    [pins, dismissed, userAttributes],
  );

  const pinsById = useMemo(() => new Map(pins.pins.map((p) => [p.id, p])), [pins]);

  const value: PinsContextValue = { pinsById, dismissed, dismiss, analytics };

  return (
    <PinsContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div data-in-app-training="1" data-testid="pins-portal">
            {visiblePins.map((pin) => (
              <PinDot
                key={pin.id}
                pin={pin}
                locale={locale}
                analytics={analytics}
                onDismiss={() => dismiss(pin.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </PinsContext.Provider>
  );
}

/**
 * Escape hatch — render a single Pin by id at an arbitrary point in the tree.
 * The provider still needs to be mounted above it. `PinsProvider` already
 * renders every visible Pin via its portal, so this is only useful when the
 * caller wants explicit control (e.g. debugging, storybook, layout-nested pins).
 */
export function Pin({ id, locale = 'en' }: { id: string; locale?: string }): JSX.Element | null {
  const ctx = useContext(PinsContext);
  if (!ctx) throw new Error('<Pin> must be inside <PinsProvider>');
  const pin = ctx.pinsById.get(id);
  if (!pin) return null;
  if (ctx.dismissed.has(id)) return null;
  if (isPastShowUntil(pin.showUntil)) return null;
  return (
    <PinDot pin={pin} locale={locale} analytics={ctx.analytics} onDismiss={() => ctx.dismiss(id)} />
  );
}

interface PinDotProps {
  pin: PinDef;
  locale: string;
  analytics?: Analytics;
  onDismiss: () => void;
}

function PinDot({ pin, locale, analytics, onDismiss }: PinDotProps): JSX.Element | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const anchor = new PinAnchor({
      selector: pin.target,
      onRect: (r) => {
        setRect((prev) => {
          if (!prev && !hasShown(pin.id)) {
            markShown(pin.id);
            safeTrack(analytics, 'pin_shown', {
              pinId: pin.id,
              target: pin.target,
              timestamp: new Date().toISOString(),
            });
          }
          return r;
        });
      },
      onLost: () => setLost(true),
    });
    void anchor.attach();
    return () => anchor.detach();
  }, [pin.target, pin.id, analytics]);

  if (lost || !rect) return null;

  const title = resolveLocale(pin.title, locale);
  const body = pin.body ? resolveLocale(pin.body, locale) : null;
  const dismissible = pin.dismissible !== false;

  // Position the dot on the requested corner of the target (default top-right),
  // offset by half its size so it hugs the corner without occluding it.
  const dotSize = 14;
  const corner = pin.preferredCorner ?? 'top-right';
  const cornerOffset = (() => {
    switch (corner) {
      case 'top-right':
        return { top: rect.top - dotSize / 2, left: rect.right - dotSize / 2 };
      case 'top-left':
        return { top: rect.top - dotSize / 2, left: rect.left - dotSize / 2 };
      case 'bottom-right':
        return { top: rect.bottom - dotSize / 2, left: rect.right - dotSize / 2 };
      case 'bottom-left':
        return { top: rect.bottom - dotSize / 2, left: rect.left - dotSize / 2 };
    }
  })();
  const dotStyle: React.CSSProperties = {
    position: 'fixed',
    ...cornerOffset,
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    background: 'var(--in-app-training-primary, #2563eb)',
    boxShadow: '0 0 0 3px rgba(37,99,235,0.25)',
    cursor: 'pointer',
    zIndex: 9998,
    border: 0,
    padding: 0,
  };

  const popStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: rect.left,
    maxWidth: 280,
    background: 'var(--in-app-training-background, #fff)',
    color: 'var(--in-app-training-foreground, #111827)',
    border: '1px solid var(--in-app-training-border, #e2e8f0)',
    borderRadius: 'var(--in-app-training-radius, 8px)',
    boxShadow: 'var(--in-app-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
    padding: '10px 12px',
    fontFamily: 'var(--in-app-training-font-family, system-ui, sans-serif)',
    fontSize: 'var(--in-app-training-font-size, 14px)',
    zIndex: 9999,
  };

  return (
    <>
      <button
        type="button"
        aria-label={title}
        title={title}
        onClick={() => setExpanded((v) => !v)}
        style={dotStyle}
        data-testid={`pin-dot-${pin.id}`}
      />
      {expanded && (
        <div style={popStyle} data-testid={`pin-pop-${pin.id}`}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
          {body && <div style={{ marginBottom: 4 }}>{body}</div>}
          {pin.learnMoreUrl && (
            <a
              href={pin.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--in-app-training-primary, #2563eb)',
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              Learn more →
            </a>
          )}
          {dismissible && (
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--in-app-training-foreground, #64748b)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                data-testid={`pin-dismiss-${pin.id}`}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

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
    // ignore
  }
}
