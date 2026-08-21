/**
 * Sprint 18 (T-263). File-system-backed `ContentStore` reference.
 *
 * The in-memory store from Sprint 16 is fine for local dev and tests but
 * resets on restart. This one persists to a directory laid out as:
 *
 *   <root>/
 *     <product>/
 *       current.json           ← the live bundle summary + body
 *       history/
 *         <publishedAt>.json   ← one file per publish, filename is ISO timestamp
 *
 * Chosen because: no dependency added (uses Node's built-in `fs/promises`),
 * survives restart, easy to back up (git or a filesystem snapshot). Not for
 * multi-writer production — file locking is out of scope; adopters who need
 * more should plug their own DB-backed store against the same
 * `ContentStore` interface.
 *
 * The Sprint 18 T-263 decision doc summarises alternatives (SQLite,
 * Postgres, Redis). This is the reference; adopters pick.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContentBundle, ContentStore } from './store.js';

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function safeReaddir(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

function sanitiseSegment(s: string): string {
  // Only allow product slugs matching the SDK's convention. Anything else is
  // a bug in the caller — reject loudly so we never write outside `root`.
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(s)) {
    throw new Error(`Invalid product slug for FileContentStore: ${JSON.stringify(s)}`);
  }
  return s;
}

function historyFilename(publishedAt: string): string {
  // ISO-8601 has `:` which is invalid on Windows; use safe substitution.
  return `${publishedAt.replace(/:/g, '-')}.json`;
}

export interface FileContentStoreOptions {
  root: string;
}

export function createFileContentStore(opts: FileContentStoreOptions): ContentStore {
  const { root } = opts;

  function productDir(product: string): string {
    return join(root, sanitiseSegment(product));
  }
  function currentPath(product: string): string {
    return join(productDir(product), 'current.json');
  }
  function historyDir(product: string): string {
    return join(productDir(product), 'history');
  }

  return {
    async getCurrent(product) {
      return await readJson<ContentBundle>(currentPath(product));
    },

    async publish(bundle) {
      await ensureDir(historyDir(bundle.product));
      const historyFile = join(historyDir(bundle.product), historyFilename(bundle.publishedAt));
      const payload = JSON.stringify(bundle, null, 2);
      // Write history first, then flip `current.json` — a crash between the
      // two leaves history intact and the previous `current` still readable.
      await writeFile(historyFile, payload, 'utf-8');
      await writeFile(currentPath(bundle.product), payload, 'utf-8');
    },

    async listHistory(product, limit, cursor) {
      const entries = await safeReaddir(historyDir(product));
      // Filename sort in reverse chrono order — the sanitised ISO timestamp
      // (with `:` → `-`) preserves lexicographic ordering.
      entries.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
      const start = cursor ? Number(cursor) : 0;
      if (!Number.isFinite(start) || start < 0) {
        return { items: [], nextCursor: null };
      }
      const slice = entries.slice(start, start + limit);
      const items: ContentBundle[] = [];
      for (const name of slice) {
        const b = await readJson<ContentBundle>(join(historyDir(product), name));
        if (b) items.push(b);
      }
      const nextIndex = start + slice.length;
      const nextCursor = nextIndex < entries.length ? String(nextIndex) : null;
      return { items, nextCursor };
    },
  };
}
