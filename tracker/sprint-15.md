# Sprint 15 · Days 85–91 · v1.0 kickoff — REST API design + third-adopter scouting

**Goal:** Open v1.0. Land ADR-0007 (Public REST API) as an accepted design, scout the third adopter, and set up the Sprint 16 implementation slot. No shipping code this sprint — this is the design + intake gate before the v1.0 execution window (Sprints 16–20).

**Status:** COMPLETE (simulated).

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-220 | ADR-0007 · Public REST API surface (auth, resources, versioning, error shape) | DONE |
| T-221 | ADR-0007 review pass with InfoSec (async) — record decisions inline | DONE |
| T-222 | v1.0 scope note in `product/` — pin the tier line-up, cite Sprint 14 T-211 | DONE |
| T-223 | Third-adopter scouting — shortlist + go/no-go signal per candidate | DONE |
| T-224 | Content-served-from-API — problem statement + open questions (feeds ADR-0008 next sprint) | DONE |
| T-225 | Backlog refresh — Sprint 16 rows, v1.0 tier rows, drop stale open questions | DONE |
| T-226 | ROADMAP tidy — flip "Now — v0.2" heading (stale since Sprint 14 T-212) to "Shipped — v0.2"; mark `[ ]` scope bullets in the v0.5 tier as `[x]` since v0.5.0 tagged | DONE |
| T-170 | (Closed in Sprint 14 T-210 — kept here as a pointer for grep) | CLOSED |

## T-220 · ADR-0007 · Public REST API surface

Draft landed as `docs/adrs/ADR-0007-public-rest-api.md` (**Proposed** on entry; **Accepted** after T-221). Shape summary:

- **Base:** `https://api.<host>/training/v1`. Version pinned in the path so v2 can coexist during any future migration.
- **Auth:** bearer tokens minted by the host product's existing auth service (never by the SDK). Two token kinds: read-only tenant tokens (content fetch) and admin tokens (content write, `forgetUser` fan-out). Explicitly not building our own token store — this is the "Never build IAM" line.
- **Resources:**
  * `GET /content/:product` — the current live content bundle (tours + pins + hints + goals) for a product, ETagged for hot-updates without redeploy.
  * `GET /content/:product/history` — last N published bundles (paginated). Read-only audit trail.
  * `POST /content/:product` — publish a new bundle. Server validates against the same Zod schema the SDK uses (single source of truth: import from `@in-app-training/sdk/schema`).
  * `POST /users/:userId/forget` — server-side counterpart of `Trainer.forgetUser()` (ADR-0005). Cascades to the cross-device store when that lands; today it's a no-op the SDK reports on so hosts can build against the shape.
  * `GET /events/dictionary` — the shipped event dictionary for a product+version. Consumers can pin analytics validation to it.
- **Error shape:** RFC 7807 problem+json. `type`, `title`, `status`, `detail`, `instance` — plus a `validationErrors[]` array on Zod failures so the publish endpoint returns actionable messages.
- **Versioning:** additive fields never bump the major. Breaking changes (rename/remove) require a v2 base path; the SDK's `schemaVersion` on content bundles is independent of the API version.
- **Rate limits:** documented but delegated to the host's gateway. The SDK sets sane client-side backoff on 429.
- **What's explicitly out of scope:** a hosted UI to author content, an analytics query API, and a user CRUD endpoint. All three would rebuild things the host already owns (`Never` items from ROADMAP).

## T-221 · ADR-0007 InfoSec review

Two changes pulled forward from the async review:

1. **Bearer token scoping** — original draft allowed a single "admin" token per product. InfoSec asked to split into `content:write` and `users:forget` scopes so the delete API can be granted independently. Adopted; ADR updated.
2. **Audit trail on `forget`** — every `POST /users/:userId/forget` response includes the `ForgetUserReceipt` shape from ADR-0005 and the API MUST log the token subject + timestamp. Adopted; noted as an operational requirement, not an SDK change.

ADR status flipped `Proposed → Accepted` at end of sprint.

## T-222 · v1.0 scope pin — `product/v1.0-kickoff.md`

Written to match the shape of `product/v0.5-kickoff.md`. Content in brief:

- **In:** REST API (Sprints 16–17), content-served-from-API (Sprints 17–18), third adopter (opportunistic across 16–19), cross-product analytics dashboard (Sprints 18–20 per ROADMAP).
- **Out (staying HOLD/DROP per Sprint 14 T-211):** Banners (HOLD, no ask), Webhooks (HOLD, no ask), Launchpad (DROP), NPS (DROP), Basic surveys (DROP).
- **Already landed in v0.5 window (not re-doing):** ADR-0005 + ADR-0006 → code. Confirmed as the ADR pull-forward from Sprint 12.
- **Non-goals:** hosted authoring UI, analytics query API, user CRUD API, mobile SDKs. All four are the same "Never" items — repeating them once here so the v1.0 team doesn't rediscover the debate.

## T-223 · Third-adopter scouting

Shortlist of three internal products with a stated in-app-training need, ranked by signal quality:

| Candidate | Stack | Signal | Verdict |
| --- | --- | --- | --- |
| **Adopter Product C** ("Reports") | React | PM asked in the v0.5.3 launch thread whether the SDK could gate the new custom-report builder onboarding. `data-tour` audit: 4 of 5 target elements already exist. | **GO** — target for Sprint 17 kickoff. React parity path is proven twice already (example-app, Adopter A). |
| Adopter Product D ("Billing admin") | Vue | Casual interest from the Billing PM after the Adopter B launch. No committed onboarding tour spec. | HOLD — revisit once ADR-0007 is implemented; hot-updates will matter more to them than shipping v1 tours. |
| Adopter Product E ("Data platform") | React + Vue islands | Would need SSR support (currently a non-goal). | DROP for v1.0. Reopen the SSR "Never" only if a second team asks. |

Adopter C's PM committed to sending a `data-tour` PR by Sprint 16 close. Filed as T-240 (Sprint 16 backlog).

## T-224 · Content-served-from-API — problem statement

Feeds ADR-0008 next sprint. Captured so the Sprint 16 author doesn't restart from zero:

- **Today:** content bundles ship in the host's build. Editing a tour = a host redeploy. That was fine for one product (v0.1) and tolerable for three; it will not scale past five.
- **Goal:** the host boots with a content bundle URL and an ETag. The SDK refreshes in the background, atomically swaps, and emits `content_bundle_updated` for observability. Never blocks the current tour mid-flight.
- **Open questions (for ADR-0008):**
  1. Where does the bundle live — CDN in front of `GET /content/:product`, or the API directly? (Leaning CDN + ETag.)
  2. What's the SDK's stale-content policy on network failure? (Leaning: keep the last-known-good bundle indefinitely; log, don't throw.)
  3. Does a schema-version mismatch (bundle wants `v2`, SDK is `v1`) hot-swap or hard-refuse? (Leaning: hard-refuse the swap, keep serving the old bundle, emit an error event.)
  4. How do consent categories interact with a mid-tour swap? (Leaning: the running tour finishes on the old bundle; the swap applies to new tour starts.)

## T-225 · Backlog refresh

- New `## Sprint 15` and `## Sprint 16` blocks appended to `tracker/backlog.md`.
- The "Open questions — resolved" and "Open items — external only" sections trimmed to remove items that closed during v0.5 (all `data-tour` PR items, PostHog confirmation).

## T-226 · ROADMAP tidy

- `## Now — v0.2 · Targeting + polish (Sprints 5–8, …)` → `## Shipped — v0.2 · Targeting + polish (Sprints 5–8)`. Stale since Sprint 14 T-212 flipped v0.5.
- Sprint 15 becomes the new "Now" — added `## Now — v1.0 · Enterprise readiness (Sprints 15–20)` block above the existing v1.0 tier so the current focus is unambiguous.
- The three `[ ]` scope bullets under the v0.5 tier (Pins / Goals / Second host product) flipped to `[x]` — each was Sprint 14's SHIPPED per T-211's table.
- Revision-log entry added: `2026-08-21 · Sprint 15 opens v1.0. ADR-0007 accepted. Third adopter (Reports) targeted for Sprint 17.`

## Retro (compressed)

- **What went well:** ADR-0007's InfoSec review turned around in one pass with two small changes. Splitting the admin token into two scopes was a real improvement, not a nitpick.
- **What went badly:** T-224 (content-served-from-API) started as "just capture the questions" and grew into most of a mini-ADR. Split it explicitly: ADR-0008 gets its own slot in Sprint 16.
- **Surprise:** Adopter C's `data-tour` audit came back cleaner than expected. If their PM ships the PR on time, Sprint 17 onboarding can compress into ~2 days like Adopter A did (Sprint 11).
- **Sprint 16 shape:** ADR-0008 (content-served-from-API), first REST API endpoints (`GET /content/:product` + ETag), Adopter C `data-tour` PR intake.

**Tag:** none — design sprint. First code tag of v1.0 will be `v1.0.0-api-preview` at end of Sprint 16.
