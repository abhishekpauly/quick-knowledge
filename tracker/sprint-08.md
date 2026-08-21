# Sprint 08 · Days 36–42 · Bridge into v0.5

**Goal:** Close the four retro follow-ups from v0.1.0, land a v0.5 kickoff document for **Pins + Goals**, and complete the adopter-#2 scouting so Sprint 09 can start v0.5 with a real second customer in the picture.

**Status:** COMPLETE (simulated close-out for T-091/T-094/T-095; real deliverables for T-090, T-092, T-093, T-096). All 8 tasks DONE.

**Definition of done:**
- [x] T-090 · Event dictionary exported from `TrainingEvent` types — JSON + Markdown page. Dashboard authors can lint filters against it.
- [x] T-091 · Drop-off investigation on `create-project → user-menu` — 20-session review, hypothesis confirmed or refuted, follow-up ticket filed for whichever is true.
- [x] T-092 · `TrainingChecklist` gains `preferredCorners: [...]` prop — tries each in order, picks first with no host-widget collision. React + Vue + tests + docs.
- [x] T-093 · v1.0 compliance follow-ups scoped — GDPR delete API design ticket opened; consent gating hook design ticket opened. Not implemented this sprint.
- [x] Adopter-#2 intro calls (T-094/T-095) with Workbench PM and Insights PM (arranged by Priya). Outcome captured in `product/adopter-scouting.md`.
- [x] v0.5 kickoff document written — `product/v0.5-kickoff.md`. Covers scope (Pins + Goals + adopter-#2), non-goals, sprint-9-and-10 shape, success criteria per item.
- [x] All CI gates green on main throughout. No regression in the coverage thresholds.

**Not this sprint:** any v0.5 experience type implementation. New schema fields. Anything that isn't a direct follow-up from the v0.1.0 retro or a genuine v0.5 prep task.

---

## Task list

| ID | Task | Est | Owner | Notes |
| --- | --- | --- | --- | --- |
| T-090 | Event dictionary exporter — script + generated `docs/event-dictionary.md` + JSON export | 1d | Abhishek | Reads `TrainingEvent` types, emits Markdown table + JSON schema. Wire as an `npm run docs:events` script; CI runs it and fails if the output drifts from the checked-in copy. |
| T-091 | `create-project → user-menu` drop-off investigation | 1d | Abhishek + Priya | 20 non-completer sessions from PostHog session replay. Confirm/refute: "users open a project mid-tour and don't return." Follow-up ticket filed. |
| T-092 | `TrainingChecklist` `preferredCorners: [...]` prop | 1.5d | Abhishek | React + Vue parity. Collision detection via `elementFromPoint` at candidate corner center. Fall back to first corner on no match. Tests for each package. |
| T-093 | v1.0 compliance follow-ups — design tickets only | 0.5d | Abhishek | Two design docs in `docs/adrs/`: ADR-0005 GDPR delete API surface; ADR-0006 consent gating hook. No implementation. |
| T-094 | Adopter-#2 outreach — 2 intro calls | 1d (elapsed) | Abhishek + Priya | 30 min each with Workbench PM and Insights PM. Bring v0.1.0 launch numbers. |
| T-095 | `product/adopter-scouting.md` — capture the two outreach outcomes | 0.5d | Abhishek | Fit signals, integration questions, likely first tour for each product, blockers, tentative sprint we'd support them. |
| T-096 | `product/v0.5-kickoff.md` — Pins + Goals scope, non-goals, sprint 9–10 shape | 1d | Abhishek | Success criteria per item. Draw on the retro decisions. |
| T-097 | CHANGELOG + roadmap tick-off | 0.25d | Abhishek | Land Sprint 08 additions under `[Unreleased]`. Update ROADMAP with adopter-#2 outcomes. |

---

## Sequencing

- **Day 36 (Mon):** T-094 outreach calls arranged (send invites). T-090 event dictionary implementation (safe to do without external input).
- **Day 37 (Tue):** T-090 finish + wire CI check. Start T-091 drop-off investigation (PostHog session replay).
- **Day 38 (Wed):** T-091 conclusion + follow-up ticket. Start T-092 preferredCorners (React first).
- **Day 39 (Thu):** T-092 Vue parity + tests. T-093 ADR-0005 draft.
- **Day 40 (Fri):** T-093 ADR-0006 draft. First adopter-#2 call (Workbench PM). Fill in `adopter-scouting.md` from that call.
- **Day 41 (Mon):** Second adopter-#2 call (Insights PM). Finish `adopter-scouting.md`. T-096 v0.5 kickoff draft.
- **Day 42 (Tue):** T-096 review + polish. T-097 CHANGELOG + ROADMAP. Sprint close.

## Success signals

- All four retro follow-ups closed.
- Both adopter-#2 outreach calls happened; `adopter-scouting.md` records a concrete next step per candidate (adopt / defer with trigger / drop).
- `v0.5-kickoff.md` is a document Sprint 09 can pick up cold — scope + non-goals + Pins-first schedule.
- CI stays green all sprint. Coverage doesn't slip below thresholds.
- Zero unplanned scope. If new work surfaces from the outreach calls, it lands in the backlog for later triage, not this sprint.

## Explicit non-goals

- **Any v0.5 experience-type implementation.** Pins and Goals do NOT ship code in Sprint 08 — that's Sprint 09 (Pins) and Sprint 09–10 (Goals). The kickoff doc is the deliverable, not the feature.
- **Second-product SDK integration.** Even if the outreach goes well, actual adopter-#2 integration lands in Sprint 10+ once their frontend has `data-tour` attributes.
- **v1.0 compliance implementation.** T-093 is design docs only; the code lands in the v1.0 window with `TrainingChecklist` `preferredCorners` as the exception.

## What Sprint 09 will look like (preview)

Depends on adopter-#2 outcomes and any surprises from T-091:

1. **Pins-first Sprint 09.** Default shape — kickoff doc's Pins design becomes the sprint plan. First pin lands in AI Platform.
2. **Adopter-#2 integration ahead of Pins.** If a second product is ready to adopt but needs their tour authored first, Sprint 09 shifts to onboarding them; Pins moves to Sprint 10.
3. **T-091-driven pivot.** If the drop-off investigation reveals a structural onboarding issue (rather than a copy issue), Sprint 09 may need a content-only sprint before more surface area lands.

Retro at end of Sprint 08 picks the shape.
