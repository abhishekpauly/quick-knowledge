import { describe, expect, it } from 'vitest';
import { RemoteContentSource } from '../src/engine/RemoteContentSource.js';
import type {
  RemoteContentClient,
  BundleValidator,
} from '../src/engine/RemoteContentSource.js';
import { memoryPersistence } from '../src/adapters/persistence.js';
import type { TrainingEvent } from '../src/engine/events.js';

interface ClientResponse {
  status: 200 | 304 | 500;
  etag?: string;
  body?: unknown;
  bundleVersion?: string;
  throwError?: string;
}

function scriptedClient(responses: ClientResponse[]): {
  client: RemoteContentClient;
  calls: Array<{ product: string; ifNoneMatch?: string }>;
} {
  const calls: Array<{ product: string; ifNoneMatch?: string }> = [];
  let i = 0;
  const client: RemoteContentClient = {
    async getContent(product, ifNoneMatch) {
      calls.push({ product, ifNoneMatch });
      const r = responses[Math.min(i, responses.length - 1)] ?? { status: 500 };
      i += 1;
      if (r.throwError) throw new Error(r.throwError);
      return {
        status: r.status as 200 | 304,
        etag: r.etag ?? '',
        body: r.body,
        bundleVersion: r.bundleVersion,
      };
    },
  };
  return { client, calls };
}

/** Never-firing scheduler — tests drive refresh via `refreshNow()`. */
const noopScheduler = {
  set: () => 0 as unknown,
  clear: () => {},
};

const accept: BundleValidator = (body) => ({ ok: true, value: body });
const rejectValidation: BundleValidator = () => ({
  ok: false,
  reason: 'validation',
  message: 'nope',
});
const rejectSchemaVersion: BundleValidator = () => ({
  ok: false,
  reason: 'schema-version-mismatch',
  message: 'want v2',
});

function collector(): { events: TrainingEvent[]; listener: (e: TrainingEvent) => void } {
  const events: TrainingEvent[] = [];
  return { events, listener: (e) => events.push(e) };
}

describe('RemoteContentSource', () => {
  it('boot with cache: serves cached bundle immediately, 304 → no swap, no emit', async () => {
    const persistence = memoryPersistence();
    await persistence.set('content-bundle:example-app', {
      body: { schemaVersion: 'v1', tag: 'cached' },
      etag: 'W/"cached"',
      version: 'v-cache',
    });
    const { client, calls } = scriptedClient([{ status: 304, etag: 'W/"cached"' }]);
    const src = new RemoteContentSource({
      product: 'example-app',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(src.snapshot()?.etag).toBe('W/"cached"');
    expect(calls[0]?.ifNoneMatch).toBe('W/"cached"');
    expect(events).toHaveLength(0);
  });

  it('boot with cache: 200 → validates, swaps, emits content_bundle_updated with prevEtag', async () => {
    const persistence = memoryPersistence();
    await persistence.set('content-bundle:example-app', {
      body: { old: true },
      etag: 'W/"old"',
    });
    const { client } = scriptedClient([
      { status: 200, etag: 'W/"new"', body: { new: true }, bundleVersion: 'v-new' },
    ]);
    const src = new RemoteContentSource({
      product: 'example-app',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
      now: () => new Date('2026-08-21T00:00:00Z'),
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(src.snapshot()?.etag).toBe('W/"new"');
    expect(events).toHaveLength(1);
    const [ev] = events;
    if (!ev || ev.name !== 'content_bundle_updated') throw new Error('wrong event');
    expect(ev.payload.etag).toBe('W/"new"');
    expect(ev.payload.prevEtag).toBe('W/"old"');
    expect(ev.payload.version).toBe('v-new');
    expect(ev.payload.timestamp).toBe('2026-08-21T00:00:00.000Z');
    // Persistence updated.
    const persisted = (await persistence.get('content-bundle:example-app')) as { etag: string };
    expect(persisted.etag).toBe('W/"new"');
  });

  it('cold boot with no cache: blocks on first fetch and emits when it lands', async () => {
    const persistence = memoryPersistence();
    const { client } = scriptedClient([
      { status: 200, etag: 'W/"first"', body: { first: true } },
    ]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(src.snapshot()?.etag).toBe('W/"first"');
    expect(events).toHaveLength(1);
  });

  it('emits content_bundle_update_failed with reason=network on client throw', async () => {
    const persistence = memoryPersistence();
    const { client } = scriptedClient([{ status: 200, throwError: 'offline' }]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(events).toHaveLength(1);
    const [ev] = events;
    if (!ev || ev.name !== 'content_bundle_update_failed') throw new Error('wrong event');
    expect(ev.payload.reason).toBe('network');
    expect(ev.payload.message).toBe('offline');
    expect(src.snapshot()).toBeNull();
  });

  it('emits validation failure and does NOT swap', async () => {
    const persistence = memoryPersistence();
    await persistence.set('content-bundle:p', { body: { keep: true }, etag: 'W/"keep"' });
    const { client } = scriptedClient([
      { status: 200, etag: 'W/"bad"', body: { bad: true } },
    ]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: rejectValidation,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(src.snapshot()?.etag).toBe('W/"keep"');
    const [ev] = events;
    if (!ev || ev.name !== 'content_bundle_update_failed') throw new Error('wrong event');
    expect(ev.payload.reason).toBe('validation');
  });

  it('schema-version mismatch hard-refuses the swap', async () => {
    const persistence = memoryPersistence();
    await persistence.set('content-bundle:p', { body: { old: true }, etag: 'W/"old"' });
    const { client } = scriptedClient([
      { status: 200, etag: 'W/"v2"', body: { schemaVersion: 'v2' } },
    ]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: rejectSchemaVersion,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    expect(src.snapshot()?.etag).toBe('W/"old"');
    const [ev] = events;
    if (!ev || ev.name !== 'content_bundle_update_failed') throw new Error('wrong event');
    expect(ev.payload.reason).toBe('schema-version-mismatch');
  });

  it('boot timeout emits timeout failure but still serves whatever the cache had', async () => {
    const persistence = memoryPersistence();
    await persistence.set('content-bundle:p', { body: { cached: true }, etag: 'W/"c"' });
    let neverResolve: (v: never) => void = () => {};
    const client: RemoteContentClient = {
      getContent: () =>
        new Promise((_r, rej) => {
          neverResolve = rej as (v: never) => void;
        }),
    };
    // Real setTimeout for the boot-timeout race; no recurring poll fires because
    // the recurring scheduler uses the same set() which we cancel via stop().
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      bootBlocking: true,
      bootTimeoutMs: 5,
    });
    const { events, listener } = collector();
    src.on(listener);
    await src.start();
    src.stop();
    neverResolve(new Error('cleanup') as unknown as never);
    expect(events.some((e) => e.name === 'content_bundle_update_failed')).toBe(true);
    expect(src.snapshot()?.etag).toBe('W/"c"');
  });

  it('refreshNow is single-flight — concurrent calls share one in-flight fetch', async () => {
    const persistence = memoryPersistence();
    let inFlight = 0;
    let maxInFlight = 0;
    const client: RemoteContentClient = {
      async getContent() {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise<void>((r) => setTimeout(r, 5));
        inFlight -= 1;
        return { status: 200, etag: 'W/"x"', body: {} };
      },
    };
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    await Promise.all([src.refreshNow(), src.refreshNow(), src.refreshNow()]);
    expect(maxInFlight).toBe(1);
  });

  it('listener errors do not break subsequent listeners', async () => {
    const persistence = memoryPersistence();
    const { client } = scriptedClient([{ status: 200, etag: 'W/"x"', body: {} }]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    let goodCalled = false;
    src.on(() => {
      throw new Error('bad listener');
    });
    src.on(() => {
      goodCalled = true;
    });
    await src.refreshNow();
    expect(goodCalled).toBe(true);
  });

  it('pollMs enforces the 30 000 ms floor', () => {
    // Reflect the private opts via a dry construction: run one refreshNow with
    // a scripted client, then measure that the second refresh only happens
    // when the scheduler is asked with the floored value.
    const set = ((_fn: () => void, ms: number) => ms) as unknown as (
      fn: () => void,
      ms: number,
    ) => unknown;
    const seen: number[] = [];
    const scheduler = {
      set: (fn: () => void, ms: number) => {
        seen.push(ms);
        return set(fn, ms);
      },
      clear: () => {},
    };
    const src = new RemoteContentSource({
      product: 'p',
      client: scriptedClient([{ status: 304, etag: 'W/"x"' }]).client,
      persistence: memoryPersistence(),
      validate: accept,
      pollMs: 500, // below the floor
      scheduler,
    });
    return src.start().then(() => {
      src.stop();
      expect(seen.some((ms) => ms >= 30_000)).toBe(true);
    });
  });

  it('unsubscribe stops future events reaching the listener', async () => {
    const persistence = memoryPersistence();
    const { client } = scriptedClient([
      { status: 200, etag: 'W/"a"', body: {} },
      { status: 200, etag: 'W/"b"', body: {} },
    ]);
    const src = new RemoteContentSource({
      product: 'p',
      client,
      persistence,
      validate: accept,
      scheduler: noopScheduler,
    });
    const { events, listener } = collector();
    const off = src.on(listener);
    await src.refreshNow();
    off();
    await src.refreshNow();
    expect(events).toHaveLength(1);
  });
});
