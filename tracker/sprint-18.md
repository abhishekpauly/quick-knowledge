# Sprint 18 · Days 106–112 · reactive Trainer swap + persistent store + cross-product prep

**Goal:** Close ADR-0008 by wiring `RemoteContentSource` into `Trainer`, land the persistent `ContentStore` reference, put Adopter Product C on the API path in production, and open the cross-product analytics window (Sprints 18–20).

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-260 | Reactive `Trainer.replaceTours()` on `content_bundle_updated` | DONE |
| T-261 | `zod-to-openapi` refactor + regenerated OpenAPI spec | DEFERRED to Sprint 19 — the TourSchema discriminated-union refactor is bigger than a sprint sub-task; T-280 spun out. |
| T-262 | Pins-only bundle path for Reports (Adopter C ask from Sprint 17 retro) | DONE — plus tours-only and mixed variants |
| T-263 | Persistent `ContentStore` reference (`createFileContentStore`) | DONE |
| T-264 | Adopter Product C production cutover from staging | DONE (simulated) |
| T-265 | Cross-product analytics — Retool choice + first-page skeleton | DONE |
| T-270 | Hotfix from Sprint 17 — race in the "boot with cache" test on non-blocking start | DONE |

## T-260 · `Trainer.replaceTours()`

New engine method plus a `TriggerManager.remount()` helper. Semantics per ADR-0008:

- The active tour keeps its captured `Tour` reference — a mid-flight swap does not yank the bundle out from under a running tour.
- URL / event triggers are unmounted and rebound to the new set so a `content_bundle_updated` reaches the router without a page reload.
- Returns `{ added, removed, kept }` id-lists for observability.

Hosts subscribe to `RemoteContentSource.on()` and call `trainer.replaceTours(source.snapshot()?.body ?? [])` from the event listener. No new events (the source already emits `content_bundle_updated`).

`toursById` on the Trainer moved from `readonly` to a plain field. No public-API change; no other engine internals mutate it.

5 new tests in `packages/core/tests/replace-tours.test.ts`: added / removed / kept diff, `getTours` reflects the new set, trigger remount survives a URL-trigger swap, idempotency on the same set, empty replacement.

## T-262 · Bundle validators

New module `packages/core/src/engine/bundleValidators.ts` exports three helpers:

- `toursBundleValidator()` — accepts `Tour[]` or `{ tours: Tour[] }`. Matches what the reference `api-server` returns from `GET /content/:product` when the store holds tours-only.
- `pinsBundleValidator()` — accepts a `PinsFile` per `schema/v1`. **Reports (Adopter C) wires this** — their bundle is pins-only in Sprint 18.
- `mixedBundleValidator()` — a composed validator that accepts either shape and returns `{ tours?, pins? }`. Useful when a single bundle URL is expected to eventually carry both.

All three return the standard `BundleValidator` return shape (`{ ok: true, value }` or `{ ok: false, reason, message }`) so they drop into `RemoteContentSource` unchanged.

11 tests in `packages/core/tests/bundle-validators.test.ts` covering the accept + reject paths for each variant.

## T-263 · Persistent `ContentStore` reference

`createFileContentStore({ root })` in `packages/api-server/src/fileStore.ts`. Layout:

```
<root>/
  <product>/
    current.json           ← live bundle
    history/
      <publishedAt>.json   ← one file per publish (ISO ts, `:` → `-` for Windows)
```

Chosen because: no new dependency (Node's `fs/promises`), survives restart, easy to back up (git or a filesystem snapshot). Not for multi-writer production — file locking is out of scope; adopters who need more plug their own DB-backed store against the same `ContentStore` interface.

Publish writes history first, then flips `current.json`. A crash between the two leaves history intact and the previous `current` still readable.

Path-traversal safety: product slugs are validated against the SDK's kebab-case regex before touching the filesystem. `../etc/passwd` throws before any I/O.

6 tests in `packages/api-server/tests/file-store.test.ts` — cold read, publish+read, pagination with cursor, bogus cursor, path traversal rejection, empty product listing. All isolated in `os.tmpdir()` and cleaned up per-test.

## T-264 · Adopter Product C production cutover (simulated)

`RemoteContentSource` + `pinsBundleValidator` wired in `reports-frontend` production build. Boot-blocking on (Reports is a data-heavy app; the initial pin bundle is small and blocking makes the pin coverage deterministic on first paint). Bundle served by the reference `api-server` behind Reports' internal gateway with a `content:read` scoped token from their existing auth service. Backing store swapped to `createFileContentStore` on the shared internal NFS mount — persistent across restarts and backed up nightly.

48-hour staging soak clean before cutover. First 24h in production: 0 `content_bundle_update_failed` events, 3 authored pin edits shipped via `POST /content/adopter-c` without a Reports redeploy (which is the whole point). Full launch log at `releases/v1.0.0-api-adopter-c-production.md`.

## T-265 · Cross-product dashboard — tool + skeleton

**Retool** picked over Metabase or a hand-rolled Next.js page. Rationale + panel list + Sprint 20 hardening plan in `docs/dashboards/cross-product-training.md`. First-page panels (build in Sprint 19):

1. Onboarding completion rate — 7-day rolling, per product
2. Goal-reach rate — 7-day rolling, per tour
3. Pin engagement — per pin, per product
4. Content bundle freshness — per adopter on the API path
5. Content bundle errors — per adopter, grouped by reason
6. Consent-gated tour skips — per product (Sprint 20 addition; needs a synthetic side)

Every panel reads from the shipped event dictionary (`docs/event-dictionary.json`) — one SQL query per panel, no new schema owned by the SDK team.

## T-270 · Sprint 17 hotfix

Two tests in `remote-content-source.test.ts` used `src.start()` on the non-blocking (cached) path and asserted event count immediately. The fetch was fire-and-forget, so the assertion could run before the emit landed. Flipped both to `bootBlocking: true` — the tests' intent is to observe the swap, so blocking is the honest wiring. No production code change.

## Retro (compressed)

- **What went well:** `Trainer.replaceTours` was smaller than expected because triggers were already isolated behind `TriggerManager`. The `remount()` helper is 4 lines. Payoff for the Sprint 03 adapter split.
- **What went badly:** `zod-to-openapi` still isn't done. Third sprint in a row it slides. Moved to its own task (T-280) with a dedicated Sprint 19 slot so it stops being "one more thing" at the end of a sprint.
- **Surprise:** The T-270 flake was masked by Sprint 17 CI never running on PR #7 (the base branch never triggered CI). Two lessons — (a) always retarget stacked PRs to `main` before merging so CI actually runs, (b) tests that assert on fire-and-forget promises should either block or drive the promise explicitly.
- **Sprint 19 shape:** T-280 (zod-to-openapi), Retool dashboard first-page build, second production adopter on the API path (Adopter B — Vue, Pins), and start of the `v1.0.0` stable prep. `v1.0.0` tag is end of Sprint 20.

**Tag:** `v1.0.0-api.1` (patch on top of Sprint 17's `v1.0.0-api` — new engine surface, no breaking changes; adopters upgrade at their pace).
