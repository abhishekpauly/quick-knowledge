# Wiring the content API

Sprint 16 · `v1.0.0-api-preview`.

The `@in-app-training/api-server` package is a reference REST server for hosts that want to publish content without redeploying. The `@in-app-training/api-client` package is a typed fetch client for the same surface. This doc walks the minimum path to stand both up.

The SDK integration (background refresh, ETag caching, atomic swap) is designed in [ADR-0008](./adrs/ADR-0008-content-served-from-api.md) and lands as `RemoteContentSource` in Sprint 17.

## What ships in Sprint 16

- Framework-agnostic handlers (`getContent`, `getContentHistory`, `publishContent`, `forgetUser`) — bring your own HTTP framework.
- In-memory `ContentStore` reference implementation.
- Typed fetch client with `content:read` / `content:write` / `users:forget` bearer auth.
- ETag + `If-None-Match` on `GET /content/:product`.
- OpenAPI 3.1 spec producer (`openapiSpec({ baseUrl })`) that adopters serve from their own framework.
- 429 backoff on the client (1s → 30s ceiling, ±20 % jitter, capped by `Retry-After` when present).
- RFC 7807 `application/problem+json` on every error.

## What does NOT ship in Sprint 16 (comes later)

- The SDK-side `RemoteContentSource` (Sprint 17, ADR-0008).
- A persistent `ContentStore` implementation. Sprint 16 ships the in-memory store only — adopters plug their own DB-backed store against the `ContentStore` interface.
- Cross-device per-user sync.

## Server — wire the handlers into your framework

The handlers are pure `(HandlerRequest, ServerDeps) → Promise<HandlerResponse>` functions. Wire them into Fastify, Express, native `http`, or a worker runtime — the shape is the same either way.

```ts
import {
  getContent,
  getContentHistory,
  publishContent,
  forgetUser,
  createInMemoryContentStore,
  openapiSpec,
  type TokenVerifier,
  type ServerDeps,
} from '@in-app-training/api-server';
import { TourSchema } from '@in-app-training/sdk/schema/v1';

const auth: TokenVerifier = {
  async verify(token) {
    // Delegate to your existing auth service. This is the "Never build IAM" line.
    return await yourAuthService.introspect(token);
  },
};

const deps: ServerDeps = {
  store: createInMemoryContentStore(),
  auth,
  validate(body) {
    const parsed = TourSchema.array().safeParse(body);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : {
          ok: false,
          errors: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        };
  },
};

// Example: wire into Fastify. Roughly the same shape works for Express or native http.
app.get('/content/:product', async (req, reply) => {
  const res = await getContent(toHandlerRequest(req), deps);
  reply.code(res.status);
  for (const [k, v] of Object.entries(res.headers)) reply.header(k, v);
  return res.body;
});
app.get('/content/:product/history', async (req, reply) => send(reply, await getContentHistory(toHandlerRequest(req), deps)));
app.post('/content/:product', async (req, reply) => send(reply, await publishContent(toHandlerRequest(req), deps)));
app.post('/users/:userId/forget', async (req, reply) => send(reply, await forgetUser(toHandlerRequest(req), deps)));
app.get('/openapi.json', async () => openapiSpec({ baseUrl: 'https://api.example.com/training/v1' }));
```

`toHandlerRequest` is a 5-line adapter that maps your framework's request object to the `HandlerRequest` shape (method, path, params, query, headers, body). Adopters keep this in their own repo so the choice of framework stays local.

## Client — 5 lines

```ts
import { createContentClient } from '@in-app-training/api-client';

const client = createContentClient({
  baseUrl: 'https://api.example.com/training/v1',
  token: () => yourAuthService.currentAccessToken(),
});

const { body, etag } = await client.getContent('example-app');
```

## Token scopes

Three independent scopes. Grant them narrowly:

| Scope | Grant to | Endpoints |
| --- | --- | --- |
| `content:read` | The SDK's `RemoteContentSource` (via the host) | `GET /content/:product`, `GET /content/:product/history` |
| `content:write` | Your content pipeline / editor | `POST /content/:product` |
| `users:forget` | The compliance service that handles GDPR deletes | `POST /users/:userId/forget` |

Never grant `content:write` to the browser-side SDK. Never grant `users:forget` to your CMS.

## Publishing a new bundle

Any CI job or admin tool with a `content:write` token can publish:

```ts
await client.publishContent('example-app', bundle, gitSha);
```

The server validates the body against the shared Zod schema. Validation failures return 422 with an actionable `validationErrors[]` array — pipe them straight to your CI output.

## Audit log requirement

`POST /users/:userId/forget` **must** be logged with token subject + timestamp on the server side (ADR-0007 T-221). The reference in-memory store does not persist this — adopters wire their own logging middleware. Do not ship the delete endpoint to production without one.

## SDK-side integration (Sprint 17 · `v1.0.0-api`)

`RemoteContentSource` ships in `@in-app-training/sdk`. It boots from the last-known-good bundle in `Persistence`, refreshes in the background via the API client, validates every fresh bundle, atomically swaps, and emits two new events:

- `content_bundle_updated` — `{ product, version, etag, prevEtag, timestamp }`
- `content_bundle_update_failed` — `{ product, reason, message, timestamp }` where `reason` is one of `network` / `validation` / `schema-version-mismatch` / `timeout`

### Minimum wiring

```ts
import { RemoteContentSource, localStoragePersistence } from '@in-app-training/sdk';
import { createContentClient } from '@in-app-training/api-client';
import { TourSchema } from '@in-app-training/sdk/schema/v1';

const persistence = localStoragePersistence();
const client = createContentClient({
  baseUrl: 'https://api.example.com/training/v1',
  token: () => yourAuthService.currentAccessToken(),
});

const source = new RemoteContentSource({
  product: 'example-app',
  client,
  persistence,
  validate(body) {
    const parsed = TourSchema.array().safeParse(body);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, reason: 'validation', message: parsed.error.message };
  },
});

source.on((event) => {
  if (event.name === 'content_bundle_update_failed') {
    yourErrorTracker.notify(event.payload);
  }
});

await source.start(); // non-blocking when a cache is present; blocks up to bootTimeoutMs on cold boot
const bundle = source.snapshot(); // pass to the Trainer wiring
```

### Behaviour, in one paragraph

Boot reads the cache and serves the SDK from it immediately. In the background, `GET /content/:product` runs with `If-None-Match` set to the persisted ETag: a `304` is silent (no swap, no event, no persistence write); a `200` runs the validator, atomically swaps the in-memory bundle, persists body + new ETag, and emits `content_bundle_updated`. Any failure emits `content_bundle_update_failed` and keeps the last-known-good bundle. The recurring refresh runs every `pollMs` (default 5 minutes, floored at 30 s). A schema-version mismatch hard-refuses the swap by design — see ADR-0008.

### Configuration reference

| Option | Default | Notes |
| --- | --- | --- |
| `pollMs` | `300_000` | Refresh cadence. Floor is 30 000 ms — smaller values are silently raised. |
| `bootTimeoutMs` | `3_000` | Cold-boot fetch timeout. On timeout the source proceeds with whatever the cache had (or nothing) and emits `content_bundle_update_failed` with `reason: 'timeout'`. |
| `bootBlocking` | (auto) | Defaults: block when there is no cache, non-blocking otherwise. Set explicitly to override. |

### Trainer integration

The Sprint 17 landing ships `RemoteContentSource` as a standalone module. Hosts read the current bundle with `source.snapshot()` and pass it to `Trainer` at construction time. Reactive Trainer swap (`Trainer.replaceTours()` + trigger remount on `content_bundle_updated`) is filed as T-260 for Sprint 18.
