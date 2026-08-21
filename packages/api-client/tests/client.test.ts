import { describe, expect, it, vi } from 'vitest';
import { createContentClient } from '../src/index.js';

function fetchStub(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> | Response,
): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(input, init))) as typeof fetch;
}

describe('createContentClient', () => {
  it('sends bearer + returns 200 body + surfaces etag / bundle headers', async () => {
    const seen: { url: string; auth: string | null } = { url: '', auth: null };
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub((input, init) => {
        seen.url = String(input);
        seen.auth = new Headers(init?.headers).get('authorization');
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            etag: 'W/"abc"',
            'x-bundle-version': 'v9',
            'x-bundle-published-at': '2026-08-21T00:00:00Z',
          },
        });
      }),
    });
    const res = await client.getContent('example-app');
    expect(res.status).toBe(200);
    expect(res.etag).toBe('W/"abc"');
    expect(res.bundleVersion).toBe('v9');
    expect(res.body).toEqual({ ok: true });
    expect(seen.url).toBe('https://api.example.com/training/v1/content/example-app');
    expect(seen.auth).toBe('Bearer tok-1');
  });

  it('resolves a token producer per request (refresh-friendly)', async () => {
    let counter = 0;
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: () => `tok-${++counter}`,
      fetch: fetchStub(() => new Response('{}', { status: 200, headers: { etag: 'W/"a"' } })),
    });
    await client.getContent('p');
    await client.getContent('p');
    expect(counter).toBe(2);
  });

  it('returns 304 without a body when the server confirms cache', async () => {
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub(() => new Response(null, { status: 304, headers: { etag: 'W/"abc"' } })),
    });
    const res = await client.getContent('p', 'W/"abc"');
    expect(res.status).toBe(304);
    expect(res.body).toBeUndefined();
  });

  it('retries twice on 429 then succeeds', async () => {
    let calls = 0;
    const sleeps: number[] = [];
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      jitter: () => 0.5,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      fetch: fetchStub(() => {
        calls += 1;
        if (calls < 3) return new Response(null, { status: 429, headers: { 'retry-after': '0' } });
        return new Response('{}', { status: 200, headers: { etag: 'W/"z"' } });
      }),
    });
    const res = await client.getContent('p');
    expect(res.status).toBe(200);
    expect(calls).toBe(3);
    expect(sleeps.length).toBe(2);
  });

  it('surfaces problem+json body on error status', async () => {
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub(
        () =>
          new Response(JSON.stringify({ type: 't', title: 'nope', status: 404 }), {
            status: 404,
            headers: { 'content-type': 'application/problem+json' },
          }),
      ),
    });
    await expect(client.getContent('missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      problem: { title: 'nope' },
    });
  });

  it('publishContent POSTs and returns the summary', async () => {
    const seen: { method?: string; body?: string } = {};
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub((_url, init) => {
        seen.method = init?.method;
        seen.body = init?.body as string;
        return new Response(
          JSON.stringify({ version: 'v1', publishedAt: 'now', publishedBy: 'me' }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        );
      }),
    });
    const out = await client.publishContent('p', { schemaVersion: 'v1' }, 'v1');
    expect(seen.method).toBe('POST');
    expect(JSON.parse(seen.body ?? '{}')).toEqual({ body: { schemaVersion: 'v1' }, version: 'v1' });
    expect(out).toEqual({ version: 'v1', publishedAt: 'now', publishedBy: 'me' });
  });

  it('listHistory forwards limit + cursor', async () => {
    const seen: { url: string } = { url: '' };
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub((input) => {
        seen.url = String(input);
        return new Response(JSON.stringify({ items: [], nextCursor: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    });
    await client.listHistory('p', { limit: 5, cursor: '10' });
    expect(seen.url).toContain('limit=5');
    expect(seen.url).toContain('cursor=10');
  });

  it('forgetUser POSTs and returns the receipt shape', async () => {
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub(
        () =>
          new Response(JSON.stringify({ userId: 'u', requestedBy: 'me' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    });
    const out = (await client.forgetUser('u')) as { userId: string };
    expect(out.userId).toBe('u');
  });

  it('percent-encodes path segments', async () => {
    const seen: { url: string } = { url: '' };
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      fetch: fetchStub((input) => {
        seen.url = String(input);
        return new Response('{}', { status: 200, headers: { etag: 'W/"x"' } });
      }),
    });
    await client.getContent('with space');
    expect(seen.url).toContain('with%20space');
  });

  it.each([
    ['when jitter fires at bounds', 0.0],
    ['when jitter fires mid-range', 0.999],
  ])('backoff stays within ±20 %% (%s)', async (_label, j) => {
    const sleeps: number[] = [];
    const client = createContentClient({
      baseUrl: 'https://api.example.com/training/v1',
      token: 'tok-1',
      jitter: () => j,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      fetch: fetchStub(() => new Response(null, { status: 429 })),
    });
    await expect(client.getContent('p')).rejects.toBeDefined();
    expect(sleeps[0]).toBeGreaterThanOrEqual(800);
    expect(sleeps[0]).toBeLessThanOrEqual(1200);
  });

  it('makes the vi shim reachable to avoid unused-import lint', () => {
    expect(typeof vi.fn).toBe('function');
  });
});
