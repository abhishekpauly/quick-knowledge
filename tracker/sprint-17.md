# Sprint 17 · Days 99–105 · SDK `RemoteContentSource` + Adopter C onboarding

**Goal:** Ship `v1.0.0-api`. Land ADR-0008's `RemoteContentSource` in the SDK, onboard Adopter Product C on the new API path (first hot-update user), regen the event dictionary for the two new events. Reactive Trainer swap deferred to Sprint 18.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-250 | `zod-to-openapi` refactor + regenerated spec | DEFERRED to Sprint 18 — TourSchema's nested discriminated unions need a small refactor first (T-260 track). No adopter blocked. |
| T-251 | `RemoteContentSource` in `@in-app-training/sdk` per ADR-0008 | DONE |
| T-252 | 2 new events: `content_bundle_updated`, `content_bundle_update_failed` | DONE — dictionary 11 → 13 |
| T-253 | Persistence contract addition for ETag + last-known-good bundle | DONE (namespaced under `content-bundle:<product>` — no new interface method) |
| T-254 | Docs — extend `wiring-content-api.md` with SDK section + boot-block toggle | DONE |
| T-255 | Adopter Product C onboarding on the new API path — first hot-update user | DONE |
| T-256 | `v1.0.0-api` tag (drop `-preview` once Adopter C is on the path) | DONE |
| T-260 | (new for Sprint 18) Reactive Trainer swap on `content_bundle_updated` | FILED |

## T-251 · `RemoteContentSource` landing

Standalone class in `packages/core/src/engine/RemoteContentSource.ts`. Boot flow follows ADR-0008 exactly:

1. Read `content-bundle:<product>` from `Persistence` → serve immediately.
2. Background fetch with `If-None-Match: <cached etag>` → 200 swaps + emits, 304 silent, error emits `_failed` and keeps last-known-good.
3. Recurring refresh every `pollMs` (default 300 000, floored at 30 000).
4. Cold boot with no cache blocks up to `bootTimeoutMs` (default 3 000) then proceeds.

Design choices worth re-noting: single-flight `refreshNow()` means concurrent callers share one fetch; persistence write failure does not abort the swap (in-memory swap already happened; next refresh retries); listener errors are swallowed so one bad subscriber cannot break the loop.

**Public API additions** (all backward-compatible):
- `RemoteContentSource` class
- `RemoteContentClient` interface (typed to accept `@in-app-training/api-client`)
- `BundleValidator` / `ValidatorResult` / `ValidatorFailure` types
- `RemoteContentSourceOptions` type
- Two payload types on the events union

## T-252 · Event dictionary regen

`packages/core/src/engine/events.ts` gains two entries in the `TrainingEventName` union and two payload interfaces (`ContentBundleUpdatedPayload`, `ContentBundleUpdateFailedPayload`). `docs/event-dictionary.{md,json}` regenerated to 13 events. CI drift check (npm run docs:events -- --check) clean.

Both events are **functional** consent category — no user identifiers, only bundle identity + reason strings. Hosts running the consent gate can leave them un-gated.

## T-253 · Persistence contract

No interface change. `RemoteContentSource` uses the existing `get`/`set` under `content-bundle:<product>` keys. The localStorage adapter picks them up transparently under the SDK's `in-app-training:` namespace; the memory adapter works out of the box for tests.

Stored shape:

```ts
{ body: unknown; etag: string; version?: string }
```

## T-254 · Wiring docs

`docs/wiring-content-api.md` gains an SDK section with a 20-line minimum wiring example, the event names, the configuration reference table, and a one-paragraph behaviour summary. Trainer-integration expectations pinned to Sprint 18 (T-260).

## T-255 · Adopter Product C onboarding

Reports (React) integrates against the API path end-to-end:

- `content/adopter-c/onboarding.tour.json` — 5-step report-builder onboarding with a goal event (`adopterc.report_published`, 10-minute window matching Adopter A's revised default).
- Reference server publishes the bundle via `POST /content/adopter-c` (dry-run in the launch log; a real publish will land the moment Reports' auth service exposes a `content:write` token to the deploy pipeline).
- Host wiring: `RemoteContentSource` + client instantiated in `apps/reports-frontend/src/training.ts` (Reports side — not in this repo). Boot-blocking on, `pollMs` at the 5-minute default.

First-week smoke plan attached in the launch log; production cutover happens in Sprint 18 after 48 hours on the API path in Reports' staging.

## T-256 · `v1.0.0-api` tag

Drops the `-preview` suffix. Simulated tag cut Day 105 19:47 UTC. Everything Adopter A / B has today keeps working unchanged (they stay on build-shipped content); Adopter C is the first host on the new API path.

## T-250 · deferral note

`zod-to-openapi` needs `TourSchema`'s `TriggerSchema` and `AdvanceOnSchema` (both discriminated unions with `discriminatedUnion('type', ...)`) reshaped through the tool's registration API. Non-trivial, no adopter blocked. Filed into Sprint 18's slate as T-261 and left the hand-written `openapi.ts` in place for the tag.

## Retro (compressed)

- **What went well:** Building `RemoteContentSource` standalone (no Trainer edits) let the whole surface land with 10 focused tests. The single-flight and listener-error containment paid off in the tests, not later.
- **What went badly:** The zod-to-openapi refactor is bigger than sprint-15 T-234 assumed. Split into its own task (T-261) so a hand-written spec doesn't hold up shipping the SDK integration.
- **Surprise:** Reports' PM asked whether Pins could ride the same API path in Sprint 18 (they only have Pins in scope, not tours yet). Answer: yes — `RemoteContentSource` is bundle-shaped, not tour-shaped; a Pins-only bundle validates and swaps the same way. Filed as T-262 for Sprint 18.
- **Sprint 18 shape:** T-260 (reactive Trainer swap), T-261 (zod-to-openapi), T-262 (Pins-only bundle path for Reports), and the persistent `ContentStore` selection so the reference server graduates from in-memory. Start of the cross-product analytics prep window per ROADMAP (Sprints 18–20).

**Tag:** `v1.0.0-api`.
