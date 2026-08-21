/**
 * @in-app-training/api-client
 *
 * Typed fetch client for the ADR-0007 REST API. Works in browser + Node 20+
 * (native `fetch`). Ships client-side exponential backoff on 429 per ADR
 * (1s → 30s ceiling, ±20% jitter). Consumers may inject `fetch` for tests.
 */

export interface ContentClientOptions {
  /** e.g. "https://api.example.com/training/v1" — no trailing slash. */
  baseUrl: string;
  /** Bearer token or a producer that returns one (for refresh-on-401 flows). */
  token: string | (() => string | Promise<string>);
  /** Injectable `fetch` — defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Injectable jitter source in [0, 1); tests pass a deterministic one. */
  jitter?: () => number;
  /** Backoff sleep, injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Cap on the retry-after wait when the header is present. Default: 30_000ms. */
  maxRetryAfterMs?: number;
}

export interface BundleSummary {
  version: string;
  publishedAt: string;
  publishedBy: string;
}

export interface GetContentResult {
  status: 200 | 304;
  etag: string;
  /** Present only on 200. */
  body?: unknown;
  bundleVersion?: string;
  bundlePublishedAt?: string;
}

export interface ApiError extends Error {
  status: number;
  problem?: unknown;
}

class ApiErrorImpl extends Error implements ApiError {
  status: number;
  problem?: unknown;
  constructor(status: number, message: string, problem?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export function createContentClient(opts: ContentClientOptions) {
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  const jitter = opts.jitter ?? Math.random;
  const sleep = opts.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const maxRetryAfterMs = opts.maxRetryAfterMs ?? 30_000;

  async function resolveToken(): Promise<string> {
    return typeof opts.token === 'function' ? await opts.token() : opts.token;
  }

  async function backoffOn429(attempt: number, retryAfter: string | null): Promise<void> {
    const headerMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : NaN;
    const base = Math.min(1000 * Math.pow(2, attempt), 30_000);
    const jittered = base * (0.8 + jitter() * 0.4);
    const target = Number.isFinite(headerMs) ? Math.min(headerMs, maxRetryAfterMs) : jittered;
    await sleep(target);
  }

  async function request(
    path: string,
    init: RequestInit & { skipRetry?: boolean } = {},
  ): Promise<Response> {
    const token = await resolveToken();
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${token}`);

    // Two retries on 429 (three total attempts) before surfacing to the caller.
    const maxAttempts = 3;
    let lastRes: Response | undefined;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const res = await fetchImpl(`${opts.baseUrl}${path}`, { ...init, headers });
      lastRes = res;
      if (res.status !== 429 || init.skipRetry) return res;
      if (attempt === maxAttempts - 1) return res;
      await backoffOn429(attempt, res.headers.get('retry-after'));
    }
    // Unreachable — the loop always returns — but TypeScript's control-flow
    // analysis can't prove it. Cast keeps the return type honest.
    return lastRes as Response;
  }

  async function toProblem(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return { title: res.statusText, status: res.status };
    }
  }

  return {
    /**
     * GET /content/:product with optional ETag. Returns { status: 304 } when the
     * server confirms our cached bundle is still current.
     */
    async getContent(product: string, ifNoneMatch?: string): Promise<GetContentResult> {
      const headers: Record<string, string> = {};
      if (ifNoneMatch) headers['if-none-match'] = ifNoneMatch;
      const res = await request(`/content/${encodeURIComponent(product)}`, { headers });
      const etag = res.headers.get('etag') ?? '';
      if (res.status === 304) return { status: 304, etag };
      if (res.status === 200) {
        return {
          status: 200,
          etag,
          body: await res.json(),
          bundleVersion: res.headers.get('x-bundle-version') ?? undefined,
          bundlePublishedAt: res.headers.get('x-bundle-published-at') ?? undefined,
        };
      }
      throw new ApiErrorImpl(res.status, `getContent failed: ${res.status}`, await toProblem(res));
    },

    async publishContent(product: string, body: unknown, version?: string): Promise<BundleSummary> {
      const res = await request(`/content/${encodeURIComponent(product)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body, version }),
      });
      if (res.status !== 201) {
        throw new ApiErrorImpl(
          res.status,
          `publishContent failed: ${res.status}`,
          await toProblem(res),
        );
      }
      return (await res.json()) as BundleSummary;
    },

    async listHistory(
      product: string,
      opts?: { limit?: number; cursor?: string },
    ): Promise<{
      items: BundleSummary[];
      nextCursor: string | null;
    }> {
      const params = new URLSearchParams();
      if (opts?.limit != null) params.set('limit', String(opts.limit));
      if (opts?.cursor) params.set('cursor', opts.cursor);
      const q = params.toString();
      const res = await request(
        `/content/${encodeURIComponent(product)}/history${q ? `?${q}` : ''}`,
      );
      if (res.status !== 200) {
        throw new ApiErrorImpl(
          res.status,
          `listHistory failed: ${res.status}`,
          await toProblem(res),
        );
      }
      return (await res.json()) as { items: BundleSummary[]; nextCursor: string | null };
    },

    async forgetUser(userId: string): Promise<unknown> {
      const res = await request(`/users/${encodeURIComponent(userId)}/forget`, { method: 'POST' });
      if (res.status !== 200) {
        throw new ApiErrorImpl(
          res.status,
          `forgetUser failed: ${res.status}`,
          await toProblem(res),
        );
      }
      return await res.json();
    },
  };
}

export type ContentClient = ReturnType<typeof createContentClient>;
