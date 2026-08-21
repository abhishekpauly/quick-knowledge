/**
 * Framework-agnostic route handlers for the reference API server.
 *
 * These functions have no HTTP framework dependency — they take a small
 * ContextRequest shape and return a ContextResponse. The fastify plugin
 * (src/fastify.ts) adapts them; tests hit them directly.
 */

import { extractBearer, hasScope, type Scope, type TokenVerifier } from './auth.js';
import { computeEtag, ifNoneMatch } from './etag.js';
import { problem } from './errors.js';
import type { ContentStore, ContentBundle } from './store.js';

export interface HandlerRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
  body?: unknown;
}

export interface HandlerResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ServerDeps {
  store: ContentStore;
  auth: TokenVerifier;
  /** Zod-shaped validator. Kept as a pluggable dep so tests don't bind to a specific schema version. */
  validate(
    body: unknown,
  ): { ok: true; value: unknown } | { ok: false; errors: Array<{ path: string; message: string }> };
  /** Wall-clock. Injectable for deterministic tests. */
  now?(): Date;
}

async function authorize(
  req: HandlerRequest,
  deps: ServerDeps,
  required: Scope,
): Promise<{ ok: true; subject: string } | { ok: false; response: HandlerResponse }> {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    return {
      ok: false,
      response: problem(401, {
        type: 'https://api.example.com/errors/unauthenticated',
        title: 'Missing bearer token',
        instance: req.path,
      }),
    };
  }
  const claims = await deps.auth.verify(token);
  if (!claims) {
    return {
      ok: false,
      response: problem(401, {
        type: 'https://api.example.com/errors/unauthenticated',
        title: 'Invalid bearer token',
        instance: req.path,
      }),
    };
  }
  if (!hasScope(claims, required)) {
    return {
      ok: false,
      response: problem(403, {
        type: 'https://api.example.com/errors/forbidden',
        title: 'Missing required scope',
        detail: `This endpoint requires ${required}`,
        instance: req.path,
      }),
    };
  }
  return { ok: true, subject: claims.subject };
}

export async function getContent(req: HandlerRequest, deps: ServerDeps): Promise<HandlerResponse> {
  const authz = await authorize(req, deps, 'content:read');
  if (!authz.ok) return authz.response;

  const product = req.params.product;
  if (!product) {
    return problem(400, { title: 'Missing :product path param', instance: req.path });
  }

  const bundle = await deps.store.getCurrent(product);
  if (!bundle) {
    return problem(404, {
      type: 'https://api.example.com/errors/not-found',
      title: 'No content bundle published for product',
      detail: `product=${product}`,
      instance: req.path,
    });
  }

  const serialised = JSON.stringify(bundle.body);
  const etag = computeEtag(serialised);
  if (ifNoneMatch(req.headers['if-none-match'], etag)) {
    return { status: 304, headers: { etag } };
  }

  return {
    status: 200,
    headers: {
      'content-type': 'application/json',
      etag,
      'cache-control': 'private, must-revalidate',
      'x-bundle-version': bundle.version,
      'x-bundle-published-at': bundle.publishedAt,
    },
    body: bundle.body,
  };
}

export async function getContentHistory(
  req: HandlerRequest,
  deps: ServerDeps,
): Promise<HandlerResponse> {
  const authz = await authorize(req, deps, 'content:read');
  if (!authz.ok) return authz.response;

  const product = req.params.product;
  if (!product) return problem(400, { title: 'Missing :product path param', instance: req.path });

  const limitRaw = req.query.limit ?? '20';
  const limit = Math.min(Math.max(Number.parseInt(limitRaw, 10) || 20, 1), 100);
  const cursor = req.query.cursor;

  const page = await deps.store.listHistory(product, limit, cursor);
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: {
      items: page.items.map((b) => ({
        version: b.version,
        publishedAt: b.publishedAt,
        publishedBy: b.publishedBy,
      })),
      nextCursor: page.nextCursor,
    },
  };
}

export async function publishContent(
  req: HandlerRequest,
  deps: ServerDeps,
): Promise<HandlerResponse> {
  const authz = await authorize(req, deps, 'content:write');
  if (!authz.ok) return authz.response;

  const product = req.params.product;
  if (!product) return problem(400, { title: 'Missing :product path param', instance: req.path });

  const payload = req.body as { body?: unknown; version?: string } | undefined;
  if (!payload || typeof payload !== 'object') {
    return problem(400, {
      title: 'Body must be an object with { body, version }',
      instance: req.path,
    });
  }

  const validation = deps.validate(payload.body);
  if (!validation.ok) {
    return {
      status: 422,
      headers: { 'content-type': 'application/problem+json' },
      body: {
        type: 'https://api.example.com/errors/validation',
        title: 'Content bundle failed validation',
        status: 422,
        detail: `${validation.errors.length} validation error(s)`,
        instance: req.path,
        validationErrors: validation.errors,
      },
    };
  }

  const now = (deps.now?.() ?? new Date()).toISOString();
  const bundle: ContentBundle = {
    product,
    body: validation.value,
    version: payload.version ?? now,
    publishedAt: now,
    publishedBy: authz.subject,
  };
  await deps.store.publish(bundle);
  return {
    status: 201,
    headers: { 'content-type': 'application/json' },
    body: {
      product,
      version: bundle.version,
      publishedAt: bundle.publishedAt,
      publishedBy: bundle.publishedBy,
    },
  };
}

/**
 * Reference forget-user handler. The reference server has no server-side
 * per-user store today, so this is a stub that echoes the receipt shape
 * from ADR-0005. Adopters replace this with a cascade into their real store.
 */
export async function forgetUser(req: HandlerRequest, deps: ServerDeps): Promise<HandlerResponse> {
  const authz = await authorize(req, deps, 'users:forget');
  if (!authz.ok) return authz.response;

  const userId = req.params.userId;
  if (!userId) return problem(400, { title: 'Missing :userId path param', instance: req.path });

  const now = (deps.now?.() ?? new Date()).toISOString();
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: {
      userId,
      requestedAt: now,
      requestedBy: authz.subject,
      cleared: {
        crossDeviceStore: 'no-op',
        localStorage: 'client-side, host must invoke Trainer.forgetUser()',
      },
    },
  };
}
