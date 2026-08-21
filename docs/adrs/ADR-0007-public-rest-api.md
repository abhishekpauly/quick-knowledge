# ADR-0007: Public REST API surface

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Abhishek Paul (SDK), [Product PM] (the example app), InfoSec (async review)
- **Related:** ROADMAP `v1.0 tier`, ADR-0005 (`Trainer.forgetUser`), ADR-0006 (`ConsentAdapter`), Sprint 14 T-211 (v0.5 tier close-out), Sprint 15 T-220/T-221.

## Context

Through v0.5 the SDK is entirely client-side: content bundles ship in the host's build, per-user state lives in `localStorage`, analytics goes straight to the host's sink. Two v1.0 line items require a server surface:

- **Content served from API** (hot-updates without redeploy). Once we have three adopters (Adopter C targeted in Sprint 17), rebuilding every host for a tour copy fix stops being tolerable.
- **GDPR delete propagation** (ADR-0005). Today `Trainer.forgetUser()` clears the browser. Once cross-device sync or server-side history exists, deletion has to reach those stores too.

InfoSec's Sprint 07 sign-off explicitly gated any server component on an ADR describing the surface before code lands. This is that ADR.

## Decision

Ship a versioned REST API under `https://api.<host>/training/v1`. Small surface, resource-oriented, bearer-token auth minted by the host's existing auth service.

### Resources

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/content/:product` | Current live content bundle (tours + pins + hints + goals). ETagged. |
| `GET`  | `/content/:product/history?limit=&cursor=` | Last N published bundles. Read-only audit. |
| `POST` | `/content/:product` | Publish a new bundle. Server validates via the same Zod schema the SDK uses (imported from `@in-app-training/sdk/schema` — single source of truth). |
| `POST` | `/users/:userId/forget` | Server counterpart of `Trainer.forgetUser()`. Returns `ForgetUserReceipt` (ADR-0005). |
| `GET`  | `/events/dictionary?product=&version=` | Shipped event dictionary. Consumers can pin analytics validation to it. |

### Auth

- Bearer tokens from the host's auth service. The SDK never mints tokens.
- Two scopes, granted independently (per InfoSec review — T-221):
  * `content:read` — read `/content/*` and `/events/dictionary`.
  * `content:write` — publish bundles.
  * `users:forget` — call the delete endpoint. Separate from `content:*` so a compliance service can hold only this scope.

### Versioning

- Version pinned in the URL path (`/training/v1`). v2 coexists during any future migration.
- Additive fields never bump the major.
- Breaking changes (rename/remove) require `/training/v2`.
- Content bundle `schemaVersion` is independent of the API version — the API can serve `v1` or `v2` bundles under the same `/training/v1` API version.

### Errors

RFC 7807 `application/problem+json`:

```jsonc
{
  "type": "https://api.<host>/errors/validation",
  "title": "Content bundle failed validation",
  "status": 422,
  "detail": "3 validation errors",
  "instance": "/training/v1/content/example-app",
  "validationErrors": [
    { "path": "tours[0].steps[2].target", "message": "expected string, got undefined" }
  ]
}
```

`validationErrors` is added on Zod failures so publish clients get actionable messages.

### Rate limits

Documented, delegated to the host's gateway. The SDK sets client-side exponential backoff on 429 (starts at 1s, doubles to 30s ceiling, jittered ±20%).

### Audit trail on `forget` (per T-221)

Every `POST /users/:userId/forget`:
- Returns the `ForgetUserReceipt` shape (ADR-0005).
- MUST log token subject + timestamp on the server side. This is an operational requirement, not an SDK code change.

## Alternatives considered

- **GraphQL surface** — one endpoint, client-picked shape. Rejected: content bundles are small and fully specified; the flexibility isn't earned, and cache invalidation on ETagged bundles is easier with REST.
- **gRPC** — rejected for the same reason plus proxy/CDN friction on browser callers (content bundle fetch will run through a CDN).
- **Reuse the host's existing API namespace** (e.g. `<host>/api/training/*` under the host's own gateway). Rejected as the mandatory shape — each host can proxy `/training/v1` at any path they want, but the canonical spec is versioned at its own base so multi-adopter docs stay one document.
- **Skip publish endpoint; keep content in git only** — rejected. Content-served-from-API needs *someone* to write the bundle; a first-party publish endpoint keeps the write path uniform across adopters. Hosts that prefer git can wire a CI job that `POST`s the built bundle.

## Consequences

### Positive
- Hot-updates without redeploy become possible (`GET /content/:product` + ETag; ADR-0008 covers the SDK side).
- GDPR delete gains a server-side entry point that matches the SDK's `Trainer.forgetUser()` surface.
- Zod schema stays the single source of truth — publish-time validation cannot drift from SDK-time validation.
- Adopters can grant `users:forget` in isolation to a compliance service, per InfoSec's ask.

### Negative
- First server component the SDK depends on. Any adopter that wants hot-updates now has to operate this API (or accept whatever hosted version we run).
- We now have an audit-log operational requirement (`forget` calls). That's an obligation on whoever runs the API, and it needs to survive redeploys.
- The publish endpoint accepts arbitrary content bundles; a compromised `content:write` token could ship a malicious tour targeting a real selector. Mitigation: scope tokens narrowly, log every publish, and ensure the CSP on host products blocks inline script in step bodies (already true — step bodies are text + safe markdown only).

### Neutral
- Two new packages will land in Sprint 16: `@in-app-training/api-server` (reference implementation, Fastify) and `@in-app-training/api-client` (typed fetch client). Hosts can adopt either or wire their own.
- OpenAPI spec will be generated from the same Zod schemas via `zod-to-openapi`; adopters get a `/openapi.json` off the same base path.

## Revisit triggers

- **Any adopter needs GraphQL or gRPC specifically.** No candidate does today.
- **A second endpoint category grows past 5 resources.** REST-per-resource stays readable up to about that point; past it, revisit the shape.
- **Compliance escalates the audit-log requirement.** If we're asked to hold the log ourselves (not the host), the API grows a `/audit/*` slice and this ADR is superseded.
- **A hosted authoring UI becomes in-scope.** That reopens the `Never` decision from `product/vs-appcues.md` and this ADR's "explicitly out of scope" list.
