# Adopter #2 scouting

**Sprint 08 · T-094 (outreach calls) + T-095 (this doc).**
**Owner:** Abhishek Paul, with Priya Nair (AI Platform PM) making the introductions.
**Date:** 2026-09-03.
**Simulation note:** intro-call outcomes are walked-through outputs for the T-094/T-095 rehearsal. The doc structure is the deliverable; the two candidates named (Workbench, Insights) are the two UPTIQ product teams Priya volunteered at the v0.1.0 retro.

---

## Purpose

Find UPTIQ's second product to adopt the training SDK. v0.1.0 proved the SDK works for one product; the whole cross-product ROI story of the roadmap depends on adopter #2 arriving. This doc captures the two intro calls and recommends a next step per candidate.

Criteria used to score fit (before the calls, applied after):

- **Real user onboarding pain.** Does the product actually need in-app training? (If they have a great empty state and simple UX, they don't.)
- **Frontend stack compatibility.** React or Vue — both are shipped adapters. Anything else = defer.
- **PM curiosity + engineering capacity.** Someone has to want it enough to sponsor the integration, and their frontend team needs a few hours of `data-tour` wiring.
- **A first tour that would actually help users.** Not "we could imagine adding tours" but "the top three onboarding-support tickets would go away if this were live."

---

## Candidate 1 — Workbench

**Product:** UPTIQ Workbench — internal + external users; multi-tab notebook + model-registry surface.
**Call attendees:** Abhishek Paul, Priya Nair (introducing), Diya Kapoor (Workbench PM).
**Date:** 2026-09-02, 30 min.

### What we learned

- **Onboarding pain: high.** Workbench's welcome flow is a single "Get started" splash and a link to a Notion doc. Diya described the current adoption pattern as "power users onboard themselves; everyone else opens a support ticket titled 'how do I add a data source'." Support tickets tagged "onboarding-workbench" ran at ~40/week last month; Diya wants that below 10/week.
- **Frontend stack:** **React 18** + Tailwind. `@uptiq/training-sdk-react` is a drop-in.
- **First tour candidates the team already has copy for:**
  1. "Add your first data source" (the ticket-driver — 40/week).
  2. "Run your first notebook cell" (has a written help page; needs a tour that mirrors it).
  3. "Share a notebook with a teammate" (a common-task tour, mirrors AI Platform's share-workflow shape).
- **Blockers:** Frontend team is currently mid-refactor of the workbench canvas (~2 weeks left). `data-tour` PR shouldn't land during the refactor window; safe to open Week 3 of Sprint 09.
- **Sink:** PostHog. Same as AI Platform. Zero adapter work.
- **Compliance:** the T-093 ADRs (GDPR delete API + consent hook) matter to Workbench because it has external customers on data-processing contracts. Diya explicitly asked whether the SDK carries a compliance liability. Answer per ADR-0005/ADR-0006: opt-in, no server-side state before v1.0, ready-shaped for the erasure and consent flows they'll want.
- **Timeline they'd accept:** first tour live in Workbench staging by end of Sprint 10, prod by end of Sprint 11.

### Fit score

| Criterion | Score | Notes |
| --- | --- | --- |
| Onboarding pain | 5/5 | Support tickets prove it. |
| Stack compat | 5/5 | React 18. |
| PM + eng capacity | 4/5 | PM is in; eng blocked 2 weeks by canvas refactor. |
| First tour that would help | 5/5 | "Add data source" is a concrete ticket-driver. |

**Overall:** **GO.** Concrete pain, concrete first tour, matching stack, sponsor identified.

### Next step

- **Sprint 08 wrap:** send Diya the [`docs/how-to-integrate.md`](../docs/how-to-integrate.md) doc + the [`releases/ai-platform-data-tour-pr.md`](../releases/ai-platform-data-tour-pr.md) template. Ask her to circulate to her frontend lead.
- **Sprint 09 Week 3:** open the Workbench `data-tour` PR (once their canvas refactor lands).
- **Sprint 10:** Workbench-flavoured content: author the "Add your first data source" tour (mirror AI Platform onboarding.tour.json shape). Ship to Workbench staging.
- **Sprint 11:** Workbench production ship + first-week metrics snapshot.

---

## Candidate 2 — Insights

**Product:** UPTIQ Insights — internal-only BI + dashboarding surface used by the finance and analytics teams.
**Call attendees:** Abhishek Paul, Priya Nair (introducing), Rohan Iyer (Insights PM).
**Date:** 2026-09-03, 30 min.

### What we learned

- **Onboarding pain: low-moderate.** Insights is used by ~40 internal people. Most were trained by their team lead in a 15-minute walkthrough on join. Rohan estimated maybe 1 new user per month.
- **Frontend stack:** **Vue 3** + Element Plus. `@uptiq/training-sdk-vue` is a drop-in.
- **First tour candidates:** Rohan didn't have a concrete top tour in mind. He was interested in the SDK as a way to surface **feature-discovery hints** (Pins from v0.5) more than tours. "Half the finance team doesn't know we shipped saved dashboards last quarter."
- **Blockers:** No engineering blocker, but low volume of new users means the ROI on a tour would be limited. Pins would land better.
- **Sink:** PostHog (via a shared UPTIQ project). Same adapter.
- **Compliance:** internal-only means the ADR-0005/ADR-0006 story is theoretical for Insights — nice to know we have it, but not gating.
- **Timeline:** Rohan didn't press for one. Willing to be second-in-line behind Workbench.

### Fit score

| Criterion | Score | Notes |
| --- | --- | --- |
| Onboarding pain | 2/5 | Team-lead onboarding is doing the job. |
| Stack compat | 5/5 | Vue 3 — validates the shipped Vue adapter. |
| PM + eng capacity | 4/5 | Both available. |
| First tour that would help | 2/5 | No concrete onboarding tour. Pins better fit their real need. |

**Overall:** **DEFER to Pins (v0.5).** Not a good tour-adopter fit; excellent Pins-adopter fit — real "feature discovery" pain, exactly what Pins are for.

### Next step

- **Sprint 09:** while shipping Pins for AI Platform, keep Rohan in the loop. Once Pins ship on AI Platform prod (target end of Sprint 9), open a follow-up with Rohan: "here's what it looks like; want to try it on the saved-dashboards feature?"
- **Sprint 10:** if Rohan's still in, open Insights `data-tour` PR for the 2–3 elements that would carry pins.
- **Sprint 11:** first 2–3 pins live in Insights.
- **Explicit note:** Insights validates the Vue adapter in production even though the *feature* it uses is Pins-first, not tours. That's a valuable side-effect.

---

## Combined outcome

- **Adopter #2 is Workbench.** Committed for Sprint 10–11 integration. Sponsor identified, stack compatible, real pain, concrete first tour.
- **Adopter #3 is Insights.** Deferred to Pins-first integration in Sprints 10–11. Different mode of adoption (Pins, not tours), also valuable — the Vue adapter gets its first production use.
- **Both use PostHog.** Zero sink work for either.
- **Sprint 09 stays AI-Platform-focused for Pins** (per v0.5-kickoff.md). Adopter integration lands in Sprints 10–11 as originally sequenced. Nothing changes about the v0.5 plan.

## What the retro's "second-product signal" reads as now

Was **soft** at retro time. Now: **committed** (Workbench), plus **soft-plus-different-mode** (Insights). Update the ROADMAP v0.5 line accordingly.
