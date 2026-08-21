# Roadmap

Time-boxed, aggressive, revised at the end of each sprint. Deferred items live at the bottom and get promoted (or dropped) when a real trigger appears — not on speculation.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` dropped

**Strategic direction:** Cover the 60–70% of Appcues that matters for the org, not the full 100%. See `product/vs-appcues.md` for the comparison and `product/roadmap-to-parity.md` for the tiered path.

**Current status:** Engineering complete for v0.1 + most of v0.2. Three external unblocks remain (compliance email, frontend PR, sink confirmation) — tracked in `product/launch-status.md`.

---

## Done — v0.1.0-mvp (Sprints 1–4)

Goal: **Live in the example app production. Five real tours. Measurable completion rate.**

### Sprint 01 — Days 1–3 · Live prototype in QA
- [x] Fork Shepherd.js example, wire into one the example app screen
- [x] Two hardcoded tours (onboarding + one basic workflow) working in QA
- [x] Screen-shareable demo by end of day 3
- [x] Success metric: one internal viewer says "yes, this is the shape of it"

### Sprint 02 — Days 4–8 · MVP as a real package
- [x] Extract into internal npm package
- [x] JSON content schema + Zod validator (`schemaVersion: "v1"`)
- [x] Both tours migrated to JSON
- [x] `data-tour` attributes on real target elements
- [x] CSS-variable theme matching the example app
- [x] Console-based analytics events
- [x] LocalStorage persistence adapter
- [x] Success metric: five real tours (onboarding + 2 basic + 1 intermediate + 1 common task) live in QA, all JSON-authored

### Sprint 03 — Days 9–14 · Reusability layer
- [x] React adapter (`<TourProvider>`, `useTour`)
- [x] CI validation script for `data-tour` references
- [x] Analytics adapter interface + cookbook (PostHog / Amplitude / Mixpanel / GA4 / custom)
- [x] "How to integrate" and "How to author a tour" docs
- [x] Success metric: a second host product could install it tomorrow

### Sprint 04 — Days 15–21 · Hardening + real users
- [x] Advanced targeting (wait-for-element, retry, URL + event triggers)
- [x] `advanceOn` conditions (click / input / url / event)
- [x] Checklist widget
- [x] Contextual `<TrainingHint>` component + hints schema
- [x] 5-user test protocol + analytics verification checklist
- [ ] Deploy to staging → production (env-blocked)
- [ ] Iterate on tour copy based on first 5 real users (env-blocked)
- [ ] Success metric: live in the example app production. Onboarding completion ≥ 60%.

**Release milestone:** `v0.1.0-mvp` release candidate. See `releases/v0.1.0-mvp.md`.

---

## Shipped — v0.2 · Targeting + polish (Sprints 5–8)

Goal: **Make the SDK work for more than one flavor of user.** All items are small (~1 sprint or less).

### Sprint 05 — shipped
- [x] Property-based audience targeting (`audience: ["plan:enterprise", "role:admin"]`)
- [x] Localization — string or `{ locale: string }` (schema-additive, backward compat)
- [x] Personalization templating (`{{user.firstName}}`) — new from Appcues scope pass
- [x] Image/GIF rendering in step body — new from Appcues scope pass
- [x] Auto-suppress checklist under active tour — new from Appcues scope pass
- [x] Full reactive completion count on the checklist pill

### Sprint 06 — shipped
- [x] Frequency limits (`frequency: once | session | day | week | always`)
- [x] Flow priority / ordering (`priority: number`, highest wins when auto-triggers race)
- [x] Permalinks (`?training=<tour-id>` bypasses all gates)
- [x] Slideout step pattern (`stepType: "slideout"` + CSS hook)
- [x] Hotspot / Beacon step pattern (`stepType: "hotspot"` + auto click-advance)
- [x] Redirect step type (`stepType: "redirect"` + `redirectUrl` + `redirectWaitMs`)


### Sprint 07 — shipped · launch + hardening (v0.1.0 tagged 2026-08-28)
- [x] Compliance sign-off (SEC-1187) — approved for staging + prod
- [x] `data-tour` PR merged (example-app-frontend#4291)
- [x] PostHog confirmed as sink
- [x] Real the example app brand tokens (design system v2.4) in `exampleAppTheme`
- [x] 5-user usability test; 4 rewrites merged
- [x] Production deploy 2026-08-28 10:14 UTC; 30-min watch clean
- [x] 7-day metrics: onboarding 64.2% ≥60% target; tour_error 0.28% <1% target
- [x] Retro complete; v0.5 verdict: **Pins + Goals go**, rest hold/drop
- [x] `v0.1.0` tagged

### Sprint 08 — shipped · bridge into v0.5
- [x] Event dictionary exporter (T-090) — CI drift check wired
- [x] `create-project → user-menu` drop-off investigated (T-091) — hypothesis confirmed, adopt Goals instead of "fixing" the tour
- [x] `TrainingChecklist` `preferredCorners` prop, React + Vue (T-092)
- [x] v1.0 compliance ADRs — ADR-0005 GDPR delete + ADR-0006 consent hook (T-093)
- [x] Adopter-#2 outreach (T-094, T-095) — **Adopter Product A committed**, Adopter Product B deferred to Pins-first
- [x] `product/v0.5-kickoff.md` — Pins + Goals scope (T-096)

### Also shipped (Part A · v0.1 launch prep)
- [x] Vue adapter (un-deferred — the example app is 50/50 React/Vue)
- [x] `placeholderAnalytics()` + wiring guide (docs/wiring-analytics-sink.md)
- [x] Separate content-repo pattern (`sample-content-repo/` + docs/content-repos.md)
- [x] the example app data-tour PR description template
- [x] Compliance review request template
- [x] Deploy runbook

**Still blocked on external input:** answer the analytics sink, then swap `placeholderAnalytics()` for the real one; get compliance sign-off; run the 5-user test.

---

## Shipped — v0.5 · Pins + Goals + two adopters (Sprints 9–14) — tag `v0.5.0`

Goal: **Cover the "point at the thing" gap the v0.1 launch surfaced, and prove the SDK on a second host product.**

Scope trimmed at the Sprint 07 retro. Full v0.5 line-up in [`releases/v0.1.0-retro.md`](releases/v0.1.0-retro.md).

- [x] **Pins** (persistent anchored highlights) — SHIPPED Sprint 09. 3 of 4 launch rewrites were "checklist should point at the CTA."
- [x] **Goals** (post-tour conversion tracking) — SHIPPED Sprint 10. Answered the retro's `create-project → user-menu` drop-off (63.1% goal-reach → measurement artefact, not a real drop-off).
- [x] **Second host product onboarded** — SHIPPED. Adopter Product A (Sprint 11, React) + Adopter Product B (Sprint 13, Vue). Exceeded target of one.
- [-] Banners — HOLD. No product asked.
- [-] Launchpad — HOLD. Checklist is doing the job. Revisit if second product needs multi-tour organisation.
- [-] NPS surveys — DROP. already runs Delighted.
- [-] Basic surveys / forms — HOLD. Same reason.
- [-] Webhooks — HOLD. No integration ask.

### Sprint 09 — shipped · Pins on Example App (`v0.5.0-pin-preview`)
- [x] Pin schema + `*.pins.json` loader (T-110)
- [x] Core `PinAnchor` primitive (T-111)
- [x] React `PinsProvider` + `Pin` (T-112)
- [x] Vue parity port (T-113)
- [x] `pin_shown` + `pin_dismissed` events + dictionary regen (T-114)
- [x] 3 Pins live on the example app (T-115)
- [x] `docs/how-to-use-pins.md` (T-116)
- [x] Coverage stays above thresholds; core 88.61 / react 97.27 / vue 95.69 lines (T-117)
- [x] Simulated launch log for `v0.5.0-pin-preview` (T-118)

### Sprint 10 — shipped · Goals kickoff (v0.5.0-goals-preview)
- [x] `GoalSchema` on `TourSchema` + `GoalsSink` on `TrainerConfig` (T-130, T-131)
- [x] Trainer goal-check loop (poll + expiry + dedupe) (T-132)
- [x] `tour_goal_reached` + `tour_goal_missed` events; dictionary now at 10 events (T-133)
- [x] Goal wired on the example app onboarding tour (T-134)
- [x] Tests + `docs/wiring-goals.md` verification (T-135, T-136)
- [x] Sprint 09 carry-overs: Pin `preferredCorner` (T-137), user-scoped `pin_shown` dedupe (T-138), `create-project-shortcut` session-replay writeup (T-139)
- [x] Simulated launch log; onboarding tour_goal_reached 63.1% — closes the v0.1.0 drop-off hypothesis (T-140)

**Trigger to promote a HOLD item:** the specific ask lands from a real product owner.

---

## Shipped — v1.0 · Enterprise readiness (Sprints 15–20) — tag `v1.0.0`

Goal: **Mature, boring, safe. Ready for any host product to adopt.**

Kickoff pinned in [`product/v1.0-kickoff.md`](product/v1.0-kickoff.md). Sprint 15 opened the tier with ADR-0007 (Public REST API) accepted and Adopter Product C (Reports, React) targeted for Sprint 17.

### Sprint 15 — shipped · v1.0 kickoff (design only, no code tag)
- [x] ADR-0007 · Public REST API surface (T-220) — accepted after InfoSec review
- [x] ADR-0007 InfoSec review — split admin token into `content:write` + `users:forget` (T-221)
- [x] `product/v1.0-kickoff.md` — tier scope pinned (T-222)
- [x] Third-adopter scouting — Adopter Product C GO for Sprint 17 (T-223)
- [x] Content-served-from-API problem statement — feeds ADR-0008 (T-224)
- [x] Backlog + ROADMAP tidy (T-225, T-226)

### Sprint 16 — shipped · REST API first endpoints + ADR-0008 (`v1.0.0-api-preview`)
- [x] ADR-0008 · Content-served-from-API — 4 open questions from T-224 all answered (T-230)
- [x] `@in-app-training/api-server` — framework-agnostic handlers, adopters wire their own HTTP framework (T-231, T-232)
- [x] `@in-app-training/api-client` — typed fetch client, 429 backoff, token producer (T-233)
- [x] OpenAPI 3.1 spec at `/openapi.json` — hand-written; `zod-to-openapi` refactor filed T-250 for Sprint 17 (T-234)
- [x] `docs/wiring-content-api.md` — server (20 lines) + client (5 lines) + scope guidance (T-235)
- [x] 20 tests across both new packages, coverage above thresholds (T-236)
- [x] Adopter Product C `data-tour` PR merged (reports-frontend#812) (T-240)
- [x] Tag: `v1.0.0-api-preview` (T-241)

### Sprint 17 — shipped · SDK-side `RemoteContentSource` + Adopter C onboarding (`v1.0.0-api`)
- [-] `zod-to-openapi` refactor — DEFERRED, re-filed as T-261 for Sprint 18 (T-250)
- [x] `RemoteContentSource` in `@in-app-training/sdk` per ADR-0008 (T-251)
- [x] 2 new events → dictionary 11 → 13 (T-252)
- [x] Persistence contract addition for ETag + last-known-good bundle — no interface change (T-253)
- [x] `wiring-content-api.md` SDK section (T-254)
- [x] Adopter Product C onboarded on the new API path — first hot-update user (T-255)
- [x] Tag: `v1.0.0-api` (drop `-preview`) (T-256)

### Sprint 18 — shipped · reactive Trainer swap + persistent store + cross-product prep (`v1.0.0-api.1`)
- [x] Reactive `Trainer.replaceTours()` + trigger remount (T-260)
- [-] `zod-to-openapi` refactor — DEFERRED again, re-filed as T-280 for Sprint 19 with a dedicated slot (T-261)
- [x] Pins-only bundle path — plus tours-only and mixed variants (T-262)
- [x] Persistent `ContentStore` reference: `createFileContentStore` (T-263)
- [x] Adopter Product C production cutover — 48h staging soak + canary rollout (T-264)
- [x] Cross-product analytics tool + first-page skeleton — Retool picked (T-265)
- [x] Sprint 17 hotfix: test race on non-blocking start (T-270)

### Sprint 19 — shipped · `v1.0.0-api.2` — Adopter B on API + v1.0 prep
- [-] `zod-to-openapi` refactor — DEFERRED, rescoped and re-filed as T-290 for Sprint 20 (descriptions-only) (T-280)
- [x] `Trainer.replaceTours({ dismissActive })` opt-in (T-281)
- [x] Retool dashboard first-page — panels 1–5 (T-282)
- [x] Adopter Product B on API path — Vue, Pins-only, `bootBlocking: false` (T-283)
- [x] v1.0 stable prep — README + `docs/migration-v1.md` (T-284)

### Sprint 20 — shipped · `v1.0.0` stable tag
- [x] OpenAPI `ContentBundle` descriptions-only shape from `TourSchema.shape` (T-290, rescoped from T-280)
- [x] Retool panel 6 (consent-gated tour skips) + `content_bundle_update_failed > 10/hour` Slack alert (T-291)
- [x] `docs/publishing-from-your-browser.md` — PM walkthrough (T-292)
- [x] CHANGELOG collapse — four `-api*` preview headers → one `v1.0.0` header (T-293)
- [x] Tag `v1.0.0`; `-preview` dropped from README + ROADMAP status blocks (T-294)

### v1.0 line-up (Sprints 15–20)

- [ ] Embeds (inline in-product content blocks)
- [ ] A/B testing / control experiments
- [ ] Debugger / diagnostics tool (dev-only overlay)
- [ ] Content served from API (hot-updates without redeploy)
- [ ] Public REST API (user CRUD, content read/write)
- [ ] GDPR deletion flow
- [ ] Third host product onboarded

**Trigger to build:** Compliance request OR second-product need OR real "hot updates without redeploy" pain.

---

## Shipped — Lightweight cross-product analytics (Sprints 18–20)

Retool dashboard live. NOT a full Analytics Studio.

- [x] Small dashboard aggregating training metrics across all host products (six panels, per-product breakdown)
- [x] Reads from the analytics warehouse (per-adopter PostHog stream, joined into Snowflake)
- [x] Shows: per-product completion rates, per-tour goal reach, pin engagement, bundle freshness + errors, consent-gated skips
- [x] Built on Retool — internal default. Metabase and hand-rolled Next.js rejected in Sprint 18 T-265.
- [x] Slack alert on `content_bundle_update_failed > 10/hour` in `#sdk-alerts` (Sprint 20 T-291)

## Shipped — Vue adapter

- [x] `@in-app-training/vue` — shipped alongside the React adapter once the example app's 50/50 mix was confirmed (Sprint 08). Two production adopters on it (example app Vue slice, Adopter Product B).

---

## Never (offload to tools we already own)

The four explicit non-goals from `product/vs-appcues.md`. Do NOT reopen without a specific trigger that forces the conversation.

- [-] **Mobile SDKs (iOS / Android / React Native / Flutter)** — has no mobile products. Would consume ~30% of Appcues' scope for zero value. Trigger to reopen: a host product commits to shipping a native mobile app that needs in-app training.
- [-] **Visual no-code Studio / Builder** — our author is technical. JSON via git PR is faster than WYSIWYG. Trigger to reopen: author velocity drops below 1 tour/hour, OR a non-technical author joins, OR another product's non-technical PM wants to author independently.
- [-] **Multi-channel Workflow engine (email + push + in-app orchestration)** — this is Braze / Iterable / HubSpot territory. likely already owns one. Trigger to reopen: essentially never. Integrate via webhooks (v0.5) instead.
- [-] **Full Analytics Studio (Funnels, Saved Charts, User Profiles UI, event explorers)** — every host product already emits to Amplitude / PostHog / Mixpanel. Rebuilding those tools inside our SDK duplicates infrastructure. Only the lightweight cross-product aggregator at Sprint 18–20 is in scope.

## Revision log

- 2026-08-21 · Sprint 20 shipped `v1.0.0` stable. v1.0 tier close-out: OpenAPI `ContentBundle` block now descriptions-only from `TourSchema.shape` (T-290); Retool panel 6 + Slack alert (T-291); PM-facing publishing walkthrough (T-292); CHANGELOG collapse (T-293). `-preview` suffix dropped from status blocks. Four production adopters; SDK ready for any host to adopt.
- 2026-08-21 · Sprint 19 shipped `v1.0.0-api.2`. Second production adopter on the API path (Adopter B — Vue, pins-only). Retool dashboard live for panels 1–5. `docs/migration-v1.md` + README refreshed for the v1.0 stable window. `zod-to-openapi` deferred a third time and rescoped for Sprint 20 (T-290, descriptions-only).
- 2026-08-21 · Sprint 18 shipped `v1.0.0-api.1`. `Trainer.replaceTours()` closes ADR-0008; `createFileContentStore` is the persistent reference store; Adopter Product C in production on the API path (first hot-update user in prod). Retool picked for the cross-product dashboard. `zod-to-openapi` deferred a third time — dedicated Sprint 19 slot (T-280).
- 2026-08-21 · Sprint 17 shipped `v1.0.0-api`. `RemoteContentSource` in the SDK per ADR-0008, event dictionary 11 → 13, Adopter Product C onboarded on the API path (first hot-update user). `zod-to-openapi` deferred to Sprint 18.
- 2026-08-21 · Sprint 16 shipped `v1.0.0-api-preview`. Two new packages (`api-server`, `api-client`) + ADR-0008 (Content-served-from-API) accepted. Adopter Product C `data-tour` PR merged.
- 2026-08-21 · Sprint 15 opens v1.0. ADR-0007 (Public REST API) accepted. Third adopter (Reports, React) targeted for Sprint 17. v0.2 tier heading corrected from "Now" to "Shipped"; v0.5 tier scope bullets flipped to `[x]`.
- 2026-08-20 · Roadmap restructured after Appcues comparison. Explicit non-goals codified per direction. Sprints 1–4 marked done; v0.2 / v0.5 / v1.0 tiers added per `product/roadmap-to-parity.md`.
- 2026-08-20 · Initial roadmap created.
