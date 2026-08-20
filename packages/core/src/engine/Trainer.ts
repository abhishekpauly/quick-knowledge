/**
 * Trainer — the public entry point.
 *
 * Wraps Shepherd.js and layers on top:
 *   - Typed lifecycle events (see ./events.ts).
 *   - `data-tour` selector enforcement (see ADR-0002).
 *   - Wait-for-element for lazy targets (see ./targeting.ts).
 *   - `advanceOn` condition wiring per step (see ./advance.ts).
 *   - `first-run` / `url` / `event` auto-triggers (see ./triggers.ts).
 *
 * Consumers never see Shepherd types. See ADR-0001.
 * Threading model: one Trainer per app. One active tour at a time.
 */
import type {
  Tour as ShepherdTour,
  StepOptions as ShepherdStepOptions,
  StepOptionsButton as ShepherdStepOptionsButton,
  StepOptionsAttachTo as ShepherdStepOptionsAttachTo,
} from 'shepherd.js';
import type { Tour, Step, LocalizedString, Media } from '../schema/v1.js';
import type { TrainerConfig, TourProgress } from './types.js';
import type { EventListener, TrainingEvent, TrainingEventName } from './events.js';
import { waitForElement, TargetTimeoutError } from './targeting.js';
import { AdvanceOnHandler } from './advance.js';
import { TriggerManager } from './triggers.js';
import { matchesAudience } from '../schema/audience.js';
import { resolveLocale } from '../schema/localize.js';
import { personalize } from '../schema/personalize.js';
import { isAllowedByFrequency, markSeenThisSession } from '../schema/frequency.js';
import { readPermalinkTourId } from '../schema/permalink.js';

const PROGRESS_KEY = 'progress';
const DEFAULT_TARGET_TIMEOUT_MS = 3000;

export class Trainer {
  private readonly config: TrainerConfig;
  private readonly toursById: Map<string, Tour>;
  private readonly listeners: Map<TrainingEventName, Set<EventListener>> = new Map();
  private readonly triggerManager: TriggerManager;
  private readonly currentAdvance = new AdvanceOnHandler();

  private activeTour: {
    tour: Tour;
    shepherdTour: ShepherdTour;
    startedAt: number;
    stepStartedAt: number;
    triggerSource: 'manual' | 'first-run' | 'url' | 'event';
    abortTargetWait: AbortController;
  } | null = null;

  private progressCache: Record<string, TourProgress> | undefined;

  constructor(config: TrainerConfig) {
    this.config = config;
    this.toursById = new Map(config.tours.map((t) => [t.id, t]));

    this.triggerManager = new TriggerManager({
      onFire: (tourId, source) => this.handleTriggerFire(tourId, source),
      onTrainerEvent: (name, cb) => this.on(name as TrainingEventName, cb),
    });

    // Mount triggers immediately. `first-run` gate is applied per-fire.
    this.triggerManager.mount(config.tours);

    // Hydrate progress cache eagerly so first-run gates are correct on cold load.
    void this.config.persistence.get(this.progressKey()).then((v) => {
      if (v && typeof v === 'object') this.progressCache = v as Record<string, TourProgress>;
      // After hydration, check for a permalink (Sprint 6). Permalinks bypass all gates.
      this.maybeStartFromPermalink();
    });
  }

  /**
   * Sprint 6: check the current URL for `?training=<tour-id>` and, if present
   * AND the tour exists, start it bypassing audience / frequency / prerequisites.
   * Call again after SPA navigation if needed — TriggerManager already hooks
   * pushState so this is available for URL-triggered permalink checks too.
   */
  private maybeStartFromPermalink(): void {
    const tourId = readPermalinkTourId();
    if (!tourId) return;
    if (!this.toursById.has(tourId)) return;
    // Bypass all gates for permalink starts by calling shepherdTour init directly
    // via a start-with-bypass path. Simpler: temporarily flag the tour as bypass.
    void this.startWithBypass(tourId, 'url');
  }

  /**
   * Sprint 6 helper: start a tour skipping all gate checks. Used only for
   * permalinks. NOT part of the public API — consumers should use `start()`.
   */
  private async startWithBypass(
    tourId: string,
    triggerSource: 'manual' | 'first-run' | 'url' | 'event',
  ): Promise<void> {
    const tour = this.toursById.get(tourId);
    if (!tour) return;
    if (this.activeTour) this.dismiss('superseded');
    // Reuse the same happy path as start() but skip pre-checks.
    await this.launch(tour, triggerSource);
  }

  /**
   * Start a tour by id.
   *
   * Emits `tour_started`. Idempotent: calling start while a tour is active
   * ends the current tour (as dismissed) before starting the new one.
   *
   * Prerequisites: if the tour has prerequisites that aren't completed, this
   * resolves without starting anything and emits no events.
   *
   * @throws if the tour id is not registered.
   */
  async start(
    tourId: string,
    triggerSource: 'manual' | 'first-run' | 'url' | 'event' = 'manual',
  ): Promise<void> {
    const tour = this.toursById.get(tourId);
    if (!tour) throw new Error(`Unknown tour: ${tourId}`);

    if (!this.arePrerequisitesMet(tour)) return;
    if (!matchesAudience(tour.audience, this.config.userAttributes)) return;
    // Sprint 6: frequency gate. Manual starts skip the check (user asked for it).
    if (
      triggerSource !== 'manual' &&
      !isAllowedByFrequency(tour.frequency, this.getProgress(tourId), tourId)
    ) {
      return;
    }
    if (this.activeTour) this.dismiss('superseded');

    await this.launch(tour, triggerSource);
  }

  /**
   * Sprint 6 refactor: extracted the Shepherd wiring so both `start()` (with
   * gates) and `startWithBypass()` (permalinks) can share it. No behavior change.
   */
  private async launch(
    tour: Tour,
    triggerSource: 'manual' | 'first-run' | 'url' | 'event',
  ): Promise<void> {
    // Lazy-import Shepherd so consumers who never start a tour never pay for it.
    const ShepherdModule = await import('shepherd.js');
    const ShepherdCtor = ShepherdModule.default;

    const shepherdTour = new ShepherdCtor.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
      },
    });

    const abortTargetWait = new AbortController();

    tour.steps.forEach((step, index) => {
      this.assertDataTourSelector(step.target);
      shepherdTour.addStep(
        this.toShepherdStep(step, index, tour.steps.length, shepherdTour, abortTargetWait.signal),
      );
    });

    shepherdTour.on('complete', () => this.handleComplete());
    shepherdTour.on('cancel', () => this.handleDismiss('user-skip'));

    this.activeTour = {
      tour,
      shepherdTour,
      startedAt: this.now(),
      stepStartedAt: this.now(),
      triggerSource,
      abortTargetWait,
    };

    // Sprint 6: track for frequency + set lastRunAt for day/week windows.
    markSeenThisSession(tour.id);
    this.setProgress(tour.id, {
      tourId: tour.id,
      status: 'in-progress',
      currentStepIndex: 0,
      lastRunAt: this.iso(),
    });
    this.emit({
      name: 'tour_started',
      payload: { tourId: tour.id, product: tour.product, triggerSource, timestamp: this.iso() },
    });

    shepherdTour.start();
    // step_viewed for the first step fires via Shepherd's `show` handler.
  }

  stop(): void {
    if (this.activeTour) this.dismiss('manual');
  }

  next(): void {
    this.activeTour?.shepherdTour.next();
  }

  prev(): void {
    this.activeTour?.shepherdTour.back();
  }

  on<N extends TrainingEventName>(name: N, listener: EventListener<N>): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }
    set.add(listener as unknown as EventListener);
    return () => set!.delete(listener as unknown as EventListener);
  }

  getProgress(tourId: string): TourProgress {
    const stored = this.readAllProgress()[tourId];
    return stored ?? { tourId, status: 'not-started', currentStepIndex: 0 };
  }

  /** List all tours registered with this trainer. Useful for checklists. */
  getTours(): readonly Tour[] {
    return Array.from(this.toursById.values());
  }

  getActiveTourId(): string | null {
    return this.activeTour?.tour.id ?? null;
  }

  /**
   * Free trigger listeners and any in-flight target waits. Call on app teardown.
   * Not required for normal operation.
   */
  dispose(): void {
    this.currentAdvance.detach();
    this.triggerManager.dispose();
    if (this.activeTour) {
      this.activeTour.abortTargetWait.abort();
      this.activeTour.shepherdTour.cancel();
    }
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private toShepherdStep(
    step: Step,
    index: number,
    total: number,
    shepherdTour: ShepherdTour,
    abortSignal: AbortSignal,
  ): ShepherdStepOptions {
    const isLast = index === total - 1;
    const isFirst = index === 0;

    const buttons: ShepherdStepOptionsButton[] = [];
    if (!isFirst) {
      buttons.push({
        text: 'Back',
        action: () => shepherdTour.back(),
        classes: 'training-btn-secondary',
      });
    }
    const primaryDefaultLabel = isLast ? 'Done' : 'Next';
    const primaryLabel = step.actions?.primary?.label
      ? this.renderText(step.actions.primary.label)
      : primaryDefaultLabel;
    buttons.push({
      text: primaryLabel,
      action: () => {
        this.emitStepCompleted(index);
        if (isLast) shepherdTour.complete();
        else shepherdTour.next();
      },
      classes: 'training-btn-primary',
    });

    const stepType = step.stepType ?? 'tooltip';

    // Sprint 6: redirect step navigates and advances, no tooltip UI.
    if (stepType === 'redirect') {
      return this.buildRedirectStep(step, index, shepherdTour, isLast);
    }

    // Sprint 6: slideout is anchored differently (visually slides in from an edge).
    // Shepherd doesn't have a native "slideout" mode; we render it as a tooltip
    // but with a `training-slideout` class so consumers can style it (e.g. slide
    // animation from the placement edge). Placement is used as the edge.
    const attachTo: ShepherdStepOptionsAttachTo | undefined =
      step.placement === 'center' ? undefined : { element: step.target, on: step.placement };

    // Body: media prepended as an <img> if present, then the localized+personalized body text.
    const bodyText = step.body ? this.renderText(step.body) : '';
    const mediaHtml = step.media ? this.renderMedia(step.media) : '';
    const text = mediaHtml + bodyText;
    const title = step.title ? this.renderText(step.title) : undefined;

    // Sprint 6: additional classes by stepType for CSS-driven variants.
    const typeClasses =
      stepType === 'slideout'
        ? ' training-slideout'
        : stepType === 'hotspot'
          ? ' training-hotspot'
          : '';

    return {
      id: step.id,
      title,
      text,
      classes: `training-step training-step-${stepType}${typeClasses}`,
      attachTo,
      buttons: stepType === 'hotspot' ? [] : buttons, // Hotspot advances on click, no buttons.
      // Wait for the target before Shepherd tries to render. On timeout, skip
      // the step gracefully via tour_error rather than hanging or throwing UI.
      beforeShowPromise: () => this.awaitTarget(step, index, shepherdTour, abortSignal),
      when: {
        show: () => {
          this.emitStepViewed(index);
          // Sprint 6: hotspot auto-advances on click of the target element.
          const advanceOn =
            stepType === 'hotspot' && !step.advanceOn
              ? { type: 'click' as const, target: step.target }
              : (step.advanceOn ?? null);
          this.currentAdvance.attach(advanceOn, {
            onAdvance: () => {
              this.emitStepCompleted(index);
              if (isLast) shepherdTour.complete();
              else shepherdTour.next();
            },
            onTrainerEvent: (name, cb) => this.on(name as TrainingEventName, cb),
          });
        },
        hide: () => this.currentAdvance.detach(),
      },
    };
  }

  /**
   * Sprint 6: build a redirect step. Uses beforeShowPromise to trigger the
   * navigation and then advance the tour after a short wait, without ever
   * rendering visible UI. If waitMs is 0, advances instantly (may race with
   * navigation — set a small wait for reliability).
   */
  private buildRedirectStep(
    step: Step,
    index: number,
    shepherdTour: ShepherdTour,
    isLast: boolean,
  ): ShepherdStepOptions {
    const url = step.redirectUrl;
    const waitMs = step.redirectWaitMs ?? 500;
    return {
      id: step.id,
      classes: 'training-step training-step-redirect',
      // No attachTo; no text; no buttons.
      buttons: [],
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          if (url && typeof window !== 'undefined') {
            try {
              // Support absolute URLs (open in same tab) and paths (SPA-friendly).
              if (url.startsWith('http://') || url.startsWith('https://')) {
                window.location.assign(url);
              } else {
                // For SPA routers, prefer pushState so the app's router intercepts.
                window.history.pushState({}, '', url);
                window.dispatchEvent(new Event('training-sdk-navigate'));
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[training-sdk] redirect step navigation failed', err);
            }
          }
          setTimeout(() => {
            this.emitStepCompleted(index);
            if (isLast) shepherdTour.complete();
            else shepherdTour.next();
            // Reject to keep Shepherd from rendering this step visually.
            resolve();
          }, waitMs);
        }).then(() => {
          // Throw AFTER scheduling the advance so Shepherd doesn't render the step.
          throw new Error('__redirect_skip__');
        }),
    };
  }

  /**
   * Resolve a LocalizedString to the active locale, then interpolate personalization
   * templates from userAttributes. Used for title, body, and button labels.
   */
  private renderText(value: LocalizedString): string {
    const localized = resolveLocale(value, this.config.locale);
    return personalize(
      localized,
      this.config.userAttributes as Record<string, unknown> | undefined,
    );
  }

  /**
   * Render a step's media block as inline HTML that Shepherd's `text` field will
   * mount above the body. Image only for MVP; video is deferred (needs iframe
   * lifecycle handling and autoplay policy consideration).
   */
  private renderMedia(media: Media): string {
    // Attributes are escaped via encodeURI / attribute-safe replacements.
    if (media.type === 'image') {
      const src = escapeAttribute(media.src);
      const alt = escapeAttribute(media.alt);
      return `<img class="training-media" src="${src}" alt="${alt}" style="max-width:100%;max-height:200px;border-radius:6px;margin-bottom:12px;display:block;" />`;
    }
    // Video: placeholder — implement in v0.5 with proper iframe handling.
    // eslint-disable-next-line no-console
    console.warn(`[training-sdk] media type "${media.type}" not yet rendered; skipping`);
    return '';
  }

  private async awaitTarget(
    step: Step,
    index: number,
    shepherdTour: ShepherdTour,
    abortSignal: AbortSignal,
  ): Promise<void> {
    // center-placement steps don't anchor to a specific element — skip the wait.
    if (step.placement === 'center') return;
    try {
      await waitForElement(step.target, {
        timeoutMs: DEFAULT_TARGET_TIMEOUT_MS,
        signal: abortSignal,
      });
    } catch (err) {
      if (err instanceof TargetTimeoutError) {
        this.emit({
          name: 'tour_error',
          payload: {
            tourId: this.activeTour?.tour.id ?? 'unknown',
            stepId: step.id,
            reason: 'target-not-found',
            message: err.message,
            timestamp: this.iso(),
          },
        });
        // Skip this step by advancing (or completing if last). Do this async so
        // Shepherd's current show flow can unwind first.
        queueMicrotask(() => {
          const isLast = index === (this.activeTour?.tour.steps.length ?? 0) - 1;
          if (isLast) shepherdTour.complete();
          else shepherdTour.next();
        });
        throw err;
      }
      // AbortError = tour was dismissed while waiting; swallow silently.
    }
  }

  private handleTriggerFire(tourId: string, source: 'first-run' | 'url' | 'event'): void {
    // Sprint 6: if MULTIPLE tours qualify to auto-start in the same tick, higher
    // priority wins. Collect concurrent fires in a microtask and pick.
    this.pendingTriggerFires.push({ tourId, source });
    if (!this.pendingTriggerScheduled) {
      this.pendingTriggerScheduled = true;
      queueMicrotask(() => this.resolvePendingTriggers());
    }
  }

  private pendingTriggerFires: Array<{ tourId: string; source: 'first-run' | 'url' | 'event' }> =
    [];
  private pendingTriggerScheduled = false;

  private resolvePendingTriggers(): void {
    const fires = this.pendingTriggerFires;
    this.pendingTriggerFires = [];
    this.pendingTriggerScheduled = false;
    if (fires.length === 0) return;

    // Filter to fires whose tours would actually start (prerequisites + audience + frequency).
    // Then pick the highest-priority survivor.
    const eligible = fires
      .filter((f) => {
        const tour = this.toursById.get(f.tourId);
        if (!tour) return false;
        if (this.activeTour?.tour.id === f.tourId) return false;
        // first-run guard: already-run tours don't re-trigger via first-run.
        if (f.source === 'first-run' && this.getProgress(f.tourId).status !== 'not-started')
          return false;
        if (!this.arePrerequisitesMet(tour)) return false;
        if (!matchesAudience(tour.audience, this.config.userAttributes)) return false;
        if (!isAllowedByFrequency(tour.frequency, this.getProgress(f.tourId), f.tourId))
          return false;
        return true;
      })
      .sort((a, b) => {
        const pa = this.toursById.get(a.tourId)?.priority ?? 0;
        const pb = this.toursById.get(b.tourId)?.priority ?? 0;
        return pb - pa; // Descending.
      });

    const winner = eligible[0];
    if (!winner) return;
    void this.start(winner.tourId, winner.source);
  }

  private arePrerequisitesMet(tour: Tour): boolean {
    if (!tour.prerequisites || tour.prerequisites.length === 0) return true;
    return tour.prerequisites.every((id) => this.getProgress(id).status === 'completed');
  }

  private handleComplete(): void {
    const active = this.activeTour;
    if (!active) return;
    const durationMs = this.now() - active.startedAt;
    this.setProgress(active.tour.id, {
      tourId: active.tour.id,
      status: 'completed',
      currentStepIndex: active.tour.steps.length - 1,
      completedAt: this.iso(),
      lastRunAt: this.iso(),
    });
    this.emit({
      name: 'tour_completed',
      payload: {
        tourId: active.tour.id,
        totalSteps: active.tour.steps.length,
        durationMs,
        timestamp: this.iso(),
      },
    });
    active.abortTargetWait.abort();
    this.currentAdvance.detach();
    this.activeTour = null;
  }

  private handleDismiss(_reason: 'user-skip' | 'manual' | 'superseded'): void {
    const active = this.activeTour;
    if (!active) return;
    const currentIndex = this.getCurrentIndex(active.shepherdTour);
    const step = active.tour.steps[currentIndex];
    this.setProgress(active.tour.id, {
      tourId: active.tour.id,
      status: 'dismissed',
      currentStepIndex: currentIndex,
      lastRunAt: this.iso(),
    });
    this.emit({
      name: 'tour_dismissed',
      payload: {
        tourId: active.tour.id,
        stepId: step?.id ?? 'unknown',
        stepIndex: currentIndex,
        timestamp: this.iso(),
      },
    });
    active.abortTargetWait.abort();
    this.currentAdvance.detach();
    this.activeTour = null;
  }

  private dismiss(reason: 'user-skip' | 'manual' | 'superseded'): void {
    this.activeTour?.shepherdTour.cancel();
    if (this.activeTour) this.handleDismiss(reason);
  }

  private emitStepViewed(index: number): void {
    const active = this.activeTour;
    if (!active) return;
    const step = active.tour.steps[index];
    if (!step) return;
    active.stepStartedAt = this.now();
    this.setProgress(active.tour.id, {
      tourId: active.tour.id,
      status: 'in-progress',
      currentStepIndex: index,
    });
    this.emit({
      name: 'step_viewed',
      payload: {
        tourId: active.tour.id,
        stepId: step.id,
        stepIndex: index,
        totalSteps: active.tour.steps.length,
        timestamp: this.iso(),
      },
    });
  }

  private emitStepCompleted(index: number): void {
    const active = this.activeTour;
    if (!active) return;
    const step = active.tour.steps[index];
    if (!step) return;
    const durationMs = this.now() - active.stepStartedAt;
    this.emit({
      name: 'step_completed',
      payload: {
        tourId: active.tour.id,
        stepId: step.id,
        stepIndex: index,
        durationMs,
        timestamp: this.iso(),
      },
    });
  }

  private getCurrentIndex(shepherdTour: ShepherdTour): number {
    const step = shepherdTour.getCurrentStep();
    if (!step) return 0;
    return shepherdTour.steps.findIndex((s) => s.id === step.id);
  }

  private emit(event: TrainingEvent): void {
    try {
      this.config.analytics.track(event.name, event.payload as unknown as Record<string, unknown>);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[training-sdk] analytics adapter threw:', err);
    }
    const set = this.listeners.get(event.name);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(event as never);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[training-sdk] event listener threw:', err);
      }
    }
  }

  private assertDataTourSelector(target: string): void {
    if (!target.startsWith('[data-tour="')) {
      throw new Error(
        `Tour target must start with [data-tour="..."]. Got: ${target}. See ADR-0002.`,
      );
    }
  }

  private readAllProgress(): Record<string, TourProgress> {
    return this.progressCache ?? {};
  }

  private setProgress(tourId: string, progress: TourProgress): void {
    const all = { ...this.readAllProgress(), [tourId]: progress };
    this.progressCache = all;
    void this.config.persistence.set(this.progressKey(), all);
  }

  private progressKey(): string {
    return `${this.config.product}:${PROGRESS_KEY}`;
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private iso(): string {
    return new Date().toISOString();
  }
}

/** Escape a value for safe interpolation into an HTML attribute. */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
