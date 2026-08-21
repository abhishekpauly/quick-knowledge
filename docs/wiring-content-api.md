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

## Next: SDK-side integration

Sprint 17 wires the client into the SDK as `RemoteContentSource`. Once that ships, hosts add:

```ts
new Trainer({
  ...,
  contentSource: new RemoteContentSource({ client, product: 'example-app' }),
});
```

…and edits to content stop needing a host redeploy.
