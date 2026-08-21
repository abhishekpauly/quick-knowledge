# Sprint 09 · Days 43–49 · v0.5 kickoff — Pins on Example App

**Goal:** Ship Pins end-to-end. Schema, engine anchoring, React + Vue components, 3 real Pins live on the example app, analytics + coverage green, and the v0.5 kickoff plan honoured. First experience-type addition since v0.1.

**Status:** COMPLETE. All 9 tasks (T-110..T-118) DONE. Tag `v0.5.0-pin-preview` cut per `releases/v0.5.0-pin-preview-launch-log.md`. 3 follow-ups filed for Sprint 10 (T-120, T-121, T-122). Sprint 10 = Goals kickoff (default shape wins).

**Scope anchor:** [`product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) `## Feature 1 — Pins`. This sprint executes that plan. Any scope creep (Goals, second-product integration) is explicitly out.

**Definition of done:**
- [x] `PinSchema` + `PinsFileSchema` (Zod) added additively to `packages/core/src/schema/v1.ts`. Schema tests for accept + reject cases.
- [x] `validate:content` picks up `*.pins.json` alongside `*.tour.json` and validates them.
- [x] Core `PinAnchor` class in `packages/core/src/engine/PinAnchor.ts`. Wraps `waitForElement`, owns positioning + a `MutationObserver` for target churn.
- [x] `@in-app-training/react` ships `<PinsProvider>` + `<Pin>`. Portal-mounted. Dismissal persists via `in-app-training:pins:dismissed:<id>` in localStorage.
- [x] `@in-app-training/vue` ships full API parity — `<PinsProvider :pins />` + `<Pin id />`.
- [x] Analytics: `pin_shown` and `pin_dismissed` events land in `TrainingEventName`, payload types defined, event dictionary regenerated (`npm run docs:events`), CI drift check green.
- [x] 3 real Pins authored for the example app from the v0.1.0 retro's rewrite themes; live in `content/example-app/example-app.pins.json`.
- [x] `docs/how-to-use-pins.md` written (mirror `how-to-author-a-tour.md`).
- [x] All existing tests still pass. New test coverage keeps every package ≥ 80/80/80/75.
- [x] `npm run ci` and `npm run test:coverage` both exit 0 all sprint. No regression in the CI-required gates.
- [x] Simulated staging → production walkthrough (per the launch-log pattern): dry-run tag `v0.5.0-pin-preview`; the real launch log lands with T-113.

**Not this sprint:**
- **No Goals code.** That's Sprint 10–11 per `v0.5-kickoff.md`. The events dictionary gets Pin events only.
- **No adopter-#2 SDK integration.** Adopter Product A's `data-tour` PR opens Week 3 (T-105) but Pin-authoring for Adopter Product A is Sprint 10.
- **No pin-triggered tours.** Deferred to v0.6.
- **No pin analytics dashboard.** Numbers land in PostHog; hosts read them there.
- **No new tour features.** Any tour-side work outside a bug fix is scope creep.

---

## Task list

See `backlog.md` T-110 through T-118.

| ID | Task | Est | Owner | Notes |
| --- | --- | --- | --- | --- |
| T-110 | `PinSchema` + `PinsFileSchema` in `packages/core/src/schema/v1.ts`; loader recognises `*.pins.json` | 1d | Abhishek | Additive to v1. Fields: `id`, `target`, `title`, `body`, `learnMoreUrl?`, `audience?`, `dismissible?` (default true), `showUntil?`. All user-facing strings accept `LocalizedString`. |
| T-111 | `PinAnchor` — core positioning primitive (waitForElement + MutationObserver + resize handler) | 1d | Abhishek | Framework-agnostic. Emits a callback on target ready + rect change. Reused by React and Vue. |
| T-112 | `@in-app-training/react` `PinsProvider` + `Pin` — Portal, dismissal state, localStorage persistence | 1d | Abhishek | Follows the `TourProvider` + `TrainingChecklist` pattern. `data-in-app-training="1"` stamped on the pin root (reuses the collision-detection story from T-092). |
| T-113 | `@in-app-training/vue` parity port — `PinsProvider` + `Pin` | 1d | Abhishek | Same public API. Vue tests reach parity per T-080 pattern. |
| T-114 | `pin_shown` + `pin_dismissed` events; add to `TrainingEventName`; regen event dictionary | 0.5d | Abhishek | ADR-0006 default `consentCategory: 'functional'`. Payloads: `{ pinId, target, timestamp }` for both. |
| T-115 | Content: 3 Pins for the example app in `content/example-app/example-app.pins.json` | 0.5d | curriculum author | From retro rewrite themes: (1) share-workflow, (2) settings-menu, (3) create-project. |
| T-116 | `docs/how-to-use-pins.md` — authoring + integration recipe | 0.5d | Abhishek | Mirror `how-to-author-a-tour.md`. Include a "when to use a Pin vs. a Tour vs. a Hint" decision box. |
| T-117 | Tests — schema, PinAnchor, provider (React + Vue), dismissal persistence | 1.5d | Abhishek | Coverage thresholds must not slip. Add a shared `pickFreeCorner`-style test helper for anchoring under jsdom. |
| T-118 | Simulated staging → production walkthrough + Sprint-09 retro | 0.5d | Abhishek | New file `releases/v0.5.0-pin-preview-launch-log.md` in the shape of `v0.1.0-launch-log.md`. Retro rolls into Sprint 10 planning. |

---

## Sequencing

- **Day 43 (Mon):** T-110 schema + loader. Ship the shape first so everything downstream keys off it.
- **Day 44 (Tue):** T-111 `PinAnchor` core. No UI yet; unit-test the anchoring against a jsdom target + resize.
- **Day 45 (Wed):** T-112 React `PinsProvider` + `Pin`. Manual demo tab.
- **Day 46 (Thu):** T-113 Vue port. Test parity.
- **Day 47 (Fri):** T-114 analytics events + event-dictionary regen. T-116 `how-to-use-pins.md`. T-115 author the 3 Pins.
- **Day 48 (Mon):** T-117 tests (fill any coverage gaps). Manual QA at 3 breakpoints on the demo.
- **Day 49 (Tue):** T-118 walkthrough log + retro. Tag `v0.5.0-pin-preview`.

## Success signals

- Every DoD item ticked.
- Existing 178 tests plus new Pin coverage; overall counts up by ~25.
- No regression in `npm run test:coverage` — every package still at or above the 80/80/80/75 thresholds.
- No new events sneak into the dictionary that aren't Pin-related (Goals stays out).
- `how-to-use-pins.md` is a document a curriculum author can read cold and ship a Pin from.
- Simulated launch-log matches the v0.1.0 log's shape and completeness.
- Sprint-09 retro yields a **concrete Sprint 10 shape** — either "start Goals" (default) or "onboard Adopter Product A first" if their `data-tour` PR has merged.

## Explicit non-blockers

Do not let any of these hold the sprint:

- **Adopter Product A's `data-tour` PR merging on time.** Their canvas refactor is 2 weeks. Sprint 09 stays example-app-focused.
- **PostHog dashboard readiness for Pin metrics.** Events emitted; dashboard is host-side.
- **A perfect anchoring story for animated targets.** Best-effort with `MutationObserver`; edge cases go to backlog.

## What Sprint 10 will look like (preview, not commitment)

Depends on Sprint-09 retro:

1. **Default: start Goals** per `v0.5-kickoff.md` `## Feature 2 — Goals`. `hasEventOccurred` sink contract, additive `goal` tour field, `tour_goal_reached`/`_missed` events. Goal wired on the example app onboarding tour to answer the v0.1.0 retro's drop-off hypothesis with data.
2. **Adopter-A-first.** If Adopter Product A's `data-tour` PR merges in Sprint 09 Week 3 as scheduled, Sprint 10 opens with authoring Adopter Product A's first tour (Add-your-first-data-source) plus their Pin content, staging + retro. Goals slides to Sprint 11.
3. **Bug-triage pivot.** If Sprint 09 produces P0 fallout in production, Sprint 10 fixes first, defers.

Retro at end of Sprint 09 picks the shape.
