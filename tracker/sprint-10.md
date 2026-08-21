# Sprint 10 · Days 50–56 · Goals kickoff

**Goal:** Ship Goals end-to-end so a tour can declare "this was worthwhile if analytics event X fired within N minutes." Wire the goal on the example app onboarding tour to answer the v0.1.0 retro's `create-project → user-menu` drop-off hypothesis with data.

**Scope anchor:** [`product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) `## Feature 2 — Goals`. Executes that plan.

**Status:** Planned. Kicks off the day after Sprint 09 closes.

**Definition of done:**
- [ ] Additive `goal` field on `TourSchema` (Zod): `{ event, windowMinutes?, match? }`. Existing tour content still validates.
- [ ] `GoalsSink` interface exported from core: `hasEventOccurred(event, match, sinceIso) → Promise<boolean>`.
- [ ] `TrainerConfig` accepts optional `goals: GoalsSink`. Omitting it is a no-op — the trainer skips the goal-check loop entirely.
- [ ] Trainer schedules a per-tour goal check on `tour_started`. Polling cadence 60s (configurable via `TrainerConfig.goals.pollMs`, default 60000). Final check at window expiry.
- [ ] `tour_goal_reached` and `tour_goal_missed` events land in `TrainingEventName` (union grows 8 → 10). Payload `{ tourId, event, matchedAt | windowEndedAt }`. Event dictionary regenerated; CI drift check green.
- [ ] Dedupe per `(tourId, tourStartTimestamp)` — replaying `hasEventOccurred = true` twice must not fire `tour_goal_reached` twice for the same tour instance.
- [ ] Goal wired on `content/example-app/onboarding.tour.json`: `{ event: 'exampleapp.project_created', windowMinutes: 5 }`.
- [ ] `docs/wiring-goals.md` already exists (Sprint 08 warm-up). Cross-link from the new tests + verify the recipes still match the shipped interface.
- [ ] All Sprint-09 follow-ups closed: T-120 (`preferredCorners` on Pin), T-121 (user-scoped `pin_shown` dedupe), T-122 (session-replay probe writeup — simulated).
- [ ] Adopter Product A integration slotted where possible (see contingency below).
- [ ] `npm run ci` and `npm run test:coverage` both exit 0 all sprint. Coverage stays above 80/80/80/75.
- [ ] Simulated staging → production walkthrough per the launch-log pattern; tag `v0.5.0-goals-preview`.

**Not this sprint:**
- **No Goal analytics dashboard.** Numbers land in PostHog; hosts read them there.
- **No multi-goal-per-tour.** One tour = one goal.
- **No new experience types.** Banners / Launchpad / NPS / Surveys / Webhooks stay HOLD.
- **No polling-cadence customisation on the tour side.** `pollMs` is a trainer-config concern only; content authors don't touch it.

---

## Task list

See `backlog.md` T-130 through T-140.

| ID | Task | Est | Owner | Notes |
| --- | --- | --- | --- | --- |
| T-130 | `GoalSchema` on `TourSchema` (Zod, additive) | 0.5d | Abhishek | `{ event: string, windowMinutes?: number (default 60), match?: Record<string, unknown> }`. Tests: accept + reject cases; existing 2 tour files still validate. |
| T-131 | `GoalsSink` interface + `TrainerConfig.goals` field | 0.5d | Abhishek | Export `GoalsSink` from core; add `goals?: GoalsSink` to `TrainerConfig`. Omitting keeps v0.1 behaviour unchanged. |
| T-132 | Trainer goal-check loop: schedule on `tour_started`, poll every `pollMs`, final at window expiry, dedupe per instance | 1.5d | Abhishek | Emits `tour_goal_reached` on first affirmative or `tour_goal_missed` at expiry. Safe-track wrapper: sink errors resolve `false` per contract. |
| T-133 | `tour_goal_reached` + `tour_goal_missed` events in `TrainingEventName`; payload types; event dictionary regen | 0.25d | Abhishek | Union 8 → 10. CI drift check will catch a missed regen. |
| T-134 | Wire goal on `content/example-app/onboarding.tour.json` | 0.25d | curriculum author | `{ event: 'exampleapp.project_created', windowMinutes: 5 }`. |
| T-135 | Tests: schema + trainer goal loop + event emission + dedupe + sink-error safety | 1.5d | Abhishek | Cover 60s cadence via `vi.useFakeTimers`. Verify dedupe holds under repeated affirmative. |
| T-136 | Verify `docs/wiring-goals.md` recipes still match the shipped interface; add a "test your sink" section if the shipped tests want it | 0.5d | Abhishek | Doc landed in Sprint 08 warm-up; may need small edits after the code is real. |
| T-137 | Close T-120 — `preferredCorners: [...]` prop on Pin (mirrors T-092 for the checklist). React + Vue + tests. | 1d | Abhishek | Sprint 09 retro follow-up. Fixes the cosmetic mobile-avatar occlusion. |
| T-138 | Close T-121 — user-scoped `pin_shown` dedupe via localStorage-backed session key | 0.5d | Abhishek | Sprint 09 retro follow-up. Replaces the module-scoped Set with a localStorage flag keyed by pin id per browser. |
| T-139 | Close T-122 — session-replay writeup on 20 users who saw `create-project-shortcut` (simulated per convention) | 0.5d | Abhishek + [Product PM] | Sprint 09 retro follow-up. `product/investigations/pin-effectiveness-s10.md`. |
| T-140 | Simulated staging → production walkthrough + Sprint-10 retro | 0.5d | Abhishek | `releases/v0.5.0-goals-preview-launch-log.md`. Retro rolls into Sprint 11 planning. |

---

## Sequencing

- **Day 50 (Mon):** T-130 schema. T-131 GoalsSink interface + TrainerConfig field. Both small; land the shape everyone else keys off.
- **Day 51 (Tue):** T-132 trainer goal-check loop (the meaty task — timers, dedupe, safe-track).
- **Day 52 (Wed):** T-133 events + dictionary regen. T-135 core tests for schema + loop.
- **Day 53 (Thu):** T-134 wire the goal on onboarding. T-136 sanity-check `wiring-goals.md`.
- **Day 54 (Fri):** T-137 preferredCorners for Pin (biggest carry-over lift). Two-package parity port.
- **Day 55 (Mon):** T-138 user-scoped pin_shown dedupe. T-139 session-replay writeup. Manual QA on the demo.
- **Day 56 (Tue):** T-140 launch log + retro. Tag `v0.5.0-goals-preview`.

## Success signals

- Every DoD item ticked.
- Test count up by ~20 without any package slipping below thresholds.
- `tour_goal_reached` fires for at least 60% of users on the simulated example app dataset (baseline hypothesis from the drop-off investigation — the retro said class-A was 65%).
- No new events beyond the two Goal events (no scope creep into Banners/Webhooks etc.).
- Sprint-10 retro yields a **concrete Sprint 11 shape** — either "onboard Adopter Product A" (they should be unblocked by then), "close the remaining v0.5 hold list if triggers arrived", or "v1.0 prep starts (compliance ADRs → code)".

## Explicit non-blockers

- **Adopter Product A's `data-tour` PR still in review.** Sprint 10 does not gate on it. If it merges by Day 53, T-134 can bolt on an Adopter Product A goal too; if not, Adopter Product A is Sprint 11.
- **PostHog dashboard readiness for Goals metrics.** Events emitted; dashboard is host-side.
- **Perfectly-shaped `hasEventOccurred` for every host sink.** Recipes cover PostHog + Amplitude + in-house warehouse; anything else is host-side glue.

## What Sprint 11 will look like (preview, not commitment)

Depends on Sprint-10 retro:

1. **Adopter Product A onboarding.** If their `data-tour` PR has merged, Sprint 11 opens with authoring their first tour (Add-your-first-data-source) plus their Pin set, staging + retro.
2. **v1.0 prep starts.** Convert ADR-0005 (GDPR delete API) and ADR-0006 (consent hook) from design docs to code. This is the largest remaining slice on the roadmap.
3. **Backlog burn + polish.** Land T-121 (if it slipped), T-122 outcomes, and any surprise Goal launch fallout.

Retro at end of Sprint 10 picks the shape.
