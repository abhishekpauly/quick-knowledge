/**
 * TriggerManager — auto-starts tours based on their declared triggers.
 *
 * Trigger kinds handled here:
 *   - `first-run` — evaluated by the Trainer on mount + on progress reads.
 *   - `url` — matches location.pathname against a glob. Reevaluates on
 *     history.pushState / replaceState / popstate. Framework-router agnostic.
 *   - `event` — listens on the Trainer's own event bus for a named event.
 *   - `manual` — no-op; user code calls `trainer.start(tourId)` explicitly.
 *
 * The manager does NOT decide whether a tour is "eligible" (already completed,
 * prerequisites unmet) — the Trainer applies those rules before actually starting.
 */
import type { Tour } from '../schema/v1.js';

export interface TriggerContext {
  /** Called with (tourId, source) when a trigger fires. */
  onFire: (tourId: string, source: 'first-run' | 'url' | 'event') => void;
  /** Subscribe to a trainer event by name. Returns unsubscribe. */
  onTrainerEvent: (name: string, cb: () => void) => () => void;
}

export class TriggerManager {
  private readonly context: TriggerContext;
  private readonly unsubscribes: Array<() => void> = [];
  private mounted = false;

  constructor(context: TriggerContext) {
    this.context = context;
  }

  /**
   * Register all triggers for a set of tours. Idempotent — calling twice with
   * the same tours does nothing new. Call `dispose()` to tear down cleanly.
   */
  mount(tours: Tour[]): void {
    if (this.mounted) return;
    this.mounted = true;

    // Group URL triggers so we only install one pathname listener.
    const urlTriggers: Array<{ tourId: string; pattern: string }> = [];
    const eventTriggers: Array<{ tourId: string; name: string }> = [];

    for (const tour of tours) {
      for (const trigger of tour.triggers) {
        switch (trigger.type) {
          case 'url':
            urlTriggers.push({ tourId: tour.id, pattern: trigger.pattern });
            break;
          case 'event':
            eventTriggers.push({ tourId: tour.id, name: trigger.name });
            break;
          case 'first-run':
          case 'manual':
            // Handled by the Trainer, not here.
            break;
        }
      }
    }

    if (urlTriggers.length > 0) this.installUrlListener(urlTriggers);
    if (eventTriggers.length > 0) this.installEventListeners(eventTriggers);
  }

  dispose(): void {
    for (const off of this.unsubscribes) off();
    this.unsubscribes.length = 0;
    this.mounted = false;
  }

  /** For testing. */
  isMounted(): boolean {
    return this.mounted;
  }

  private installUrlListener(triggers: Array<{ tourId: string; pattern: string }>): void {
    const check = (): void => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      for (const t of triggers) {
        if (matchesPattern(path, t.pattern)) {
          this.context.onFire(t.tourId, 'url');
        }
      }
    };

    // History patching: capture pushState/replaceState so SPA navigations fire.
    // We monkey-patch once and restore on dispose.
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      const ret = originalPush.apply(this, args);
      window.dispatchEvent(new Event('training-sdk-navigate'));
      return ret;
    };
    window.history.replaceState = function (...args) {
      const ret = originalReplace.apply(this, args);
      window.dispatchEvent(new Event('training-sdk-navigate'));
      return ret;
    };

    const onNav = (): void => check();
    window.addEventListener('popstate', onNav);
    window.addEventListener('training-sdk-navigate', onNav);

    this.unsubscribes.push(() => {
      window.removeEventListener('popstate', onNav);
      window.removeEventListener('training-sdk-navigate', onNav);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    });

    // Evaluate once on mount for the current URL.
    check();
  }

  private installEventListeners(triggers: Array<{ tourId: string; name: string }>): void {
    // Group by event name so we subscribe once per distinct name.
    const byEventName = new Map<string, string[]>();
    for (const t of triggers) {
      const list = byEventName.get(t.name) ?? [];
      list.push(t.tourId);
      byEventName.set(t.name, list);
    }

    for (const [eventName, tourIds] of byEventName) {
      const off = this.context.onTrainerEvent(eventName, () => {
        for (const tourId of tourIds) this.context.onFire(tourId, 'event');
      });
      this.unsubscribes.push(off);
    }
  }
}

/**
 * Simple glob match — supports `*` wildcard and `**` for anywhere.
 * `/workflows/*` matches `/workflows/foo` but not `/workflows/foo/bar`.
 * `/workflows/**` matches both.
 */
export function matchesPattern(path: string, pattern: string): boolean {
  const regexSrc =
    '^' +
    pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex specials
      .replace(/\*\*/g, '§§DOUBLESTAR§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§DOUBLESTAR§§/g, '.*') +
    '$';
  return new RegExp(regexSrc).test(path);
}
