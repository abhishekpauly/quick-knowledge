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

## Now — v1.0 · Enterprise readiness (Sprints 15–20, ~6 weeks)

Goal: **Mature, boring, safe. Ready for any host product to adopt.**

Kickoff pinned in [`product/v1.0-kickoff.md`](product/v1.0-kickoff.md). Sprint 15 opened the tier with ADR-0007 (Public REST API) accepted and Adopter Product C (Reports, React) targeted for Sprint 17.

### Sprint 15 — shipped · v1.0 kickoff (design only, no code tag)
- [x] ADR-0007 · Public REST API surface (T-220) — accepted after InfoSec review
- [x] ADR-0007 InfoSec review — split admin token into `content:write` + `users:forget` (T-221)
- [x] `product/v1.0-kickoff.md` — tier scope pinned (T-222)
- [x] Third-adopter scouting — Adopter Product C GO for Sprint 17 (T-223)
- [x] Content-served-from-API problem statement — feeds ADR-0008 (T-224)
- [x] Backlog + ROADMAP tidy (T-225, T-226)

### Sprint 16 — planned · REST API first endpoints + ADR-0008
- [ ] ADR-0008 · Content-served-from-API (T-230)
- [ ] `@in-app-training/api-server` skeleton + `GET /content/:product` with ETag (T-231, T-232)
- [ ] `@in-app-training/api-client` typed fetch client (T-233)
- [ ] OpenAPI spec generation (T-234)
- [ ] Adopter Product C `data-tour` PR intake (T-240)
- [ ] Tag: `v1.0.0-api-preview` (T-241)

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

## Sprint 18–20 · Lightweight cross-product analytics

Explicitly deferred until here per direction. NOT a full Analytics Studio.

- [ ] Small dashboard aggregating training metrics across all host products
- [ ] Reads from a single analytics warehouse (whatever uses)
- [ ] Shows: per-product completion rates, per-tour drop-off, cross-product adoption curves
- [ ] Built on Retool / Metabase / a simple Next.js page — NOT a rebuilt Amplitude

**Trigger to build:** 2+ products in production and someone needs "how is training performing across products?"

---

## Vue adapter — on demand

- [ ] Vue adapter (`@in-app-training/vue`)

**Trigger to build:** A Vue product commits to adoption. ~3–5 days of work once triggered.

---

## Never (offload to tools we already own)

The four explicit non-goals from `product/vs-appcues.md`. Do NOT reopen without a specific trigger that forces the conversation.

- [-] **Mobile SDKs (iOS / Android / React Native / Flutter)** — has no mobile products. Would consume ~30% of Appcues' scope for zero value. Trigger to reopen: a host product commits to shipping a native mobile app that needs in-app training.
- [-] **Visual no-code Studio / Builder** — our author is technical. JSON via git PR is faster than WYSIWYG. Trigger to reopen: author velocity drops below 1 tour/hour, OR a non-technical author joins, OR another product's non-technical PM wants to author independently.
- [-] **Multi-channel Workflow engine (email + push + in-app orchestration)** — this is Braze / Iterable / HubSpot territory. likely already owns one. Trigger to reopen: essentially never. Integrate via webhooks (v0.5) instead.
- [-] **Full Analytics Studio (Funnels, Saved Charts, User Profiles UI, event explorers)** — every host product already emits to Amplitude / PostHog / Mixpanel. Rebuilding those tools inside our SDK duplicates infrastructure. Only the lightweight cross-product aggregator at Sprint 18–20 is in scope.

## Revision log

- 2026-08-21 · Sprint 15 opens v1.0. ADR-0007 (Public REST API) accepted. Third adopter (Reports, React) targeted for Sprint 17. v0.2 tier heading corrected from "Now" to "Shipped"; v0.5 tier scope bullets flipped to `[x]`.
- 2026-08-20 · Roadmap restructured after Appcues comparison. Explicit non-goals codified per direction. Sprints 1–4 marked done; v0.2 / v0.5 / v1.0 tiers added per `product/roadmap-to-parity.md`.
- 2026-08-20 · Initial roadmap created.
