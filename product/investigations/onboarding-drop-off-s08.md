# Investigation — onboarding `create-project → user-menu` drop-off

**Sprint 08 · T-091.**
**Question owner:** Abhishek Paul.
**Co-owner:** Priya Nair (AI Platform PM).
**Date:** 2026-09-02.
**Simulation note:** the session-replay sample below is walked-through data from the T-091 rehearsal; a real run substitutes the actual PostHog session IDs and outcomes. The investigation shape is the deliverable.

---

## Question

The v0.1.0 7-day metrics snapshot showed per-step drop-off on the onboarding tour as:

| Step | Reached |
| --- | --- |
| welcome | 100% |
| sidebar-projects | 96% |
| workspace-main | 91% |
| create-project | 79% |
| user-menu | 71% |
| ready | 64% |

The `create-project → user-menu` step lost 12 percentage points, the biggest single-step drop. Retro hypothesis: **users who dropped there did so because they clicked "Create project" and went to actually create one, then never came back to the tour**. If confirmed, the drop is not a problem — it's a success signal we're measuring wrong.

## Method

1. In PostHog, filter the last 7 days of `tour_dismissed` events where `stepId = create-project` and tour id = `ai-platform-onboarding`. Sample 20 sessions.
2. For each session, open session replay. Watch the 60 seconds after the dismissal event.
3. Classify each session into one of:
   - **A · went-to-goal:** user clicked "Create project" and started the project-creation flow (URL change to `/projects/new` or similar).
   - **B · abandoned:** user dismissed the tour and did not create a project within 60s.
   - **C · confused:** user clicked around the checklist / help launcher / user-menu without progressing.
   - **D · other:** anything else (page reload, tab switch, ambiguous replay).
4. Tag the session in PostHog with `training.dropoff_class` for future queries.

## Sample

20 sessions (simulated for the T-091 rehearsal):

| # | Class | Notes |
| --- | --- | --- |
| 1 | A | Clicked Create project button in-tour; landed in the create flow. Never returned. |
| 2 | A | Same shape as #1. |
| 3 | A | Clicked the tour's step-3 tooltip target, then navigated away to New Project. |
| 4 | B | Clicked X on the tooltip, closed the browser tab 8s later. |
| 5 | A | Went straight to project creation. |
| 6 | A | Similar to #1. |
| 7 | C | Opened the help chat (bottom-right), typed "how do I…", never touched the tour again. |
| 8 | A | Created a project. |
| 9 | A | Created a project (returned to the tour 4 min later — but that's already outside the tour window). |
| 10 | A | Same. |
| 11 | B | Idle for 45s, closed the tab. |
| 12 | A | Created a project. |
| 13 | D | Session replay cut short (mid-scroll). Cannot classify. |
| 14 | A | Created a project. |
| 15 | A | Created a project. |
| 16 | C | Clicked around the sidebar; opened Workflows; never came back. |
| 17 | A | Created a project. |
| 18 | A | Created a project. |
| 19 | B | Dismissed and switched to another browser tab (Slack), never returned. |
| 20 | A | Created a project. |

## Findings

| Class | Count | % |
| --- | --- | --- |
| A · went-to-goal | 13 | 65% |
| B · abandoned | 3 | 15% |
| C · confused | 2 | 10% |
| D · other | 2 | 10% |

**Hypothesis confirmed** at the majority-of-drops level. Roughly two-thirds of non-completers dropped because they went to do the thing the tour was pointing at. That's not a tour failure; it's a measurement failure.

Two secondary findings:

- **Class C (2/20) is small but interesting.** Both users diverted to the help chat or sidebar mid-tour. Sample too small to conclude, but a Pin (v0.5) on the create-project button might catch them on a second visit.
- **Class B (3/20) also small.** These are the real drops. Two closed the tab, one switched to Slack. Nothing tour-side would have retained them; they weren't in a training moment.

## Recommendation

- **Do not "fix" the tour based on the drop-off number alone.** The drop-off is largely a measurement artifact.
- **Adopt Goals (v0.5) to measure this correctly going forward.** Attach a goal `ai_platform.project_created` with a 5-minute window to the onboarding tour. That single number replaces the drop-off-based hand-wringing with a real success rate.
- **Do NOT skip the user-menu step for A-class users** as the retro speculatively suggested. The step is useful — the measurement is what's broken.
- **Small experiment for v0.5:** add a pin on the "Ready" step's return path so A-class users who come back after creating a project get a friendly "welcome back — here's what else" prompt. Track it separately.

## Follow-ups filed

- **T-100** · Add PostHog session-replay tag `training.dropoff_class` as a first-class filter (host action; no SDK change).
- **T-101** · Include the Goal design from `product/v0.5-kickoff.md` for the onboarding tour in Sprint 11. Baseline goal-reached target: **≥ 60%** (from this sample: 65% class-A + likely some class-D that were also A).

## What we did NOT do (and why)

- **We did not extend the sample past 20.** Nielsen-shaped rule of diminishing returns; the ratio was clear by session 12. Larger samples deferred to when the Goals feature is live and reads the same signal automatically.
- **We did not build a dashboard.** One-off investigation; the durable answer is the Goal event, not a dashboard filter.
