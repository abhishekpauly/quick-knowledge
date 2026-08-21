/**
 * ContentStore — the interface adopters plug their own persistence into.
 *
 * The reference server ships with an in-memory implementation used by tests
 * and local development. Production adopters wire a database-backed store
 * that satisfies the same contract.
 */

export interface ContentBundle {
  /** Product slug — matches the URL param. */
  product: string;
  /** Content bundle body — validated against @in-app-training/sdk/schema/v1 before storage. */
  body: unknown;
  /** Publisher-supplied version tag (e.g. git SHA). Used only for audit. */
  version: string;
  /** ISO-8601 UTC timestamp of publish. */
  publishedAt: string;
  /** Bearer-token subject that published this bundle. */
  publishedBy: string;
}

export interface ContentStore {
  getCurrent(product: string): Promise<ContentBundle | null>;
  publish(bundle: ContentBundle): Promise<void>;
  listHistory(
    product: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    items: ContentBundle[];
    nextCursor: string | null;
  }>;
}

/**
 * In-memory reference implementation. Not for production — resets on restart,
 * no cross-instance replication. Ships to make tests and local dev trivial.
 */
export function createInMemoryContentStore(): ContentStore {
  const current = new Map<string, ContentBundle>();
  const history = new Map<string, ContentBundle[]>();

  return {
    async getCurrent(product) {
      return current.get(product) ?? null;
    },
    async publish(bundle) {
      current.set(bundle.product, bundle);
      const list = history.get(bundle.product) ?? [];
      list.unshift(bundle);
      history.set(bundle.product, list);
    },
    async listHistory(product, limit, cursor) {
      const list = history.get(product) ?? [];
      const start = cursor ? Number(cursor) : 0;
      if (!Number.isFinite(start) || start < 0) {
        return { items: [], nextCursor: null };
      }
      const items = list.slice(start, start + limit);
      const nextIndex = start + items.length;
      const nextCursor = nextIndex < list.length ? String(nextIndex) : null;
      return { items, nextCursor };
    },
  };
}
