import { describe, expect, it } from 'vitest';
import {
  forgetUser,
  getContent,
  getContentHistory,
  publishContent,
  type HandlerRequest,
  type ServerDeps,
} from '../src/handlers.js';
import { createInMemoryContentStore } from '../src/store.js';
import type { TokenClaims, TokenVerifier, Scope } from '../src/auth.js';

function makeAuth(claims: Record<string, TokenClaims>): TokenVerifier {
  return {
    async verify(token) {
      return claims[token] ?? null;
    },
  };
}

function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

function makeDeps(scopes: Scope[]): ServerDeps {
  return {
    store: createInMemoryContentStore(),
    auth: makeAuth({ 'good-token': { subject: 'test-subject', scopes } }),
    validate(body) {
      if (typeof body !== 'object' || body === null) {
        return { ok: false, errors: [{ path: '', message: 'must be an object' }] };
      }
      return { ok: true, value: body };
    },
    now: () => new Date('2026-08-21T00:00:00Z'),
  };
}

function req(overrides: Partial<HandlerRequest>): HandlerRequest {
  return {
    method: overrides.method ?? 'GET',
    path: overrides.path ?? '/',
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    headers: overrides.headers ?? {},
    body: overrides.body,
  };
}

describe('auth gating', () => {
  it('401 without token', async () => {
    const deps = makeDeps(['content:read']);
    const res = await getContent(req({ params: { product: 'p' } }), deps);
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toBe('application/problem+json');
  });

  it('401 with unknown token', async () => {
    const deps = makeDeps(['content:read']);
    const res = await getContent(req({ params: { product: 'p' }, headers: bearer('nope') }), deps);
    expect(res.status).toBe(401);
  });

  it('403 when scope is missing', async () => {
    const deps = makeDeps(['users:forget']);
    const res = await getContent(
      req({ params: { product: 'p' }, headers: bearer('good-token') }),
      deps,
    );
    expect(res.status).toBe(403);
  });
});

describe('GET /content/:product', () => {
  it('404 when nothing published', async () => {
    const deps = makeDeps(['content:read']);
    const res = await getContent(
      req({ params: { product: 'example-app' }, headers: bearer('good-token') }),
      deps,
    );
    expect(res.status).toBe(404);
  });

  it('200 with etag when published, then 304 on matching If-None-Match', async () => {
    const deps = makeDeps(['content:read', 'content:write']);
    await publishContent(
      req({
        method: 'POST',
        params: { product: 'example-app' },
        body: { body: { schemaVersion: 'v1', tours: [] }, version: 'v42' },
        headers: bearer('good-token'),
      }),
      deps,
    );
    const first = await getContent(
      req({ params: { product: 'example-app' }, headers: bearer('good-token') }),
      deps,
    );
    expect(first.status).toBe(200);
    expect(first.headers.etag).toMatch(/^W\/".+"$/);
    expect(first.headers['x-bundle-version']).toBe('v42');

    const second = await getContent(
      req({
        params: { product: 'example-app' },
        headers: { ...bearer('good-token'), 'if-none-match': first.headers.etag },
      }),
      deps,
    );
    expect(second.status).toBe(304);
    expect(second.body).toBeUndefined();
  });

  it('respects wildcard If-None-Match', async () => {
    const deps = makeDeps(['content:read', 'content:write']);
    await publishContent(
      req({
        params: { product: 'p' },
        body: { body: { schemaVersion: 'v1', tours: [] } },
        headers: bearer('good-token'),
      }),
      deps,
    );
    const res = await getContent(
      req({
        params: { product: 'p' },
        headers: { ...bearer('good-token'), 'if-none-match': '*' },
      }),
      deps,
    );
    expect(res.status).toBe(304);
  });
});

describe('POST /content/:product', () => {
  it('422 with validationErrors on bad body', async () => {
    const deps = makeDeps(['content:write']);
    const res = await publishContent(
      req({
        params: { product: 'p' },
        body: { body: null },
        headers: bearer('good-token'),
      }),
      deps,
    );
    expect(res.status).toBe(422);
    const body = res.body as { validationErrors: unknown[] };
    expect(body.validationErrors.length).toBeGreaterThan(0);
  });

  it('201 stamps publishedBy from the token subject', async () => {
    const deps = makeDeps(['content:write']);
    const res = await publishContent(
      req({
        params: { product: 'p' },
        body: { body: { schemaVersion: 'v1' } },
        headers: bearer('good-token'),
      }),
      deps,
    );
    expect(res.status).toBe(201);
    const body = res.body as { publishedBy: string; publishedAt: string };
    expect(body.publishedBy).toBe('test-subject');
    expect(body.publishedAt).toBe('2026-08-21T00:00:00.000Z');
  });
});

describe('GET /content/:product/history', () => {
  it('paginates and clamps limit', async () => {
    const deps = makeDeps(['content:read', 'content:write']);
    for (let i = 0; i < 5; i++) {
      await publishContent(
        req({
          params: { product: 'p' },
          body: { body: { schemaVersion: 'v1' }, version: `v${i}` },
          headers: bearer('good-token'),
        }),
        deps,
      );
    }
    const page = await getContentHistory(
      req({ params: { product: 'p' }, query: { limit: '2' }, headers: bearer('good-token') }),
      deps,
    );
    expect(page.status).toBe(200);
    const body = page.body as { items: unknown[]; nextCursor: string | null };
    expect(body.items.length).toBe(2);
    expect(body.nextCursor).toBe('2');
  });
});

describe('missing path params', () => {
  it('getContent 400 when :product is empty', async () => {
    const deps = makeDeps(['content:read']);
    const res = await getContent(req({ params: {}, headers: bearer('good-token') }), deps);
    expect(res.status).toBe(400);
  });

  it('publishContent 400 when :product is empty', async () => {
    const deps = makeDeps(['content:write']);
    const res = await publishContent(
      req({ params: {}, body: { body: {} }, headers: bearer('good-token') }),
      deps,
    );
    expect(res.status).toBe(400);
  });

  it('publishContent 400 when body is not an object', async () => {
    const deps = makeDeps(['content:write']);
    const res = await publishContent(
      req({ params: { product: 'p' }, headers: bearer('good-token') }),
      deps,
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /users/:userId/forget', () => {
  it('echoes receipt on the users:forget scope', async () => {
    const deps = makeDeps(['users:forget']);
    const res = await forgetUser(
      req({ params: { userId: 'u-42' }, headers: bearer('good-token') }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = res.body as { userId: string; requestedBy: string };
    expect(body.userId).toBe('u-42');
    expect(body.requestedBy).toBe('test-subject');
  });
});
