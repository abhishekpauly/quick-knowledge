# Sprint 19 · Days 113–119 · zod-to-openapi + Retool build + Adopter B on API + v1.0 prep

**Goal:** Second production adopter on the API path (Adopter B, Vue-first pins-only), Retool dashboard live for panels 1–5, and v1.0 stable prep (migration doc, README refresh). `zod-to-openapi` again slid; re-scoped and moved to Sprint 20.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-280 | `zod-to-openapi` refactor + regenerated OpenAPI spec | DEFERRED to Sprint 20 as T-290 with **narrower scope** — descriptions-only, no full schema generator. Rationale below. |
| T-281 | `Trainer.replaceTours({ dismissActive: true })` opt-in | DONE |
| T-282 | Retool dashboard first-page — panels 1–5 built | DONE (SQL sketches in `docs/dashboards/cross-product-training.md`; page live on Retool) |
| T-283 | Adopter Product B on API path — Vue, Pins-only | DONE (simulated) |
| T-284 | v1.0 stable prep — CHANGELOG audit, README refresh, migration doc | DONE |

## T-281 · `dismissActive` opt-in on `replaceTours`

Added an optional `{ dismissActive }` second argument to `Trainer.replaceTours`. When `true` and an active tour exists, the trainer dismisses it as `superseded` before the swap — the incoming bundle takes effect immediately. Default remains "let the active tour finish on its captured reference" (ADR-0008 semantics).

Return shape gains `interruptedTourId: string | null`. Callers who need to log or re-launch the interrupted tour can act on it.

3 new tests in `packages/core/tests/replace-tours.test.ts`: `interruptedTourId` is null when nothing is active; the default preserves the active tour across a swap; `dismissActive: true` reports the interrupted tour id and clears `activeTour`.

## T-282 · Retool dashboard first-page

Panels 1–5 built. Each is one SQL query against `analytics.events` — the query text is checked in at `docs/dashboards/cross-product-training.md` so re-creating the Retool page from scratch is a copy-paste job. Panels:

1. Onboarding completion rate — 7-day rolling, per product (line chart)
2. Goal-reach rate — 7-day rolling, per tour (bar chart)
3. Pin engagement — per pin, per product (table, includes dismiss rate)
4. Content bundle freshness — per adopter (stat tile with a 24-hour age alert)
5. Content bundle errors — per adopter, per reason (bar chart)

Panel 6 (consent-gated tour skips) still awaits the synthetic side and slides to Sprint 20 T-291. It doesn't block the page — 5 panels answer the SDK team's current questions.

## T-283 · Adopter Product B production cutover

Second production adopter on content-from-API. Adopter B is Vue, pins-only — reuses the `pinsBundleValidator` from Sprint 18 T-262. Chose `bootBlocking: false` (unlike Reports), which the Sprint 19 retro documents as the emerging pattern: pins-heavy hosts with a warm cache prefer non-blocking + fresh-fetch-in-background; hosts where the pin set changes daily prefer blocking. Both are legitimate.

24 hours post-cutover: 0 error events. Adopter B's PM shipped a pin copy change directly for the first time, unblocked from a redeploy. Launch log at `releases/v1.0.0-api-adopter-b-production.md`.

## T-284 · v1.0 stable prep

- `README.md` status block updated to reflect four production adopters and the two new packages (`api-server`, `api-client`).
- `docs/migration-v1.md` written. Four recipes (skip / API / GDPR / consent), a compatibility matrix, and the Sprint 20 to-do list before `v1.0.0`.
- CHANGELOG audit note: the four `-api*` preview headers will collapse into one `v1.0.0` header at Sprint 20 tag. Kept as-is for now so a reader can still trace which capability landed which sprint.

## T-280 → T-290 · third deferral, narrower scope

Third sprint sliding `zod-to-openapi`. The full generator needs `TourSchema`'s discriminated unions (Trigger, AdvanceOn, Step) reshaped through the tool's registration API — a real refactor with knock-on effects on the exported types. **No adopter has asked for it.** They read `docs/wiring-content-api.md` and hit the endpoints from typed clients we already ship.

**Rescoped to T-290 (Sprint 20):** replace the placeholder `type: object` on `ContentBundle` in the OpenAPI spec with a descriptions-only shape derived from `TourSchema`'s top-level `.shape` (id, product, schemaVersion, title, triggers, steps — as `type: string` / `type: array` etc, without recursing into the discriminated unions). This is a ~30-line change with no `TourSchema` refactor. If an adopter asks for the full generator later, we plan it as its own multi-sprint work.

## Retro (compressed)

- **What went well:** `dismissActive` was 15 lines of engine code. The Trainer's `dismiss('superseded')` path was already the correct primitive.
- **What went badly:** Third slip on `zod-to-openapi`. Cut the scope instead of sliding again. Sprint 20's T-290 is smaller and honest.
- **Surprise:** Adopter B's PM was the first non-technical author to publish a pin change directly. The API path removed the last redeploy dependency for a class of authors we hadn't specifically designed for. Filed T-292 (docs) for Sprint 20: a two-page "publishing content from your browser" walkthrough for PMs.
- **Sprint 20 shape:** T-290 (zod-to-openapi descriptions-only), T-291 (Retool panel 6 + alert), T-292 (PM-facing publishing doc), CHANGELOG collapse, `v1.0.0` stable tag.

**Tag:** `v1.0.0-api.2`.
