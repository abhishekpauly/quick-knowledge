# ADR-0008: Content served from API — SDK integration

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Abhishek Paul (SDK), [Product PM]
- **Related:** ADR-0007 (Public REST API), Sprint 15 T-224 (problem statement), Sprint 16 T-230.

## Context

Through v0.5 the SDK loads its content bundle from the host's build output. Editing a tour requires a host redeploy. That was fine at one host (v0.1); tolerable at three (v0.5); untenable past five, and Adopter Product C lands in Sprint 17.

Sprint 15 T-224 captured four open questions. This ADR answers them and pins the SDK-side integration.

## Decision

Ship a `RemoteContentSource` in `@in-app-training/sdk` that boots with a bundle URL, refreshes in the background, atomically swaps the in-memory bundle, and emits `content_bundle_updated` for observability. Never blocks a running tour mid-flight.

### Cache flow

1. **Boot.** Read the last-known-good bundle + its ETag from `Persistence` (falls back to `localStorage` when the host wires the default adapter). Serve the SDK from this bundle immediately — do not block on the network.
2. **First fetch.** In the background, `GET /content/:product` with `If-None-Match` set to the persisted ETag.
   - `200` → validate against the SDK's Zod schema, swap the in-memory bundle, persist body + new ETag, emit `content_bundle_updated`.
   - `304` → no swap, no emit, no persistence write.
   - Any error → keep the last-known-good bundle, log warning, emit `content_bundle_update_failed` (host may forward to its error tracker).
3. **Recurring refresh.** Configurable interval (default 5 minutes, minimum 30 s). Same flow.
4. **Cold start with no cache.** Same flow, but boot blocks on the first fetch up to a `bootTimeoutMs` (default 3 000). On timeout: proceed with an empty bundle and mark subsequent fetches as still-required.

### The four T-224 questions — resolved

1. **Bundle host — CDN or API?** The SDK is agnostic (`baseUrl` is a string). The reference API server sets `cache-control: private, must-revalidate` and a weak ETag; a CDN placed in front works with `s-maxage=0, stale-while-revalidate=60` at the edge. Recommendation, not enforcement.
2. **Stale-content policy on network failure.** Keep the last-known-good bundle indefinitely. Never throw. Emit `content_bundle_update_failed` with the underlying error so hosts can escalate on their own timers.
3. **Schema-version mismatch.** Hard-refuse the swap. Keep serving the old bundle. Emit `content_bundle_update_failed` with `reason: 'schema-version-mismatch'`. Rationale: silently swapping to a bundle we cannot validate is worse than serving a stale-but-valid one.
4. **Consent categories on mid-tour swap.** The running tour finishes on the old bundle it started with. The swap applies to *new* tour starts (and to next-checked pins/hints). This falls out of "atomic swap only when nothing is mid-flight for the affected id" — trivially implemented as a copy-on-read guard for the active `TourRun`.

### Event additions

Two new events, pushing the dictionary from 11 → 13:

- `content_bundle_updated` — `{ product, version, etag, prevEtag }`.
- `content_bundle_update_failed` — `{ product, reason: 'network' | 'validation' | 'schema-version-mismatch' | 'timeout', message }`.

Both are `functional` consent category (they carry no user identifiers).

## Alternatives considered

- **WebSocket push instead of polling.** Rejected for now. Every adopter runs behind a corporate proxy; long-lived WS connections are the first thing SREs kill. Polling with ETag + `cache-control` is cheap and boring. Revisit if any adopter proves a real-time update requirement (e.g. flash-launch a pin during a live incident).
- **Block boot on the network fetch always.** Rejected — a slow API turns SDK integration into a visible page-load regression. Boot-from-cache is the default; block-on-first-fetch is opt-in via `bootBlocking: true`.
- **Version the URL, not the bundle.** Rejected. Adopters would have to redeploy the host to swap URLs. Defeats the point.

## Consequences

### Positive
- Adopters can publish content without a host redeploy.
- ETag round-trips make refreshes cheap (304 with an empty body).
- Schema-version mismatch is a data problem, not a runtime crash.

### Negative
- The SDK now owns a background timer + persistence round-trips it did not have before. Test coverage for the fetch loop needs to be first-class (Sprint 17).
- Two new events must be documented and dashboards need updating; the event-dictionary CI drift check catches missed regenerations.

### Neutral
- The default 5-minute refresh cadence is a guess; the `pollMs` field is tunable per host. Cross-product analytics will tell us in Sprints 18–20 whether the default is right.

## Revisit triggers

- **An adopter proves a real-time update need.** WS push becomes worth the operational cost.
- **Refresh traffic becomes a measurable cost line.** Move to conditional refresh only on route change / user action.
- **Multiple hosts report boot-block visibility.** Change the default to non-blocking with a pre-warmed cache from a `<link rel="preload">` the host emits.
