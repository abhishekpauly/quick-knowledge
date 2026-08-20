/**
 * AdvanceOnHandler — installs the listener for a single step's `advanceOn`
 * condition and tears it down when the step ends.
 *
 * One instance per active step. The Trainer creates it in `when.show`,
 * disposes it in `when.hide`.
 */
import type { AdvanceOn } from '../schema/v1.js';
import { matchesPattern } from './triggers.js';

export interface AdvanceContext {
  /** Called when the condition fires. Trainer wires this to `shepherdTour.next()`. */
  onAdvance: () => void;
  /** Subscribe to a trainer event by name. Used for `event`-type advanceOn. */
  onTrainerEvent: (name: string, cb: () => void) => () => void;
}

export class AdvanceOnHandler {
  private cleanup: (() => void) | null = null;

  attach(condition: AdvanceOn | null | undefined, ctx: AdvanceContext): void {
    this.detach();
    if (!condition) return;

    switch (condition.type) {
      case 'click':
        this.cleanup = attachDomListener(condition.target, 'click', ctx.onAdvance);
        break;
      case 'input':
        this.cleanup = attachDomListener(condition.target, 'input', (e) => {
          const target = e.target as HTMLInputElement | null;
          if (target && typeof target.value === 'string' && target.value.length > 0) {
            ctx.onAdvance();
          }
        });
        break;
      case 'url':
        this.cleanup = attachUrlListener(condition.pattern, ctx.onAdvance);
        break;
      case 'event':
        this.cleanup = ctx.onTrainerEvent(condition.name, ctx.onAdvance);
        break;
    }
  }

  detach(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}

function attachDomListener(
  selector: string,
  eventName: 'click' | 'input',
  handler: (e: Event) => void,
): () => void {
  // Delegated listener at document level so we don't need to re-attach if the
  // element re-renders. Filter by selector match.
  const delegate = (event: Event): void => {
    const target = event.target as Element | null;
    if (!target) return;
    // closest walks up the tree so click on a child of the button still counts.
    if (target.closest(selector)) handler(event);
  };
  document.addEventListener(eventName, delegate, true);
  return () => document.removeEventListener(eventName, delegate, true);
}

function attachUrlListener(pattern: string, onMatch: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const check = (): void => {
    if (matchesPattern(window.location.pathname, pattern)) onMatch();
  };
  window.addEventListener('popstate', check);
  window.addEventListener('training-sdk-navigate', check);
  return () => {
    window.removeEventListener('popstate', check);
    window.removeEventListener('training-sdk-navigate', check);
  };
}
