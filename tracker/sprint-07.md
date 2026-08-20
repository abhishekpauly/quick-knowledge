# Sprint 07 · Days 27–35 · Launch + hardening

**Goal:** Get v0.1.0-mvp into AI Platform production, watch it, iterate the copy from real feedback, and lock the retro-driven signals that will decide whether v0.5 promotes.

**Status:** Pre-flight in progress. Parallel-safe engineering work (T-063, T-064, T-072 skeleton, T-073, T-074, T-075, T-077) is done. Three external unblocks (T-060/T-061/T-062) are prepared and awaiting the human send. Environment-blocked tasks (T-065–T-071) remain.

**Definition of done:**
- [ ] Compliance / security review request sent; approval received (or explicit "OK to staging" received).
- [ ] AI Platform `data-tour` PR merged to production branch.
- [ ] PostHog sink confirmed as real sink OR one-line adapter swap merged.
- [ ] Deployed to AI Platform **staging** per `releases/deploy-runbook.md`.
- [ ] Acceptance suite passed against staging (`testing/acceptance-criteria.md`).
- [ ] Analytics verification passed against staging (`testing/analytics-verification.md`).
- [ ] 5-user usability test executed (`testing/five-user-test-protocol.md`); rewrite list produced.
- [ ] Content revisions from usability test merged and re-validated (`npm run validate:content`).
- [ ] Real AI Platform brand tokens swapped into `packages/core/src/theme/default.ts` `aiPlatformTheme` (design hand-off).
- [ ] Deployed to AI Platform **production**.
- [ ] 30-minute post-deploy watch complete; no rollback-triggering signals.
- [ ] 7-day metrics snapshot captured against `releases/v0.1.0-mvp.md` success criteria.
- [ ] Post-launch retro doc written (`releases/v0.1.0-retro.md`).
- [ ] `CHANGELOG.md` `[Unreleased]` moved to `[v0.1.0] - YYYY-MM-DD`; tag `v0.1.0` cut.
- [ ] v0.5 promotion decision recorded (go / hold / drop for each item), roadmap updated.

**Not this sprint:** any v0.5 experience types (banners, pins, launchpad, NPS, surveys, goals, webhooks). New schema fields. Adapter #3. Any code that isn't a direct response to a real user or a real bug.

---

## Task list

See `backlog.md` T-060 through T-072.

| ID | Task | Est | Owner | Notes |
| --- | --- | --- | --- | --- |
| T-060 | Send compliance / security review request | 0.25d | you | Fill brackets in `releases/compliance-review-request.md` and send. Blocks prod. |
| T-061 | Open AI Platform `data-tour` PR | 0.25d | you | Use `releases/ai-platform-data-tour-pr.md` template. Blocks staging. |
| T-062 | Confirm or swap analytics sink | 0.25d | you | Confirm PostHog with AI Platform. If different, one-line swap via `docs/wiring-analytics-sink.md`. |
| T-063 | Design hand-off: real brand tokens | 0.5d | you + design | Replace placeholder values in `aiPlatformTheme`. Include focus-ring, shadow, radius. |
| T-064 | Content pre-flight: refine 2 existing tours + author intermediate + common-task tours | 1.5d | curriculum author | Safe to do in parallel with unblocks. |
| T-065 | Staging deploy per `deploy-runbook.md` | 0.5d | you | Requires T-061 merged, T-062 done. |
| T-066 | Acceptance suite on staging | 0.5d | you | Every tour played through manually. |
| T-067 | Analytics verification on staging | 0.5d | you | Every event fires with correct payload. |
| T-068 | Recruit + run 5-user usability test | 2d | you | Per `testing/five-user-test-protocol.md`. One afternoon per round; expect one round. |
| T-069 | Merge rewrite list from usability test | 1d | curriculum author | Re-run `npm run validate:content`. |
| T-070 | Production deploy + 30-min watch | 0.5d | you | Requires T-060 approved, T-069 merged. |
| T-071 | 7-day metrics snapshot vs. `v0.1.0-mvp.md` success criteria | 0.25d | you | Onboarding completion, drop-off per step, `tour_error` rate. |
| T-072 | Post-launch retro + v0.5 promotion decision | 1d | you | Write `releases/v0.1.0-retro.md`; update `ROADMAP.md` v0.5 section with go/hold/drop per item. |

---

## Sequencing

- **Day 27 (pre-flight, parallel):** T-060, T-061, T-062, T-063, T-064. Nothing here needs the environment — get them all moving.
- **Days 28–29 (waiting on humans):** compliance is 3–7 business days, frontend PR is 1–3. Use this window for T-064 (content) and T-063 (design tokens).
- **Day 30:** T-061 merged → T-065 staging deploy → T-066 acceptance → T-067 analytics verification.
- **Day 31:** T-068 5-user test (recruit day 30, run day 31).
- **Day 32:** T-069 merge rewrites, re-validate.
- **Day 33:** T-060 approval assumed in — T-070 production deploy + 30-min watch.
- **Days 33–34 (post-launch watch):** monitor for rollback triggers per `releases/deploy-checklist.md`.
- **Day 35:** T-071 metrics snapshot → T-072 retro + v0.5 decision → tag `v0.1.0` → announcement.

## Rollback triggers (repeated here so nobody has to look it up mid-incident)

Roll back immediately per `releases/rollback-runbook.md` if any of these hit within the first 24 hours:

- Onboarding completion rate drops below 20% in first hour.
- `tour_error` rate exceeds 5% of `tour_started`.
- Console error rate up 3x from baseline in AI Platform.
- Any P0 bug reported.

## Success signals

- v0.1.0 tagged and deployed to AI Platform production.
- Onboarding completion rate ≥ 60% at 7 days (target from `releases/v0.1.0-mvp.md`).
- Zero P0 rollbacks; ≤ 2 P1 hotfixes needed in the first week.
- 5-user test surfaced ≤ 5 rewrite items and 0 blocking bugs.
- Retro yields a concrete v0.5 promotion decision (go/hold/drop per item), not a "we'll decide later."

## Explicit non-blockers

Do not let any of these hold the launch:

- Vue tours (React onboarding is enough for v0.1; Vue adapter is shipped and will ship its first tour in a follow-up).
- Second-product scouting (T-072 flags it in the retro; not on the critical path this sprint).
- v0.5 scoping (retro-driven — don't pre-scope during a launch sprint).

## What Sprint 08 will look like (preview, not commitment)

Depends entirely on T-072's outcome. Three likely shapes:

1. **Bugs + a small run of tours.** If launch is bumpy or content demand jumps, sprint 8 is triage + author-more-tours.
2. **v0.5 kickoff.** If retro says "go" on 1–2 v0.5 items AND a second-product commit landed, sprint 8 begins v0.5 with the highest-value pair (leading candidates: banners, launchpad).
3. **Bridge sprint.** If no clear signal, use sprint 8 for docs polish, adopter-#2 outreach, and a small backlog burn — do not invent v0.5 work without a trigger.
