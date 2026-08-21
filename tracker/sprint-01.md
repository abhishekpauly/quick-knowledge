# Sprint 01 · Days 1–3 · Live prototype in QA

**Goal:** By end of day 3, screen-share a working tour running on one real the example app QA screen. Prove the shape of it. Throwaway code is fine.

**Definition of done:** Two tours (onboarding, one basic workflow) mount on real elements in QA, advance correctly, dismiss correctly, and complete correctly. One internal viewer confirms "yes, this is what I imagined."

**Not this sprint:** JSON schema, npm package, adapters, analytics wiring, CI, docs.

---

## Day 1 — Setup + first working step

**Morning**
- [ ] T-001 · Fork the Shepherd.js "getting started" example into a fresh project. `npm create vite@latest` with vanilla TS is fine.
- [ ] T-002 · Pick the target screen. Recommend the example app's dashboard/landing route — the natural first-run entry point.
- [ ] Open the example app frontend repo alongside. Identify which components own the target screen.

**Afternoon**
- [ ] T-003 (part 1) · Add `data-tour="app-root"` and `data-tour="sidebar-projects-link"` to the first two target elements. Open a small PR to the example app repo. Fast-track review.
- [ ] Get one Shepherd step rendering on `[data-tour="sidebar-projects-link"]` in the QA env.

**End of day 1 check:** One tooltip visible on one real element in QA.

## Day 2 — Full onboarding tour

- [ ] T-003 (part 2) · Add remaining `data-tour` attributes (aim for 5–8 target elements total). Batch into one PR to keep review overhead low.
- [ ] T-004 · Wire up Tour A: onboarding, ~6 steps.
  - Welcome (center-placement, `[data-tour="app-root"]`)
  - Sidebar overview (`[data-tour="sidebar-projects-link"]`)
  - Header + user menu (`[data-tour="header-user-menu-trigger"]`)
  - Main workspace area (`[data-tour="main-workspace"]`)
  - Create-project button (`[data-tour="create-project-button"]`)
  - "You're ready" (center-placement)
- [ ] Verify all six steps render, advance, dismiss cleanly.

**End of day 2 check:** Tour A end-to-end in QA. Copy is rough; that's fine.

## Day 3 — Second tour + demo

- [ ] T-005 · Wire up Tour B: one basic workflow (~4 steps). Suggest: "create your first project" or the simplest workflow-creation flow.
- [ ] T-006 · Run both tours end-to-end. Check: window resize doesn't break positioning. Scroll doesn't lose the anchor. Skip works. Next/prev works.
- [ ] T-007 · Record a 60-second screencast. Save under `docs/demos/sprint-01-demo.mp4` (or link).
- [ ] Send screencast to one trusted reviewer for gut-check.

**End of day 3 check:** Both tours live in QA. Screencast recorded. One reviewer has confirmed the shape.

---

## Risks this sprint

- **PR review latency on `data-tour` attribute PRs.** Mitigation: batch into one PR, tag a senior reviewer, mention it's a 1-line-per-file change.
- **Shepherd.js styling clashes with the example app CSS.** Mitigation: leave default Shepherd styling for the prototype; theme comes in Sprint 02.
- **Target element doesn't exist on mount (renders lazily).** Mitigation: for the prototype, pick screens where everything renders on load. Advanced targeting is Sprint 04.

## Success signals

- One tooltip visible on one real element by end of day 1.
- Full onboarding tour by end of day 2.
- Both tours + a reviewer sign-off by end of day 3.

## What to write down at retro

- Which `data-tour` IDs did we invent? Do the names follow `<area>-<component>-<intent>`?
- What surprised us? What was harder than expected?
- What should Sprint 02 tackle first based on what we learned?
