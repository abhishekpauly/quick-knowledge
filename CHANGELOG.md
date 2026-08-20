# Changelog

All notable changes to this project. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

**Launch-ready wrap · PostHog wired + status doc**
- **`posthogAnalytics()`** — concrete PostHog adapter shipped as the default sink. Structural typing on the `PostHogLike` interface keeps our bundle from a hard dependency on `posthog-js` (consumer passes the instance in). Configurable event prefix (default `training.`). Contract-compliant error handling — swallows and warns, never throws.
- **`docs/wiring-analytics-sink.md`** updated to reflect PostHog as the default; other sinks remain one-line swaps.
- **`product/launch-status.md`** — single-page truth doc: engineering complete, three external actions remain (compliance email, frontend PR, sink confirmation), parallel-safe work if blocked.
- **`tracker/backlog.md`** — open-questions section closed. All five original blockers resolved.
- **`posthog-adapter.test.ts`** — verifies prefix behavior, custom prefix, error swallowing.

**Part A · v0.1 launch prep + Vue adapter (un-deferred)**
- **`@uptiq/training-sdk-vue`** — new package. Full API parity with the React adapter: `TourProvider`, `useTour`, `useTourProgress`, `useAllTourProgress`, `FirstRunTour`, `TrainingChecklist`, `HintsProvider`, `TrainingHint`. Vue 3, uses provide/inject, composables + `defineComponent` + `h()` (JSX-free). Un-deferred from FEAT-011 because the AI Platform frontend is 50/50 React/Vue.
- **Vue adapter test suite** — Vitest + @vue/test-utils. Provider errors, useTour reactivity, HintsProvider + TrainingHint.
- **`placeholderAnalytics()`** — first-run-only console-warned no-op adapter for the launch window when the concrete sink is TBD. Auto-warns on first `track` call so it can't be silently left in production.
- **`docs/wiring-analytics-sink.md`** — drop-in recipes for PostHog / Amplitude / Mixpanel / custom, wiring instructions, launch-day checklist.
- **`sample-content-repo/`** — scaffold of the separate-per-product content repo pattern (per direction). Includes `package.json`, `src/index.ts` (typed parsed exports), README explaining the extract-to-real-repo process, and validation scripts.
- **`docs/content-repos.md`** — full doc on the separate-content-repo model: anatomy, package.json, `src/index.ts`, host integration, governance, naming convention, extraction checklist.
- **`releases/ai-platform-data-tour-pr.md`** — paste-ready PR description for the AI Platform frontend team, with the 9 selector rows and reviewer instructions.
- **`releases/compliance-review-request.md`** — paste-ready security-review request covering deployment posture, data flow, third-party deps, personalization XSS mitigations, threat model, GDPR posture.
- **`releases/deploy-runbook.md`** — environment-agnostic day-of runbook (pre-flight → staging → 5-user test → production → post-deploy monitoring → rollback triggers), plus support-team briefing template + internal announcement template.

**Part B · Sprint 06 — v0.2 targeting rest**
- **Frequency limits.** Tour declares `frequency: "once" | "session" | "day" | "week" | "always"` (default `once`). Gates auto-triggers; manual starts bypass. `lastRunAt` timestamp added to `TourProgress`. Session-scoped tracking is in-memory (clears on reload).
- **Flow priority.** Tour declares `priority: number` (default 0). When multiple auto-triggers fire in the same tick, the highest-priority tour wins; others are dropped. Manual starts unaffected.
- **Permalinks.** `?training=<tour-id>` URL param starts the specified tour on load, bypassing audience / prerequisite / frequency gates. For QA, support handoffs, and sales demos. Ignores malformed / unknown tour IDs safely.
- **Slideout step pattern.** `stepType: "slideout"` renders with `training-slideout` CSS class so consumers can style the slide-in animation. `placement` picks the edge.
- **Hotspot step pattern.** `stepType: "hotspot"` renders no buttons; auto-installs a click-on-target advance-on. Consumers style the beacon via the `training-hotspot` CSS class.
- **Redirect step type.** `stepType: "redirect"` with `redirectUrl` navigates the user (SPA-friendly pushState for paths; `location.assign` for absolute URLs), waits `redirectWaitMs` (default 500ms), then advances. No tooltip UI rendered.
- **Sprint 6 tests.** `frequency.test.ts`, `permalink.test.ts`, plus new "Sprint 6 additions" section in `schema.test.ts` covering the new step types and tour-level fields.
- **Public API additions.** From `@uptiq/training-sdk`: `placeholderAnalytics`, `isAllowedByFrequency`, `markSeenThisSession`, `_resetSessionState`, `readPermalinkTourId`, `StepTypeSchema`, `FrequencySchema`, types `StepType` and `Frequency`.

**Sprint 05 — v0.2 kickoff · targeting + polish**
- **Property-based audience targeting.** Tours declare `audience: ["plan:enterprise", "!role:trial"]`. TrainerConfig accepts `userAttributes`. Matcher supports AND semantics and negation. Missing attribute makes positive atoms fail and negative atoms pass. `matchesAudience` exported for adapters and tests.
- **Localization.** User-facing strings (title, description, step title/body, action labels) accept `string | { [locale]: string }`. Fully backward compatible — every existing tour still validates. Resolver picks by TrainerConfig.locale with exact → language-only → first-key fallback. `resolveLocale` exported.
- **Personalization templating.** `{{user.firstName}}` interpolation in any user-facing string, drawing from TrainerConfig.userAttributes. HTML-escaped by default (XSS-safe). Dotted paths and top-level keys supported. Unknown paths resolve to empty string with a dev warning. `personalize` exported.
- **Image rendering in step body.** The `media` field now renders as an inline `<img>` above the body text with theme-driven styling. Video type reserved for v0.5.
- **Reactive checklist pill count.** `<TrainingChecklist>` now shows accurate `completed/total` on the pill and updates as tours complete. Implemented via new `useAllTourProgress` hook — reads all-tour progress reactively at the widget level (avoids Rules-of-Hooks violation from per-item useTourProgress calls).
- **Checklist auto-suppress under active tour.** `<TrainingChecklist>` hides while any tour is running so it doesn't compete for attention. `hideDuringActiveTour` prop (default `true`) can be set to `false` to keep the widget visible.
- **Public API additions.** From `@uptiq/training-sdk`: `LocalizedStringSchema`, `LocalizedString`, `matchesAudience`, `UserAttributes`, `resolveLocale`, `personalize`, `PersonalizationContext`. From `@uptiq/training-sdk-react`: `useAllTourProgress`.
- **Tests.** `audience.test.ts`, `localize.test.ts`, `personalize.test.ts`, plus new "Sprint 5 additions" section in `schema.test.ts` covering audience atoms and LocalizedString variants.
- **Sprint 05 plan doc + backlog updates.** `tracker/sprint-05.md`, `tracker/backlog.md` with T-040..T-047 for this sprint and T-050..T-055 seeded for Sprint 06.

**Sprint 04 — Hardening + release candidate**
- Advanced targeting: `waitForElement` (MutationObserver + timeout + AbortSignal) wired into every step via Shepherd's `beforeShowPromise`. On timeout, emits `tour_error` and skips the step gracefully instead of hanging.
- `TriggerManager` — evaluates `url` and `event` triggers. Monkey-patches `history.pushState`/`replaceState` so SPA navigation fires triggers (framework-router agnostic). Restored cleanly on `dispose()`.
- `advanceOn` conditions fully wired: `click` and `input` use delegated document-level listeners; `url` reuses the SPA-nav hook; `event` subscribes to the trainer's own event bus. Listeners attach on step show, detach on step hide.
- `<TrainingChecklist>` React component — collapsed corner pill + expanded panel, tours grouped by difficulty, prerequisite locking (unmet prereqs = disabled item), theme-driven styling via CSS variables, dismissible.
- `<TrainingHint>` React component + `HintsProvider` + `hints.ts` Zod schema. Hover-to-show + click-to-pin. 280-char body limit. Dev-mode visible warning for missing hint IDs.
- `Trainer.dispose()` — free trigger listeners, abort target waits, cancel active tour. Idempotent.
- `Trainer.getTours()` public method — the checklist widget reads content through the trainer, no separate wiring.
- Prerequisites gating: `trainer.start()` silently no-ops if a tour's prereqs are not `completed`.
- `hints.json` for AI Platform with three real hints (workflow node name, project region, model max tokens).
- Progress cache hydrated eagerly on Trainer construction so first-run gates are correct on cold load.
- Tests: `targeting.test.ts`, `triggers.test.ts`, `advance.test.ts`, `hints.test.ts`, `TrainingChecklist.test.tsx`, `TrainingHint.test.tsx`.
- `testing/five-user-test-protocol.md` — recruit / script / note template / decision rubric for pre-launch usability testing.
- `testing/analytics-verification.md` — event-by-event checklist for confirming the sink receives what the SDK emits.
- Public API additions: `waitForElement`, `TargetTimeoutError`, `HintSchema`, `HintsFileSchema`, `parseHints`, `Hint`, `HintsFile` from `@uptiq/training-sdk`; `TrainingChecklist`, `HintsProvider`, `TrainingHint` from `@uptiq/training-sdk-react`.

**Sprint 03 — Reusability layer**
- New package `@uptiq/training-sdk-react` with `<TourProvider>`, `useTour()`, `useTourProgress()`, `<FirstRunTour>`.
- Repository restructured to npm workspaces monorepo (`packages/core`, `packages/react`).
- `docs/how-to-integrate.md` — step-by-step integration guide for host product teams.
- `docs/analytics-adapters.md` — concrete `Analytics` implementations for PostHog, Amplitude, Mixpanel, Segment, GA4, custom internal, and multi-sink patterns.
- React adapter test suite (Vitest + React Testing Library) covering provider errors, `useTour` reactivity, unsubscribe on unmount, `useTourProgress` reactivity and per-tour filtering.
- Root README updated for monorepo layout.

**Sprint 02 — MVP as a real package**
- `@uptiq/training-sdk` published as an npm package with public API surface.
- Zod v1 content schema with `SCHEMA_VERSION` sentinel.
- Content loader (`parseTour`, `loadContent`) that never throws.
- Console / no-op / memory analytics adapters.
- LocalStorage + in-memory persistence adapters (localStorage falls back automatically).
- CSS-variable theming with default and AI Platform stub themes.
- Two real tour JSON files: onboarding + create-workflow.
- CLI validators: `validate-content.ts` (Zod schema) and `validate-selectors.ts` (grep host codebase).
- Vitest test suite: schema, persistence, trainer lifecycle.
- Runnable demo (`npm run dev`) with mock AI Platform layout.
- `docs/how-to-author-a-tour.md` — curriculum-author-facing guide.
- `tracker/sprint-01-selectors.md` — proposed `data-tour` IDs for the AI Platform PR.

**Sprint 01 — Scaffolding**
- README, ROADMAP, CHANGELOG, CONTRIBUTING.
- ADRs 0001–0004 (Shepherd base, `data-tour` contract, JSON content schema, adapter pattern).
- 15 feature specs (5 MVP-full, 5 P1 briefs, 5 deferred stubs) + template.
- Sprint 01–04 plans + backlog with priority/status/sprint per task.
- Test strategy + acceptance criteria.
- Deploy checklist, rollback runbook, v0.1.0-mvp release plan.

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## Versions

_No releases yet. First planned release: `v0.1.0-mvp` at end of Sprint 04. See `releases/v0.1.0-mvp.md`._
