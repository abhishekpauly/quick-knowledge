# Roadmap to Appcues-for-UPTIQ

The phased path from v0.1.0-mvp (shipped) to a mature in-app training SDK covering the 60–70% of Appcues that matters for UPTIQ products.

Read `vs-appcues.md` first for the strategic framing and the explicit non-goals.

## Tiers at a glance

| Tier | Timeline | Theme | What lands |
| --- | --- | --- | --- |
| **v0.1.0-mvp** | Sprint 4 (shipped) | Foundation | Tours, hints, checklist, React adapter, analytics adapters, data-tour CI |
| **v0.2** | Sprints 5–8 (~1 quarter) | Targeting + polish | Property segmentation, frequency limits, permalinks, localization, slideout/hotspot patterns, flow priority |
| **v0.5** | Sprints 9–14 (~2 quarters) | New experience types | Banners, Pins, Launchpad, NPS, basic Surveys/Forms, Goals, Webhooks, second product onboarded |
| **v1.0** | Sprints 15–20 (~1 year) | Enterprise readiness | Embeds, A/B testing, Debugger UI, hot-updates (content-from-API), public REST API, GDPR delete, third product onboarded |
| **Sprint 18–20** | ~4–5 months post-v0.1 | Cross-product analytics | Lightweight cross-product training dashboard (NOT a full Amplitude replacement) |
| **v2.0+** | Beyond | On demand | Only if a specific UPTIQ trigger requires it |

## v0.2 — Targeting + polish (Sprints 5–8, ~4 weeks)

**Goal:** Make the SDK work for more than one flavor of user.

Every item is small (1 sprint or less). Total: one focused month.

- **Property-based audience targeting.** Tour content declares `audience: ["plan:enterprise", "role:admin"]`. Host product passes user attributes at wire-up. Engine filters. ~5 days.
- **Frequency limits.** "Don't show this tour more than once per week." Config per tour. ~3 days.
- **Flow priority / ordering.** When multiple tours could fire, priority decides which wins. ~2 days.
- **Localization (schema v2).** `title.en`, `title.es` on every user-facing field. Loader picks language from user context. ~4 days.
- **Permalinks.** Any tour is a deep link (`?tour=ai-platform-onboarding&debug=1`) for QA, support handoffs, sales demos. Bypasses targeting. ~2 days.
- **Slideout step pattern.** Content that slides in from the edge. Expose via `placement: "slideout-right"`. ~2 days.
- **Hotspot / Beacon pattern.** Pulsing-dot pattern that expands on click. ~4 days.
- **Full reactive checklist pill count.** Current widget shows total only; make it reactive. ~2 days.

**Deliverable:** SDK handles heterogeneous users, multi-language content, and every step pattern Appcues offers.

**Trigger to actually build:** Sprint 4 metrics show tour completion is fine but PMs are asking "show onboarding X only to segment Y." That request is a v0.2 promotion signal.

## v0.5 — New experience types (Sprints 9–14, ~6 weeks)

**Goal:** Cover the full "types of in-app training" surface, not just tours.

Bigger items. Roughly a quarter of focused work.

- **Banners.** Persistent top-of-page messages ("New feature: check out …"). Dismissible. Themed. Content schema addition. ~1 week.
- **Pins.** Persistent anchored content ("This is the new AI Assist button"). Stays visible until dismissed. ~1 week.
- **Launchpad.** Corner icon that opens a resource center (like Intercom's help widget). Groups tours + hints + links to docs. ~2 weeks.
- **NPS surveys.** Standard NPS flow (0–10 rating + optional comment). Content schema addition. Analytics event for score. ~1 week.
- **Basic Surveys / Forms.** Multi-question, multi-type inputs. Responses posted to analytics adapter. ~2 weeks.
- **Goals (conversion tracking).** After a tour completes, mark whether the user did the target action within N minutes. Analytics event `training.goal_hit`. ~1 week.
- **Webhooks.** Outbound HTTP POST on tour events. For integration with tools we don't own (HubSpot workflows, Slack notifications). ~4 days.
- **Second UPTIQ product onboarded.** Real customer #2 (whichever product commits first). Validates cross-product model. Parallel track.

**Deliverable:** SDK is a full in-app messaging system, not just a tour engine. A second product is in production.

**Trigger to actually build:** Second UPTIQ product commits to adoption OR AI Platform PM asks for one of these new types by name.

## v1.0 — Enterprise readiness (Sprints 15–20, ~6 weeks + operational time)

**Goal:** Mature, boring, safe. Ready for any UPTIQ product to adopt without hesitation.

- **Embeds.** Inline content blocks that render inside product pages (not overlays). Useful for empty-state coaching, contextual explainers in dashboards. ~2 weeks.
- **A/B testing / Control experiments.** Split-test two variants of a tour. Assignment by stable hash. Variant ID in every event. ~2 weeks.
- **Debugger / Diagnostics tool.** A small in-product overlay (dev-only) that shows: which tours qualify, why some don't, current DOM targets, event stream. ~1 week.
- **Content-served-from-API.** Instead of bundling content with the app, serve tour JSON from a backend endpoint. Updates go live without redeploy. Optional per product. ~2 weeks + backend.
- **Public REST API.** Programmatic user management, content read/write, GDPR delete. Needed for anyone integrating this with a data warehouse or admin flow. ~2 weeks.
- **GDPR deletion flow.** Delete-user-data endpoint. Persistence adapter contract extension. ~3 days.
- **Third UPTIQ product onboarded.** Validates the multi-product story at scale.

**Deliverable:** SDK is a real enterprise-ready product. Three UPTIQ products in production.

**Trigger to actually build:** Compliance asks for GDPR delete OR the second product needs one of these features OR we hit "hot-updates without redeploy" as a real pain point.

## Sprint 18–20 — Lightweight cross-product analytics

**Explicitly deferred to Sprint 18–20 per direction.** Not a full Analytics Studio (that's a non-goal per `vs-appcues.md`).

**What we build:**
- A small internal dashboard aggregating training metrics across all UPTIQ products using the SDK.
- Reads from a single analytics warehouse (whatever UPTIQ has — Snowflake / BigQuery / etc.).
- Shows: per-product completion rates, per-tour drop-off, cross-product training-adoption curves.
- Written as a simple internal web page or Notion / Retool dashboard, not a rebuilt Amplitude.

**What we don't build:**
- Funnels, saved charts, user profiles, event explorers — leave those in the products' own analytics tools where they already exist.

**Effort:** ~1 sprint if we lean on Retool / Metabase / a simple Next.js page. NOT the multi-month Studio Appcues built.

**Trigger to build:** Once we have 2+ products in production and someone (probably you) needs to answer "how is training performing across all UPTIQ products?"

## v2.0+ — On demand

Deliberately not planning yet. Track promotion triggers per feature; build only when a real UPTIQ signal appears.

- Advanced targeting (behavioral cohorts, machine-learning propensity).
- Multi-tenant Content Studio (if UPTIQ ever sells the SDK externally — unlikely).
- Cross-device sync backend (if users complain about desktop → mobile continuity).
- Native mobile SDKs (only if UPTIQ ships a mobile product — currently non-goal).
- Video walkthroughs (if a tour needs > 2 sentences of body, video wins).

## Explicit non-goals — never building

Restated from `vs-appcues.md` so this doc is self-contained:

1. **Mobile SDKs** — no UPTIQ mobile product; would consume ~30% of Appcues' scope for zero value.
2. **Visual no-code Studio** — our author is technical; git PR beats WYSIWYG; would double our maintenance burden.
3. **Multi-channel Workflow engine** — offload to HubSpot / Braze / Iterable, which UPTIQ likely already has.
4. **Full Analytics Studio** — offload to Amplitude / PostHog / Mixpanel, which UPTIQ products already emit to. Only build the lightweight cross-product aggregator at Sprint 18–20.

## Effort summary

| Tier | Sprints | Team required | Cumulative Appcues coverage |
| --- | --- | --- | --- |
| v0.1.0-mvp | Sprints 1–4 (done) | 1 person + AI | ~25% |
| v0.2 | Sprints 5–8 | 1 person + AI | ~35% |
| v0.5 | Sprints 9–14 | 1 person + AI, or 2 in parallel | ~50% |
| v1.0 | Sprints 15–20 | 2 engineers + designer + PM (part-time) | ~65–70% |

At v1.0 we're at ~two-thirds of Appcues' feature surface, covering the two-thirds that matters for UPTIQ, at ~10% of Appcues' engineering cost and 0% of the SaaS bill.

## What to revisit at each tier boundary

**End of v0.2:** Was the audience-targeting the actual need, or did PMs really want something else? Are non-technical users trying to author content?

**End of v0.5:** Which experience types (Banners, Pins, NPS, Surveys, Launchpad) got real usage, and which stayed empty? Cut the ones nobody used.

**End of v1.0:** Do we have a real reason to keep going, or is this now "done"? The maintenance floor of a mature SDK is roughly 15% of one engineer. Anything beyond that needs a real trigger.

## Related

- [`vs-appcues.md`](./vs-appcues.md) — feature comparison and strategic reasoning.
- [`roi.md`](./roi.md) — financial case, updated cross-product math applies.
- Root `ROADMAP.md` — sprint-level detail.
- `tracker/backlog.md` — task-level detail (updated as each tier is committed).
