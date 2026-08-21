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
import { GoalRunner } from './GoalRunner.js';
import { isCategoryAllowed } from '../adapters/consent.js';

/** Sprint 12 (ADR-0005). Receipt returned by trainer.forgetUser(). */
export interface ForgetUserReceipt {
  clearedLocal: boolean;
  clearedRemote: boolean;
  emittedAnalyticsSignal: boolean;
  timestamp: string;
  errors: string[];
}

const PROGRESS_KEY = 'progress';
const DEFAULT_TARGET_TIMEOUT_MS = 3000;

export class Trainer {
  private readonly config: TrainerConfig;
  private toursById: Map<string, Tour>;
  private readonly listeners: Map<TrainingEventName, Set<EventListener>> = new Map();
  private readonly triggerManager: TriggerManager;
  private readonly currentAdvance = new AdvanceOnHandler();
  /**
   * Sprint 10 (T-132) — outstanding goal runners. Held in a set so they
   * survive `activeTour` clearing on complete: a completed tour may still
   * have its goal event fire within the window. On dismiss (user-skip /
   * manual) the tour's runners are cancelled — a dismissed tour did not
   * engage, so we don't wait for a goal that would misrepresent it.
   * `superseded` dismissal (a new tour starts) leaves runners in place.
   */
  private readonly goalRunners = new Map<string, Set<GoalRunner>>();

  private activeTour: {
    tour: Tour;
    shepherdTour: ShepherdTour;
    startedAt: number;
    startedAtIso: string;
    stepStartedAt: number;
    triggerSource: 'manual' | 'first-run' | 'url' | 'event';
    abortTargetWait: AbortController;
    goalRunner: GoalRunner | null;
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
    // Sprint 12 (ADR-0006): consent gate — silently skip tours whose
    // consentCategory is not currently granted.
    if (this.config.consent && !isCategoryAllowed(tour.consentCategory, this.config.consent.read()))
      return;
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

    const startedAtIso = this.iso();
    this.activeTour = {
      tour,
      shepherdTour,
      startedAt: this.now(),
      startedAtIso,
      stepStartedAt: this.now(),
      triggerSource,
      abortTargetWait,
      goalRunner: null,
    };

    // Sprint 6: track for frequency + set lastRunAt for day/week windows.
    markSeenThisSession(tour.id);
    this.setProgress(tour.id, {
      tourId: tour.id,
      status: 'in-progress',
      currentStepIndex: 0,
      lastRunAt: startedAtIso,
    });
    this.emit({
      name: 'tour_started',
      payload: { tourId: tour.id, product: tour.product, triggerSource, timestamp: startedAtIso },
    });

    // Sprint 10 (T-132): if the tour declares a goal AND the host wired a
    // GoalsSink, start the poll+expiry loop. Omitting `goals` on TrainerConfig
    // silently skips this — see ADR-nnn (types.ts docstring).
    if (tour.goal && this.config.goals) {
      const goal = tour.goal;
      // eslint-disable-next-line prefer-const -- self is captured by settle before construction completes
      let self: GoalRunner;
      const settle = (): void => {
        this.goalRunners.get(tour.id)?.delete(self);
      };
      self = new GoalRunner({
        tourId: tour.id,
        goal,
        sink: this.config.goals,
        startedAtIso,
        onReached: (matchedAtIso) => {
          settle();
          this.emit({
            name: 'tour_goal_reached',
            payload: {
              tourId: tour.id,
              event: goal.event,
              tourStartedAt: startedAtIso,
              matchedAt: matchedAtIso,
            },
          });
        },
        onMissed: (windowEndedAtIso) => {
          settle();
          this.emit({
            name: 'tour_goal_missed',
            payload: {
              tourId: tour.id,
              event: goal.event,
              tourStartedAt: startedAtIso,
              windowEndedAt: windowEndedAtIso,
            },
          });
        },
      });
      self.start();
      this.activeTour.goalRunner = self;
      let set = this.goalRunners.get(tour.id);
      if (!set) {
        set = new Set();
        this.goalRunners.set(tour.id, set);
      }
      set.add(self);
    }

    shepherdTour.start();
    // step_viewed for the first step fires via Shepherd's `show` handler.
  }

  stop(): void {
    if (this.activeTour) this.dismiss('manual');
  }

  /**
   * Sprint 12 (ADR-0005) · Right-to-erasure entry point. Idempotent.
   * Clears every namespaced persistence key and emits `user_forget_requested`
   * so the host can propagate deletion to the analytics sink.
   *
   * Never throws. Failures are captured in the receipt.
   */
  async forgetUser(userId?: string): Promise<ForgetUserReceipt> {
    const receipt: ForgetUserReceipt = {
      clearedLocal: false,
      clearedRemote: false,
      emittedAnalyticsSignal: false,
      timestamp: this.iso(),
      errors: [],
    };
    // Cancel any active tour first — its state is about to disappear.
    try {
      if (this.activeTour) this.dismiss('manual');
    } catch (err) {
      receipt.errors.push(`dismiss failed: ${String(err)}`);
    }
    // Cancel every outstanding goal runner regardless of tour.
    for (const [, set] of this.goalRunners) for (const r of set) r.cancel();
    this.goalRunners.clear();
    // Clear persistence.
    try {
      if (typeof this.config.persistence.clearAll === 'function') {
        await this.config.persistence.clearAll();
      } else {
        // Fallback: at least drop the progress key we know about.
        await this.config.persistence.remove(this.progressKey());
      }
      this.progressCache = undefined;
      receipt.clearedLocal = true;
    } catch (err) {
      receipt.errors.push(`persistence clear failed: ${String(err)}`);
    }
    // Emit the signal. Host analytics sink is expected to propagate to their
    // vendor (PostHog $delete_user, Amplitude POST /2/deletions, etc.).
    try {
      this.emit({
        name: 'user_forget_requested',
        payload: {
          userId,
          timestamp: receipt.timestamp,
          scope: userId ? 'both' : 'local',
        },
      });
      receipt.emittedAnalyticsSignal = true;
    } catch (err) {
      receipt.errors.push(`emit failed: ${String(err)}`);
    }
    return receipt;
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

  /**
   * Sprint 18 (T-260). Swap the registered tour set — the counterpart to
   * `RemoteContentSource`'s `content_bundle_updated` event.
   *
   * Semantics per ADR-0008: an active tour keeps running against the tour
   * object it captured at start time. The swap only affects tour starts
   * from this call onward. URL / event triggers rebind to the new set;
   * `first-run` gates are re-evaluated on the next progress read.
   *
   * Returns `{ added, removed, kept }` id-lists for observability.
   */
  replaceTours(newTours: readonly Tour[]): { added: string[]; removed: string[]; kept: string[] } {
    const prevIds = new Set(this.toursById.keys());
    const nextIds = new Set(newTours.map((t) => t.id));
    const added = [...nextIds].filter((id) => !prevIds.has(id));
    const removed = [...prevIds].filter((id) => !nextIds.has(id));
    const kept = [...nextIds].filter((id) => prevIds.has(id));

    this.toursById = new Map(newTours.map((t) => [t.id, t]));
    this.triggerManager.remount([...newTours]);

    return { added, removed, kept };
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
              console.warn('[in-app-training] redirect step navigation failed', err);
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
    console.warn(`[in-app-training] media type "${media.type}" not yet rendered; skipping`);
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

  private handleDismiss(reason: 'user-skip' | 'manual' | 'superseded'): void {
    const active = this.activeTour;
    if (!active) return;
    // Sprint 10: cancel the goal runner on user-initiated dismissal so a goal
    // event that fires later doesn't misrepresent an abandoned tour as a
    // conversion. Superseded (a new tour starts) leaves the old runner alive.
    if (reason !== 'superseded' && active.goalRunner) {
      active.goalRunner.cancel();
      this.goalRunners.get(active.tour.id)?.delete(active.goalRunner);
    }
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
    // Sprint 12 (ADR-0006): analytics-emission gate. Look up the tour by id
    // on tour-lifecycle events and skip the sink call if its category isn't
    // granted. user_forget_requested is exempt — the host wants that signal.
    if (this.config.consent && event.name !== 'user_forget_requested') {
      const payload = event.payload as { tourId?: string };
      if (payload.tourId) {
        const tour = this.toursById.get(payload.tourId);
        if (tour && !isCategoryAllowed(tour.consentCategory, this.config.consent.read())) {
          // Silently drop analytics; still notify local listeners for
          // in-process reactivity (checklist, dev tools).
          this.notifyLocalListeners(event);
          return;
        }
      }
    }
    try {
      this.config.analytics.track(event.name, event.payload as unknown as Record<string, unknown>);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[in-app-training] analytics adapter threw:', err);
    }
    this.notifyLocalListeners(event);
  }

  private notifyLocalListeners(event: TrainingEvent): void {
    const set = this.listeners.get(event.name);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(event as never);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[in-app-training] event listener threw:', err);
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
