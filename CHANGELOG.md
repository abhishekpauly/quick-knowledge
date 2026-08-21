# Changelog

All notable changes to this project. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Sprint 10 · v0.5.0-goals-preview · Goals kickoff + Sprint 09 carry-overs

- **T-130** · GoalSchema additive on TourSchema. Every existing tour still validates. 9 tests.
- **T-131** · GoalsSink interface in packages/core/src/adapters/goals.ts + TrainerConfig.goals? optional field.
- **T-132 + T-133** (bundled) · GoalRunner in packages/core/src/engine/GoalRunner.ts — poll interval + one-shot expiry, single-flight, deduped warn on sink errors, cancelled on user dismiss but survives tour_completed. Two new events: tour_goal_reached, tour_goal_missed. TrainingEventName union 8 -> 10. Event dictionary regenerated. 11 new tests.
- **T-134** · Goal wired on content/example-app/onboarding.tour.json.
- **T-135** · Coverage above thresholds across all packages.
- **T-136** · Added missing pollMs field to the GoalsSink stub in docs/wiring-goals.md.
- **T-137** (closes Sprint 09 T-120) · Optional preferredCorner on Pin schema. React + Vue parity. Default preserves prior top-right behaviour.
- **T-138** (closes Sprint 09 T-121) · pin_shown dedupe swapped for localStorage-backed keys.
- **T-139** (closes Sprint 09 T-122) · product/investigations/pin-effectiveness-s10.md — 20-session replay confirmed pins are working.
- **T-140** · releases/v0.5.0-goals-preview-launch-log.md — simulated staging -> prod. Onboarding tour_goal_reached 63.1% closes the v0.1.0 drop-off hypothesis.

**Tag:** v0.5.0-goals-preview.

**Sprint 11 shape:** Adopter Product A onboarding (their data-tour PR merged Day 54). v1.0 prep slides to Sprint 12.

**Green:** npm run ci and npm run test:coverage both exit 0.


### Sprint 09 · v0.5.0 Pins on Example App

- **T-110** · `PinSchema` + `PinsFileSchema` (Zod, additive). `validate:content` walks `*.pins.json` alongside `*.tour.json`. `parsePinsFile` + `loadPins` in the loader (global id dedupe across files). 15 schema tests.
- **T-111** · [`packages/core/src/engine/PinAnchor.ts`](packages/core/src/engine/PinAnchor.ts) — framework-agnostic anchoring. `waitForElement` + target `MutationObserver` (subtree + attr) + window `resize` + capture-phase `scroll` + body-level removal observer. 10 tests.
- **T-112** · React `<PinsProvider>` + `<Pin>` in [`packages/react/src/PinsProvider.tsx`](packages/react/src/PinsProvider.tsx). Portal to `document.body`, `in-app-training:pins:dismissed:<id>` localStorage persistence, `data-in-app-training="1"` marker for T-092 collision detection. 9 tests.
- **T-113** · Vue parity port [`packages/vue/src/PinsProvider.ts`](packages/vue/src/PinsProvider.ts) using `Teleport` + `provide/inject` via new `PinsKey`. 9 tests.
- **T-114** · Two new events (`pin_shown`, `pin_dismissed`) in `TrainingEventName` — union grew 6 → 8. Payloads `{ pinId, target, timestamp }`. Optional `analytics` prop on `PinsProvider`. `pin_shown` deduped per session; `pin_dismissed` on Dismiss click. Event dictionary regenerated (drift check happy). 6 new tests.
- **T-115** · [`content/example-app/example-app.pins.json`](content/example-app/example-app.pins.json) — 3 pins (share-workflow, user-menu-settings, create-project-shortcut) from the v0.1.0 retro rewrite themes.
- **T-116** · [`docs/how-to-use-pins.md`](docs/how-to-use-pins.md) — authoring + integration recipe, Pin-vs-Tour-vs-Hint decision box, anchoring caveats, consent posture, success criteria.
- **T-117** · Coverage stays above thresholds in every package (core 84.48% funcs, react 82.22%, vue 85.45% — all ≥ 80).
- **T-118** · [`releases/v0.5.0-pin-preview-launch-log.md`](releases/v0.5.0-pin-preview-launch-log.md) — simulated staging→prod walkthrough. All success criteria hit; 3 follow-ups filed (T-120, T-121, T-122). Sprint 10 = Goals kickoff.

**Tag:** `v0.5.0-pin-preview`.

**Green:** `npm run ci` and `npm run test:coverage` both exit 0 across the sprint. 210+ tests passing.


### Sprint 08 · bridge into v0.5

- **T-090** · Event dictionary exporter. `scripts/generate-event-dictionary.ts` parses `events.ts` via the TS compiler API and emits `docs/event-dictionary.md` + `docs/event-dictionary.json`. `npm run docs:events:check` fails CI on drift. Wired into `npm run ci`.
- **T-091** · Onboarding drop-off investigation ([`product/investigations/onboarding-drop-off-s08.md`](product/investigations/onboarding-drop-off-s08.md)). 20-session PostHog replay sample classified: 65% went-to-goal, 15% abandoned, 10% confused, 10% ambiguous. Retro hypothesis confirmed. Recommendation: adopt Goals (v0.5) to measure correctly; do not "fix" the tour.
- **T-092** · `TrainingChecklist` `preferredCorners` prop (React + Vue). `pickFreeCorner` probes each candidate via `document.elementFromPoint`; the widget marks itself with `data-in-app-training="1"` so re-probes recognise us. 12 new shared-logic tests.
- **T-093** · Two v1.0 compliance ADRs (design only). [`ADR-0005-gdpr-delete-api.md`](docs/adrs/ADR-0005-gdpr-delete-api.md) specs `trainer.forgetUser(userId?)` returning a receipt; analytics is a host-signalled event, not a sink call. [`ADR-0006-consent-gating-hook.md`](docs/adrs/ADR-0006-consent-gating-hook.md) specs `ConsentAdapter` on `TrainerConfig` + additive `consentCategory` on the tour schema.
- **T-094 / T-095** · Adopter-#2 outreach ([`product/adopter-scouting.md`](product/adopter-scouting.md)). Adopter Product A committed as adopter #2 (React, real onboarding pain, PostHog, Sprints 10–11). Adopter Product B deferred to Pins-first integration (Vue, low tour pain but strong Pins fit).
- **T-096** · v0.5 kickoff document ([`product/v0.5-kickoff.md`](product/v0.5-kickoff.md)). Pins + Goals scoped in detail — schemas, API surfaces, events, success criteria, Sprint 9 + 10–11 day-by-day plans. Explicit non-goals keep Banners / Launchpad / NPS / Surveys / Webhooks HOLD.

**Green:** `npm run ci` and `npm run test:coverage` both exit 0. 178 tests (110 core / 34 react / 34 vue). Coverage above thresholds in every package.



---

## [v0.1.0] - 2026-08-28

### Sprint 07 launch-prep additions

- **`releases/host-theme-handoff.md`** — design hand-off doc: the exact tokens `exampleAppTheme` needs, a11y contrast checklist, paste-ready response format for design.
- **`releases/v0.1.0-retro.md`** — pre-written retro skeleton (T-072). Fill on day 35. Includes the v0.5 go/hold/drop table the sprint plan contractually requires.
- **`content/example-app/_drafts/`** — three shape-complete tour skeletons (second-basic, intermediate, common-task) with placeholder selectors and `[TODO]`-tagged copy. Underscore prefix keeps them out of `validate:content` until the author renames.
- **`tracker/sprint-07.md`** — Sprint 07 plan (launch + hardening, days 27–35). T-060 through T-072.
- **`releases/compliance-review-request.md`** — pre-filled owner and timeline brackets (T-060 partial).
- **`releases/adopter-data-tour-pr.md`** — pre-filled repo/docs/ADR links (T-061 partial).

### Fixed (hardening)

- **`scripts/validate-content.ts`** — import path was `../src/schema/loader.js`, correct path is `../packages/core/src/schema/loader.js`. Script now runs.
- **`packages/*/tsconfig.build.json`** — added `rootDir: "src"` to each. Without it, TypeScript emitted `dist/src/index.js` while `package.json exports` pointed at `dist/index.js` — every cross-package import (`@in-app-training/sdk` from react and vue) failed at test time. All three packages now emit at the paths their `exports` map declares.

### Fixed hardening blockers (T-073, T-074)

_Landed via two parallel commits (PR #1 and this branch's Sprint 07 pre-flight pass). Same root causes, same code-level fix on the overlapping items; the merge dedup'd the shared changes and kept the Sprint 07 branch's superset of surrounding cleanups._

- **T-073 · Shepherd.js types.** Root cause: `import type Shepherd from 'shepherd.js'` was treated as a namespace (`Shepherd.Tour`, `Shepherd.Step.StepOptions`, …), but shepherd.js@14 exports these as named types, not namespace members. Switched to named type imports with aliases (`ShepherdTour`, `ShepherdStepOptions`, `ShepherdStepOptionsButton`, `ShepherdStepOptionsAttachTo`). Dropped a redundant `as typeof Shepherd` cast on the lazy runtime import.
- **T-074 · Vue package implicit-any.** Root cause: the 8 implicit-any errors were downstream of the `Cannot find module '@in-app-training/sdk'` — TypeScript couldn't infer callback param types because the types-of-record for `trainer.on(...)` were missing. Fixed by the build config change (see `Fixed (hardening)` above): once `packages/core/dist/index.d.ts` exists at the path `package.json exports` declares, all inference lands correctly and the implicit-anys disappear.
- **Trainer.ts `EventListener` generic narrowing.** `set.add(listener as EventListener)` failed strict conversion checks because `EventListener<N>` isn't assignable to erased `EventListener` without going through `unknown`. Added the `as unknown as` step in three places (Trainer emit + register + unregister).
- **`noUncheckedIndexedAccess` test misses.** `ph.calls[0][0]` and `result.failures[0].index` in the tests type-check under strict now (`ph.calls[0]!` / `result.failures[0]!`).
- **React tests missing RTL cleanup.** `packages/react/tests/setup.ts` calls `afterEach(cleanup)`, wired via `vitest.config.ts` `setupFiles`. Without it, checklist renders leaked across cases and `getByTestId` matched multiple pills.
- **Test fixture: 1-char `data-tour` selectors.** The `dataTourSelector` regex requires ≥2 chars (matches the kebab-case ID rule). Two test cases used `[data-tour="x"]`; changed to `[data-tour="xx"]`.

**Result:** `npm run ci` (`typecheck && lint && test && validate:content`) exits 0. 114 tests pass across three packages (89 core / 18 react / 7 vue).

### Added — v0.1.0 body (was under a duplicate header, now consolidated)

**Launch-ready wrap · PostHog wired + status doc**
- **`posthogAnalytics()`** — concrete PostHog adapter shipped as the default sink. Structural typing on the `PostHogLike` interface keeps our bundle from a hard dependency on `posthog-js` (consumer passes the instance in). Configurable event prefix (default `training.`). Contract-compliant error handling — swallows and warns, never throws.
- **`docs/wiring-analytics-sink.md`** updated to reflect PostHog as the default; other sinks remain one-line swaps.
- **`product/launch-status.md`** — single-page truth doc: engineering complete, three external actions remain (compliance email, frontend PR, sink confirmation), parallel-safe work if blocked.
- **`tracker/backlog.md`** — open-questions section closed. All five original blockers resolved.
- **`posthog-adapter.test.ts`** — verifies prefix behavior, custom prefix, error swallowing.

**Part A · v0.1 launch prep + Vue adapter (un-deferred)**
- **`@in-app-training/vue`** — new package. Full API parity with the React adapter: `TourProvider`, `useTour`, `useTourProgress`, `useAllTourProgress`, `FirstRunTour`, `TrainingChecklist`, `HintsProvider`, `TrainingHint`. Vue 3, uses provide/inject, composables + `defineComponent` + `h()` (JSX-free). Un-deferred from FEAT-011 because the example app frontend is 50/50 React/Vue.
- **Vue adapter test suite** — Vitest + @vue/test-utils. Provider errors, useTour reactivity, HintsProvider + TrainingHint.
- **`placeholderAnalytics()`** — first-run-only console-warned no-op adapter for the launch window when the concrete sink is TBD. Auto-warns on first `track` call so it can't be silently left in production.
- **`docs/wiring-analytics-sink.md`** — drop-in recipes for PostHog / Amplitude / Mixpanel / custom, wiring instructions, launch-day checklist.
- **`sample-content-repo/`** — scaffold of the separate-per-product content repo pattern (per direction). Includes `package.json`, `src/index.ts` (typed parsed exports), README explaining the extract-to-real-repo process, and validation scripts.
- **`docs/content-repos.md`** — full doc on the separate-content-repo model: anatomy, package.json, `src/index.ts`, host integration, governance, naming convention, extraction checklist.
- **`releases/adopter-data-tour-pr.md`** — paste-ready PR description for the example app frontend team, with the 9 selector rows and reviewer instructions.
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
- **Public API additions.** From `@in-app-training/sdk`: `placeholderAnalytics`, `isAllowedByFrequency`, `markSeenThisSession`, `_resetSessionState`, `readPermalinkTourId`, `StepTypeSchema`, `FrequencySchema`, types `StepType` and `Frequency`.

**Sprint 05 — v0.2 kickoff · targeting + polish**
- **Property-based audience targeting.** Tours declare `audience: ["plan:enterprise", "!role:trial"]`. TrainerConfig accepts `userAttributes`. Matcher supports AND semantics and negation. Missing attribute makes positive atoms fail and negative atoms pass. `matchesAudience` exported for adapters and tests.
- **Localization.** User-facing strings (title, description, step title/body, action labels) accept `string | { [locale]: string }`. Fully backward compatible — every existing tour still validates. Resolver picks by TrainerConfig.locale with exact → language-only → first-key fallback. `resolveLocale` exported.
- **Personalization templating.** `{{user.firstName}}` interpolation in any user-facing string, drawing from TrainerConfig.userAttributes. HTML-escaped by default (XSS-safe). Dotted paths and top-level keys supported. Unknown paths resolve to empty string with a dev warning. `personalize` exported.
- **Image rendering in step body.** The `media` field now renders as an inline `<img>` above the body text with theme-driven styling. Video type reserved for v0.5.
- **Reactive checklist pill count.** `<TrainingChecklist>` now shows accurate `completed/total` on the pill and updates as tours complete. Implemented via new `useAllTourProgress` hook — reads all-tour progress reactively at the widget level (avoids Rules-of-Hooks violation from per-item useTourProgress calls).
- **Checklist auto-suppress under active tour.** `<TrainingChecklist>` hides while any tour is running so it doesn't compete for attention. `hideDuringActiveTour` prop (default `true`) can be set to `false` to keep the widget visible.
- **Public API additions.** From `@in-app-training/sdk`: `LocalizedStringSchema`, `LocalizedString`, `matchesAudience`, `UserAttributes`, `resolveLocale`, `personalize`, `PersonalizationContext`. From `@in-app-training/react`: `useAllTourProgress`.
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
- `hints.json` for the example app with three real hints (workflow node name, project region, model max tokens).
- Progress cache hydrated eagerly on Trainer construction so first-run gates are correct on cold load.
- Tests: `targeting.test.ts`, `triggers.test.ts`, `advance.test.ts`, `hints.test.ts`, `TrainingChecklist.test.tsx`, `TrainingHint.test.tsx`.
- `testing/five-user-test-protocol.md` — recruit / script / note template / decision rubric for pre-launch usability testing.
- `testing/analytics-verification.md` — event-by-event checklist for confirming the sink receives what the SDK emits.
- Public API additions: `waitForElement`, `TargetTimeoutError`, `HintSchema`, `HintsFileSchema`, `parseHints`, `Hint`, `HintsFile` from `@in-app-training/sdk`; `TrainingChecklist`, `HintsProvider`, `TrainingHint` from `@in-app-training/react`.

**Sprint 03 — Reusability layer**
- New package `@in-app-training/react` with `<TourProvider>`, `useTour()`, `useTourProgress()`, `<FirstRunTour>`.
- Repository restructured to npm workspaces monorepo (`packages/core`, `packages/react`).
- `docs/how-to-integrate.md` — step-by-step integration guide for host product teams.
- `docs/analytics-adapters.md` — concrete `Analytics` implementations for PostHog, Amplitude, Mixpanel, Segment, GA4, custom internal, and multi-sink patterns.
- React adapter test suite (Vitest + React Testing Library) covering provider errors, `useTour` reactivity, unsubscribe on unmount, `useTourProgress` reactivity and per-tour filtering.
- Root README updated for monorepo layout.

**Sprint 02 — MVP as a real package**
- `@in-app-training/sdk` published as an npm package with public API surface.
- Zod v1 content schema with `SCHEMA_VERSION` sentinel.
- Content loader (`parseTour`, `loadContent`) that never throws.
- Console / no-op / memory analytics adapters.
- LocalStorage + in-memory persistence adapters (localStorage falls back automatically).
- CSS-variable theming with default and the example app stub themes.
- Two real tour JSON files: onboarding + create-workflow.
- CLI validators: `validate-content.ts` (Zod schema) and `validate-selectors.ts` (grep host codebase).
- Vitest test suite: schema, persistence, trainer lifecycle.
- Runnable demo (`npm run dev`) with mock the example app layout.
- `docs/how-to-author-a-tour.md` — curriculum-author-facing guide.
- `tracker/sprint-01-selectors.md` — proposed `data-tour` IDs for the example app PR.

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
