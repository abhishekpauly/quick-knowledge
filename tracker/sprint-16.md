# Sprint 16 · Days 92–98 · REST API first endpoints + ADR-0008

**Goal:** Ship `v1.0.0-api-preview`. First real code of the v1.0 tier. Two new packages (`@in-app-training/api-server`, `@in-app-training/api-client`), ADR-0008 (SDK-side content refresh design), OpenAPI spec, wiring docs. Adopter Product C's `data-tour` PR lands or slips clearly.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-230 | ADR-0008 · Content-served-from-API — SDK integration + cache policy | DONE |
| T-231 | `@in-app-training/api-server` scaffold + in-memory store + framework-agnostic handlers | DONE |
| T-232 | `GET /content/:product` with ETag + `If-None-Match` handling | DONE |
| T-233 | `@in-app-training/api-client` typed fetch client + 429 backoff | DONE |
| T-234 | OpenAPI 3.1 spec generation + `/openapi.json` route | DONE |
| T-235 | Docs — `docs/wiring-content-api.md` first cut | DONE |
| T-236 | Test suite — server route tests + client contract tests | DONE |
| T-240 | Adopter Product C `data-tour` PR intake + review | DONE (PR merged end of sprint) |
| T-241 | `v1.0.0-api-preview` tag + launch log | DONE |

## Package landings

### `@in-app-training/api-server` (new)

- `src/store.ts` — `ContentStore` interface + `createInMemoryContentStore()` for tests + local dev.
- `src/auth.ts` — `TokenVerifier` interface, `extractBearer`, `hasScope`. Server never mints tokens.
- `src/etag.ts` — weak SHA-256 truncated ETag + RFC 7232 `If-None-Match` matcher (comma-split, wildcard-aware).
- `src/errors.ts` — RFC 7807 `problem()` helper. Every non-2xx uses it.
- `src/handlers.ts` — framework-agnostic `getContent`, `getContentHistory`, `publishContent`, `forgetUser`. All authz-checked. `publishContent` stamps `publishedBy` from the token subject and calls the injected Zod validator.
- `src/openapi.ts` — 3.1 spec, hand-written for the API-preview. Sprint 17 swaps to `zod-to-openapi`-generated schemas.
- Handlers are pure functions — no HTTP framework dependency. Adopters wire them into Fastify / Express / native `http` / a worker runtime with a small `toHandlerRequest` adapter in their own repo (5 lines). Docs show the shape.
- `tests/handlers.test.ts` — 10 tests: auth gating (missing / bad / scope), 404 / 200+etag / 304 / wildcard match, 422 with validationErrors, 201 with subject stamp, history pagination + limit clamp, forget receipt.

### `@in-app-training/api-client` (new)

- `src/index.ts` — `createContentClient({ baseUrl, token, fetch?, jitter?, sleep? })`.
  * `token` accepts a producer for refresh-on-401 flows.
  * `getContent(product, ifNoneMatch?)` returns `{ status: 200 | 304, etag, body?, bundleVersion?, bundlePublishedAt? }`.
  * `publishContent`, `listHistory`, `forgetUser` — same auth path.
  * 429 backoff: 2 retries max, 1s → 30s ceiling, ±20 % jitter, `Retry-After` capped at `maxRetryAfterMs` (default 30 000).
  * Errors throw `ApiError` with the parsed problem+json body.
- `tests/client.test.ts` — 10 tests: bearer injection, token-producer refresh, 304 no-body, 429-retry-then-200 sequence, problem-body surfacing, POST publish shape, history query params, forget receipt, percent-encoding, jitter bounds.

## Adopter Product C · T-240

PR `reports-frontend#812` opened Day 93, merged Day 97. 5 `data-tour` attributes on the report-builder canvas. One selector renamed at review (`data-tour="rbuilder-add-source"` → `data-tour="reports-add-source"`) to match the SDK's product-slug convention. Sprint 17 onboards on this PR — same shape as Adopter A (Sprint 11).

## Simulated launch log · `v1.0.0-api-preview`

Tag cut Day 98 20:11 UTC. Preview only — no production adopter is on the API path yet; the tag exists so Sprint 17's `RemoteContentSource` has a stable server surface to build against. Reference server is running under `example-app-training-api.internal:3300` behind the standard gateway. First smoke test:

```
$ curl -s -H "Authorization: Bearer $TOK" $API/content/example-app | jq '.tours | length'
7
$ curl -s -H "Authorization: Bearer $TOK" -H "If-None-Match: $ETAG" $API/content/example-app -o /dev/null -w '%{http_code}\n'
304
```

Full log at `releases/v1.0.0-api-preview-launch-log.md`.

## Retro (compressed)

- **What went well:** Splitting handlers from the framework wrapper made testing trivial — no `supertest`, no ephemeral ports, just call the handler with a plain object. Should backport this pattern any time we add a second HTTP surface.
- **What went badly:** The OpenAPI spec is hand-written this sprint because `zod-to-openapi` needs a small refactor of `TourSchema` (nested discriminated union → the tool's supported subset). Filed T-250 for Sprint 17.
- **Surprise:** Adopter C's PM asked whether their existing internal tokens could be split by scope at their gateway rather than at the auth service. Answer: yes — a gateway rewrite of the `Bearer` header works so long as the token verifier sees the final scopes. Documented in `docs/wiring-content-api.md`.
- **Sprint 17 shape:** `RemoteContentSource` in `@in-app-training/sdk` per ADR-0008 (2 new events → dictionary 11 → 13), `zod-to-openapi` refactor (T-250), Adopter Product C onboarding on the new API path end-to-end. First real user of hot-updates.

**Tag:** `v1.0.0-api-preview`.
