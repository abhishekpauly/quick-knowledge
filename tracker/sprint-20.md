# Sprint 20 · Days 120–126 · v1.0.0 stable tag

**Goal:** Close the v1.0 tier. Land the rescoped OpenAPI change, the final Retool panel + Slack alert, the PM-facing publishing walkthrough, and cut the `v1.0.0` stable tag.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-290 | OpenAPI `ContentBundle` descriptions-only shape from `TourSchema.shape` (rescoped from T-280) | DONE |
| T-291 | Retool panel 6 (consent-gated tour skips) + `content_bundle_update_failed > 10/hour` Slack alert | DONE |
| T-292 | `docs/publishing-from-your-browser.md` — PM walkthrough | DONE |
| T-293 | CHANGELOG collapse — four `-api*` preview headers → one `v1.0.0` header (per-sprint blocks preserved for audit) | DONE |
| T-294 | Tag `v1.0.0`; `-preview` dropped from README + ROADMAP status blocks | DONE (simulated) |

## T-290 · OpenAPI `ContentBundle` from `TourSchema.shape`

`packages/api-server/src/openapi.ts` gains `describeBundleFromTourSchema()` — introspects `TourSchema.shape`, maps each field to a coarse OpenAPI type via `coarseType()`, marks required vs. optional honestly. Doesn't recurse into discriminated unions (Trigger, AdvanceOn, Step) — those stay `type: object`. Zod remains the runtime source of truth; this is documentation-grade schema for consumers who consult `/openapi.json`.

Delta from the previous placeholder (`{ type: 'object' }`) is a ~30-line function plus two-line wire-in — well within the "descriptions-only" scope the Sprint 19 retro pinned. No `TourSchema` refactor, no new npm dep. 3 new tests.

**Explicit non-goal preserved:** the full `zod-to-openapi` generator remains out of scope. No adopter has asked; the required schema refactor isn't earned. If one does, plan it as its own multi-sprint work.

## T-291 · Retool panel 6 + Slack alert

Panel 6 (consent-gated tour skips) requires an opt-in host-side `training_qualified` event — the SQL sketch lives at `docs/dashboards/cross-product-training.md`. Adopters who don't wire the synthetic side see an empty panel with a link to the wiring doc. No adopter is required to opt in for the panel to be useful — Adopters A and C already have the emit in their sink; B doesn't (Vue-only, no consent gate today).

Slack alert wires Retool's "Notify" step on the panel-5 query: `sum(errors) > 10` in the last hour → `#sdk-alerts` post with product, top reason, and a panel link. No PagerDuty — this is a nudge, not an incident.

## T-292 · PM walkthrough

`docs/publishing-from-your-browser.md`. Written after Adopter B's PM shipped a pin change directly in Sprint 19. Covers what a PM can change, what they should NOT change without engineering, the two-minute publish flow, rollback path via `GET /content/:product/history`, and how to request access. Deliberately does not assume the PM knows what a bearer token is or what JSON validation is beyond "red underline means broken".

## T-293 · CHANGELOG collapse

New `[v1.0.0] — 2026-08-21` release header at the top of `CHANGELOG.md` with the tier-level summary. The four per-sprint `-api*` blocks (Sprint 16 through Sprint 19) stay below it verbatim so a reader auditing which capability landed which sprint still has the full trail. Sprint 15 (design-only) sits at the boundary — no tag, still worth reading.

## T-294 · `v1.0.0` tag

Simulated tag `v1.0.0` cut Day 126 20:00 UTC. Behind the scenes:

- README status block: `v1.0.0-api.2` → `v1.0.0` stable.
- ROADMAP tier heading: `## Now — v1.0 · Enterprise readiness` → `## Shipped — v1.0 · Enterprise readiness — tag v1.0.0`.
- ROADMAP "Sprint 18–20 · Lightweight cross-product analytics" section flipped from planned to shipped (bullets [x], Retool named).
- ROADMAP "Vue adapter — on demand" section flipped to shipped (Vue adapter has been in production since Sprint 08; the section was stale).
- Revision-log entry added.

Historic sprint tags (`v1.0.0-api-preview`, `v1.0.0-api`, `v1.0.0-api.1`, `v1.0.0-api.2`) preserved in per-sprint CHANGELOG blocks and per-sprint ROADMAP entries — they're audit trail, not current state.

## v1.0 tier — what shipped (Sprints 15–20)

Consolidated for the release notes.

- **Public REST API** (ADR-0007): three scopes, RFC 7807 errors, versioned path, two shipping packages (`api-server`, `api-client`).
- **Content served from API** (ADR-0008): `RemoteContentSource` in the SDK; `Trainer.replaceTours` on the engine; two paved-path validators (tours-only, pins-only, mixed).
- **GDPR + consent** (ADR-0005, ADR-0006): `Trainer.forgetUser`, `ConsentAdapter` — pulled forward from v0.5 (Sprint 12).
- **Two production adopters on the API path**: Adopter C (Reports, React) Sprint 18; Adopter B (Vue, Pins-only) Sprint 19.
- **Persistent `ContentStore` reference**: `createFileContentStore` — no new dep.
- **Cross-product analytics**: Retool dashboard, six panels + Slack alert.
- **Docs**: `docs/wiring-content-api.md`, `docs/migration-v1.md`, `docs/publishing-from-your-browser.md`, `docs/dashboards/cross-product-training.md`.
- **Event dictionary** grew 11 → 13 (`content_bundle_updated`, `content_bundle_update_failed`).

Public API additions across the tier — all backward-compatible. No breaking change from v0.5.

## Retro (compressed)

- **What went well:** The rescoping of T-280 → T-290 paid off. 30 lines of introspection covers 90 % of what an adopter actually reads in a spec.
- **What went badly:** The Sprint 19 retro flagged `dismissActive` as under-tested against a real Shepherd-active tour. Sprint 20 didn't fix that — the DOM-heavy path stays behind a Playwright test we haven't written. Filed T-300 for post-v1.0.
- **Surprise:** T-291's synthetic side needs zero engine work — hosts emit `training_qualified` themselves. The panel is a documentation exercise, not a code one.
- **After v1.0:** The `v1.0` tier ships. Next tier (v1.1 or v2.0, TBD) waits on real triggers from adopters — no speculative planning. The `Never` items in `product/vs-appcues.md` remain out unless a specific ask lands.

**Tag:** `v1.0.0`.
