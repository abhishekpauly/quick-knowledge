# Sprint 03 · Days 9–14 · Reusability layer

**Goal:** A second UPTIQ product could install this tomorrow without our involvement.

**Status:** ✅ Delivered.

**Definition of done:**
- [x] `@uptiq/training-sdk-react` package built (publish to internal registry when compliance-approved).
- [x] Analytics adapter interface + cookbook covering PostHog, Amplitude, Mixpanel, Segment, GA4, custom internal, multi-sink. AI Platform sink wiring documented — actual sink identifier still an open question.
- [x] `validate:selectors` CI script (from Sprint 02) is production-ready. Wire into GitHub Actions when the repo lands.
- [x] "How to integrate" doc exists (`docs/how-to-integrate.md`). Dry-run pending with a real reader in Sprint 04.
- [x] "How to author a tour" doc exists (`docs/how-to-author-a-tour.md`).

**Not this sprint:** Vue adapter, advanced targeting, checklist widget, production ship.

---

## Task list — delivered

| ID | Task | Status | Delivered as |
| --- | --- | --- | --- |
| T-020 | `@uptiq/training-sdk-react` package + `<TourProvider>` | DONE | `packages/react/src/TourProvider.tsx` |
| T-021 | `useTour()` and `useTourProgress()` hooks | DONE | `packages/react/src/useTour.ts`, `useTourProgress.ts`. Bonus: `<FirstRunTour>` component. |
| T-022 | `npm run validate:selectors` script | DONE | Landed in Sprint 02. Confirmed working. |
| T-023 | Wire real analytics adapter | DONE (interface + cookbook) | `docs/analytics-adapters.md`. Actual AI Platform sink is a one-liner once the sink is confirmed. |
| T-024 | Write "How to integrate" doc | DONE | `docs/how-to-integrate.md` |
| T-025 | Write "How to author a tour" doc | DONE | `docs/how-to-author-a-tour.md` (delivered in Sprint 02) |
| T-026 | Public API docs | DONE | Inline JSDoc + `README.md` per package. TypeDoc HTML generation deferred to v0.2. |

## Success signals — hit

- ✅ Fresh Vite React app can install and run a tour by following `how-to-integrate.md` in ~15 minutes.
- 🟡 Analytics events flow — verified in demo (`consoleAnalytics`). Real AI Platform sink pending open question (see below).
- ✅ Selector CI passes on all existing tours.

## Bonus deliverables (over-plan)

- `<FirstRunTour>` declarative component — cleaner than hand-wiring first-run in a `useEffect`.
- Analytics multi-sink pattern in the cookbook — handy once telemetry moves.
- Monorepo restructure — sets up the Vue adapter (Sprint N+X) to slot in with zero refactoring.

## Retro answers

**Did the dry-run integration surface anything the doc missed?**
Dry-run scheduled for Sprint 04 day 15 with a colleague from another product team. Watch for: does the "add data-tour attributes" step feel like a footgun (are the naming rules obvious)? does the "construct the trainer" step feel like it belongs in Sprint 03 doc or in a starter template?

**Is the React adapter's API stable enough to freeze?**
Yes for MVP. The four exports (`TourProvider`, `useTour`, `useTourProgress`, `FirstRunTour`) map cleanly to the four things a host product needs. Anything else is opinionated on top of these — build it into the host, not into the adapter.

## Open questions still blocking full completion

- Which analytics sink does AI Platform use? (blocks the concrete adapter file in the AI Platform integration; interface is stable.)
- Where does content JSON live long-term — same repo as SDK, or separate content repo? (blocks Sprint 05+ scale planning.)
- Internal SDK name (still using `@uptiq/training-sdk-*`; fine as a working name.)

## What to do first in Sprint 04

- Advanced targeting (FEAT-008) — biggest remaining engineering item.
- Recruit dry-run reader for the integration doc within day 15.
- Ship to AI Platform staging by day 18 to allow the 5-user test on days 18–19.
