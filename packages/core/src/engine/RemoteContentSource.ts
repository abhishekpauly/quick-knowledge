/**
 * RemoteContentSource — Sprint 17 (ADR-0008).
 *
 * Boots from the last-known-good bundle in `Persistence`, refreshes in the
 * background via a caller-supplied client (typically `@in-app-training/api-client`),
 * validates every fresh bundle, atomically swaps, and emits lifecycle events.
 *
 * Standalone by design: this class owns fetch + cache + swap, not tour
 * execution. Trainer integration (`Trainer.replaceTours()` + trigger remount)
 * is filed as T-260 for Sprint 18 so this ships without touching the engine.
 */

import type { Persistence } from '../adapters/persistence.js';
import type {
  ContentBundleUpdatedPayload,
  ContentBundleUpdateFailedPayload,
  EventListener,
  TrainingEvent,
} from './events.js';

/**
 * Whatever the SDK considers a valid content bundle. Kept opaque here — the
 * caller-supplied validator is the source of truth (`packages/core/src/schema`
 * for the SDK's own use; a Zod schema in the reference server).
 */
export type ContentBundle = unknown;

export interface RemoteContentClient {
  getContent(
    product: string,
    ifNoneMatch?: string,
  ): Promise<{
    status: 200 | 304;
    etag: string;
    body?: ContentBundle;
    bundleVersion?: string;
  }>;
}

export interface ValidatorResult {
  ok: true;
  value: ContentBundle;
}

export interface ValidatorFailure {
  ok: false;
  reason: 'validation' | 'schema-version-mismatch';
  message: string;
}

export interface BundleValidator {
  (bundle: ContentBundle): ValidatorResult | ValidatorFailure;
}

export interface RemoteContentSourceOptions {
  product: string;
  client: RemoteContentClient;
  persistence: Persistence;
  validate: BundleValidator;
  /** Background refresh interval. Default 5 minutes; minimum 30 000 ms. */
  pollMs?: number;
  /** Cold-boot timeout when no cache is present. Default 3 000 ms. */
  bootTimeoutMs?: number;
  /** If true, `start()` awaits the first fetch (subject to bootTimeoutMs). Default: block when no cache, otherwise non-blocking. */
  bootBlocking?: boolean;
  /** Wall-clock. Injectable for deterministic tests. */
  now?: () => Date;
  /** setTimeout / clearTimeout — injectable for tests. */
  scheduler?: {
    set: (fn: () => void, ms: number) => unknown;
    clear: (handle: unknown) => void;
  };
}

interface StoredBundle {
  body: ContentBundle;
  etag: string;
  version?: string;
}

const CACHE_KEY_PREFIX = 'content-bundle';

function cacheKey(product: string): string {
  return `${CACHE_KEY_PREFIX}:${product}`;
}

export class RemoteContentSource {
  private readonly opts: Required<
    Omit<RemoteContentSourceOptions, 'bootBlocking' | 'scheduler' | 'now'>
  > & {
    bootBlocking?: boolean;
    scheduler?: RemoteContentSourceOptions['scheduler'];
    now: () => Date;
  };
  private readonly listeners = new Set<EventListener>();
  private current: StoredBundle | null = null;
  private refreshHandle: unknown = null;
  private stopped = false;
  private inFlight: Promise<void> | null = null;

  constructor(options: RemoteContentSourceOptions) {
    const pollMs = Math.max(options.pollMs ?? 300_000, 30_000);
    this.opts = {
      product: options.product,
      client: options.client,
      persistence: options.persistence,
      validate: options.validate,
      pollMs,
      bootTimeoutMs: options.bootTimeoutMs ?? 3_000,
      bootBlocking: options.bootBlocking,
      scheduler: options.scheduler,
      now: options.now ?? (() => new Date()),
    };
  }

  /** Snapshot of the current live bundle, or null before the first successful fetch. */
  snapshot(): { body: ContentBundle; etag: string; version?: string } | null {
    return this.current
      ? { body: this.current.body, etag: this.current.etag, version: this.current.version }
      : null;
  }

  /** Subscribe to `content_bundle_updated` / `content_bundle_update_failed`. */
  on(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start the source: read the cache, do the first fetch (blocking or not),
   * then schedule the recurring refresh.
   */
  async start(): Promise<void> {
    await this.hydrateFromCache();
    const blocking = this.opts.bootBlocking ?? this.current === null;
    if (blocking) {
      await this.refreshWithTimeout();
    } else {
      // Fire-and-forget the first refresh so `start()` returns immediately.
      void this.refreshWithTimeout();
    }
    this.scheduleNext();
  }

  stop(): void {
    this.stopped = true;
    this.cancelScheduled();
  }

  /** Force a refresh outside of the poll cadence — used by tests and hot triggers. */
  async refreshNow(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.doRefresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async hydrateFromCache(): Promise<void> {
    const cached = await this.opts.persistence.get(cacheKey(this.opts.product));
    if (!cached || typeof cached !== 'object') return;
    const c = cached as Partial<StoredBundle>;
    if (typeof c.etag !== 'string' || !('body' in c)) return;
    this.current = { body: c.body as ContentBundle, etag: c.etag, version: c.version };
  }

  private async refreshWithTimeout(): Promise<void> {
    const timeoutMs = this.opts.bootTimeoutMs;
    let timer: unknown;
    const timeout = new Promise<'timeout'>((resolve) => {
      const set = this.opts.scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms));
      timer = set(() => resolve('timeout'), timeoutMs);
    });
    const outcome = await Promise.race([this.refreshNow().then(() => 'done' as const), timeout]);
    const clear = this.opts.scheduler?.clear ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
    clear(timer);
    if (outcome === 'timeout') {
      this.emitFailure('timeout', `Boot fetch exceeded ${timeoutMs}ms`);
    }
  }

  private async doRefresh(): Promise<void> {
    let response: Awaited<ReturnType<RemoteContentClient['getContent']>>;
    try {
      response = await this.opts.client.getContent(this.opts.product, this.current?.etag);
    } catch (err) {
      this.emitFailure('network', err instanceof Error ? err.message : String(err));
      return;
    }

    if (response.status === 304) {
      return;
    }

    if (response.status !== 200 || response.body === undefined) {
      this.emitFailure('network', `Unexpected status ${response.status}`);
      return;
    }

    const validation = this.opts.validate(response.body);
    if (!validation.ok) {
      this.emitFailure(validation.reason, validation.message);
      return;
    }

    const prevEtag = this.current?.etag;
    const next: StoredBundle = {
      body: validation.value,
      etag: response.etag,
      version: response.bundleVersion,
    };
    this.current = next;

    try {
      await this.opts.persistence.set(cacheKey(this.opts.product), next);
    } catch {
      // Persistence failure does not abort the swap — the swap already happened
      // in memory. The next refresh will retry the write.
    }

    const payload: ContentBundleUpdatedPayload = {
      product: this.opts.product,
      version: next.version ?? '',
      etag: next.etag,
      prevEtag,
      timestamp: this.opts.now().toISOString(),
    };
    this.emit({ name: 'content_bundle_updated', payload });
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    const set = this.opts.scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms));
    this.refreshHandle = set(() => {
      this.refreshHandle = null;
      void this.refreshNow().finally(() => this.scheduleNext());
    }, this.opts.pollMs);
  }

  private cancelScheduled(): void {
    if (this.refreshHandle == null) return;
    const clear = this.opts.scheduler?.clear ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
    clear(this.refreshHandle);
    this.refreshHandle = null;
  }

  private emitFailure(reason: ContentBundleUpdateFailedPayload['reason'], message: string): void {
    const payload: ContentBundleUpdateFailedPayload = {
      product: this.opts.product,
      reason,
      message,
      timestamp: this.opts.now().toISOString(),
    };
    this.emit({ name: 'content_bundle_update_failed', payload });
  }

  private emit(event: TrainingEvent): void {
    for (const listener of this.listeners) {
      try {
        (listener as EventListener)(event);
      } catch {
        // Listener errors must never break the refresh loop.
      }
    }
  }
}
