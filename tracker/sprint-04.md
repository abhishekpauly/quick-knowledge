# Sprint 04 · Days 15–21 · Hardening + real users + production

**Goal:** Live in the example app production. Measurable completion rate on the onboarding tour.

**Status:** 🟡 Engineering complete. Operational tasks (staging, user test, production ship) require live-env access — checklists and protocols in place.

**Definition of done:**
- [x] Advanced targeting (wait-for-element, URL + event triggers) working — `packages/core/src/engine/targeting.ts` + `triggers.ts`.
- [x] `advanceOn` conditions (click / input / url / event) wired end-to-end — `advance.ts` + `Trainer.toShepherdStep`.
- [x] Checklist widget shipped — `packages/react/src/TrainingChecklist.tsx`.
- [x] Contextual `<TrainingHint>` component shipped — `packages/react/src/TrainingHint.tsx` + `HintsProvider.tsx`.
- [x] Hints schema (`schema/hints.ts`) + the example app hints content.
- [x] 5-user test protocol drafted — `testing/five-user-test-protocol.md`.
- [x] Analytics verification checklist drafted — `testing/analytics-verification.md`.
- [ ] Deployed to the example app staging — requires live env access.
- [ ] 5-user usability test executed — requires live env + recruited users.
- [ ] Deployed to production — requires live env access.
- [ ] Analytics dashboard shows real completion rates — requires production traffic.

---

## Task list — delivered

| ID | Task | Status | Delivered as |
| --- | --- | --- | --- |
| T-030 | Advanced targeting (wait-for-element, retry) | DONE | `targeting.ts` + wired via Shepherd `beforeShowPromise`. Skips on timeout with `tour_error`. |
| T-031 | URL trigger + event trigger | DONE | `TriggerManager` in `triggers.ts`. Monkey-patches `pushState`/`replaceState` for SPA nav. |
| T-032 | Checklist widget | DONE | `TrainingChecklist` — collapsed pill / expanded panel, grouped by difficulty, prerequisite locking, dismissible. Themed via CSS variables. |
| T-033 | Contextual `<TrainingHint>` | DONE | `TrainingHint` + `HintsProvider` + hints Zod schema. Hover-to-show + click-to-pin. Dev warning for missing IDs. |
| T-034 | Deploy to the example app staging | BLOCKED (env) | Follow `releases/deploy-checklist.md`. |
| T-035 | 5-user usability test | BLOCKED (people) | Follow `testing/five-user-test-protocol.md`. Recruit → run in one afternoon. |
| T-036 | Ship to production | BLOCKED (env) | Follow `releases/deploy-checklist.md`. Rollback: `releases/rollback-runbook.md`. |
| T-037 | Verify analytics events flowing | BLOCKED (env) | Follow `testing/analytics-verification.md`. |

## Bonus deliverables

- `dispose()` on Trainer for clean teardown (matters if hosts do HMR or React Strict Mode double-mount).
- `getTours()` public method so the checklist widget doesn't need to receive tours separately.
- Test coverage for `AdvanceOnHandler`, `TriggerManager`, `waitForElement`, `parseHints`, `TrainingChecklist`, `TrainingHint`.
- Prerequisites gating added to `Trainer.start` — a tour with unmet prerequisites silently does not start (no error, no event).

## Sequencing — actual vs plan

- **Days 15–16:** ✅ Advanced targeting + trigger manager + advanceOn wiring. Shipped as three focused modules (`targeting.ts`, `triggers.ts`, `advance.ts`) instead of one bloated Trainer file.
- **Day 17:** ✅ Checklist + `<TrainingHint>` + hints schema.
- **Day 18:** ⏳ Staging deploy + 5-user test — awaiting env access.
- **Day 19:** ⏳ Content iteration — awaiting user-test findings.
- **Day 20:** ⏳ Production deploy.
- **Day 21:** ⏳ Analytics verification + hotfix window.

## Risks — status

- **5-user test surfaces a structural issue.** Still a live risk. Protocol includes an explicit decision rubric (`change before shipping` vs. `file for v0.2` vs. `ignore`) to avoid ratholing.
- **Production release process bites us with a compliance/security gate.** Still open. Ask now, not day 20. Reflected in the backlog's open questions.
- **Shepherd.js v14 API drift.** Confirmed via test suite that our wrapper compiles and behaves; run real integration test on staging.
- **Trainer.dispose() vs. React 18 Strict Mode double-mount.** Ensured `dispose` is idempotent; verified via test.

## Retro questions — pending

- Was 5 users enough? (Answer after real test.)
- Which tours had the worst completion rate? Why? (Answer after 7 days in prod.)
- What's the highest-value item to promote from the deferred list? (Answer after prod metrics land.)

## Next after Sprint 04

Ship the release. Watch metrics for 7 days. Then run a v0.2 planning pass:
- Promote whichever deferred feature the metrics or the second-product intake calls for most.
- Vue adapter if a Vue product commits.
- Backend persistence if cross-device UX complaints appear.
