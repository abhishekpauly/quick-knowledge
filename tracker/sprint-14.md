# Sprint 14 · Days 78–84 · v0.5 tier close-out

**Goal:** Close v0.5. Final HOLD-list decisions, coverage polish, tag `v0.5.0` (first non-preview stable v0.5 release). Set up Sprint 15 v1.0 prep decisively.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-210 | Close Adopter Product A goal-reach investigation (T-170 from S11) | DONE |
| T-211 | v0.5 tier retro — final HOLD/GO/DROP decisions on Banners / Launchpad / NPS / Surveys / Webhooks | DONE |
| T-212 | ROADMAP + CHANGELOG update: v0.5 tier marked shipped, v1.0 tier scope pinned | DONE |
| T-213 | Simulated tag `v0.5.0` stable + release notes | DONE |
| T-152 | `pin_shown` LRU cap on localStorage (from S10) | DROPPED — no signal in 3 sprints of production, revisit only on complaint |

## T-210 · Adopter Product A goal-reach investigation

The 58% goal-reach rate flagged in Sprint 11 was investigated in the retro window (simulated). Session-replay sample of 10 non-reachers:
- 6 opened the data-source picker modal but abandoned mid-form (missing credentials at hand).
- 2 chose a source type but the CSV upload failed silently (product bug, not ours).
- 2 completed the tour but the analytics event `adoptera.data_source_added` had a 90s buffered flush that pushed it past the 5-min window.

**Recommendation to Adopter Product A team:** fix the silent CSV upload failure (unrelated to us) and change the goal's `windowMinutes` from 5 to 10 to cover the analytics flush latency. **Recommendation applied** in a follow-on content PR: `content/adopter-a/onboarding.tour.json` `goal.windowMinutes: 5 → 10`. Expected lift: 58% → ~72%.

## T-211 · v0.5 tier retro — HOLD-list final decisions

Per the v0.1.0 retro's original verdicts, revisited with 4 sprints of shipped experience:

| Item | Previous | Final | Reasoning |
| --- | --- | --- | --- |
| Banners | HOLD | HOLD | Still no product ask. Trigger: real ask. |
| Launchpad | HOLD | DROP | Checklist widget covers the "where do I go next?" need. Adopter Product B validated Pins-first works without one. Reopen only on a specific multi-product organisation ask. |
| NPS surveys | DROP | DROP | Delighted covers it. Confirmed. |
| Basic surveys / forms | HOLD | DROP | Same. |
| Goals (shipped Sprint 10) | GO | SHIPPED | ✅ |
| Pins (shipped Sprint 09) | GO | SHIPPED | ✅ |
| Webhooks | HOLD | HOLD | No integration ask. Would move to GO the day a Slack/HubSpot ask arrives. |
| Second product adopted | GO scout | ✅ Adopter Product A (Sprint 11) + Adopter Product B (Sprint 13) | Two adopters exceeds v0.5's target. |
| Third product adopted | not in v0.5 | promoted to v1.0 candidate | See Sprint 15 preview. |

**Net:** v0.5 shipped Pins + Goals + two adopters. Launchpad + NPS + Surveys DROPPED to reduce scope creep pressure. Banners + Webhooks stay HOLD (real ask required).

## T-212 · ROADMAP + CHANGELOG updates

- ROADMAP `v0.5` tier flipped to shipped.
- `v1.0` tier scope pinned to the ADR-0005/ADR-0006 code (already landed in Sprint 12), REST API design + implementation, third-adopter, and the deferred cross-product analytics.
- Sprint 15–20 remains the v1.0 execution window; the plan is unchanged.

## T-213 · v0.5.0 stable release

- Tag: `v0.5.0` (drop the `-preview` / `-adopter-a` / `-adopter-b` / `-compliance` suffixes for the tier-stable release).
- Release notes: consolidated summary of everything landed in Sprints 9–14.
- No new code — just the tag + a top-of-CHANGELOG banner.

## v0.5 tier — what shipped (Sprints 9–14)

- **Pins** — new experience type. Schema, PinAnchor, React + Vue components, 3 pins on the example app, 2 on Adopter Product A, 3 on Adopter Product B.
- **Goals** — post-tour conversion tracking. Schema + Trainer loop + PostHog/Amplitude recipes. Onboarding goal on the example app confirmed the v0.1.0 drop-off was a measurement artefact (63.1% reach).
- **preferredCorner on Pin** — anchoring polish.
- **User-scoped pin_shown dedupe** — localStorage-backed.
- **ADR-0005 + ADR-0006 → code** — `Trainer.forgetUser()` + `ConsentAdapter` (originally scoped for v1.0; pulled forward in Sprint 12 because both were design-locked and small).
- **Two adopters onboarded** — Adopter Product A (React), Adopter Product B (Vue). Vue adapter production-validated.
- **Event dictionary** grew 6 → 11 events with the CI drift check catching every regen.

## What Sprint 15 will look like (preview)

v1.0 tier begins. Per ROADMAP:

1. Public REST API design (ADR-0007).
2. Content-served-from-API (hot-updates without redeploy).
3. Third-adopter integration.
4. Cross-product analytics dashboard (Sprints 18–20 per the roadmap).

**Tag:** `v0.5.0` (stable).
