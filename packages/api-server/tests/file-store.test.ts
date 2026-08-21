import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFileContentStore } from '../src/fileStore.js';
import type { ContentBundle } from '../src/store.js';

function bundle(overrides: Partial<ContentBundle> = {}): ContentBundle {
  return {
    product: 'example-app',
    body: { schemaVersion: 'v1', marker: overrides.version ?? 'v1' },
    version: 'v1',
    publishedAt: '2026-08-21T00:00:00.000Z',
    publishedBy: 'test',
    ...overrides,
  };
}

async function makeTmp(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'in-app-training-fs-store-'));
}

describe('createFileContentStore', () => {
  let root: string;

  beforeEach(async () => {
    root = await makeTmp();
    return async () => {
      await rm(root, { recursive: true, force: true });
    };
  });

  it('returns null before anything is published', async () => {
    const store = createFileContentStore({ root });
    expect(await store.getCurrent('example-app')).toBeNull();
  });

  it('writes current + history, then reads them back', async () => {
    const store = createFileContentStore({ root });
    const first = bundle({ version: 'v1', publishedAt: '2026-08-21T00:00:00.000Z' });
    const second = bundle({ version: 'v2', publishedAt: '2026-08-21T00:00:01.000Z' });
    await store.publish(first);
    await store.publish(second);

    const current = await store.getCurrent('example-app');
    expect(current?.version).toBe('v2');

    const page = await store.listHistory('example-app', 10);
    expect(page.items.map((b) => b.version)).toEqual(['v2', 'v1']);
    expect(page.nextCursor).toBeNull();
  });

  it('paginates with cursor', async () => {
    const store = createFileContentStore({ root });
    for (let i = 0; i < 5; i++) {
      await store.publish(
        bundle({
          version: `v${i}`,
          publishedAt: `2026-08-21T00:00:0${i}.000Z`,
        }),
      );
    }
    const first = await store.listHistory('example-app', 2);
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBe('2');
    const second = await store.listHistory('example-app', 2, first.nextCursor ?? undefined);
    expect(second.items).toHaveLength(2);
    expect(second.nextCursor).toBe('4');
    const third = await store.listHistory('example-app', 2, second.nextCursor ?? undefined);
    expect(third.items).toHaveLength(1);
    expect(third.nextCursor).toBeNull();
  });

  it('returns an empty page when the cursor is bogus', async () => {
    const store = createFileContentStore({ root });
    await store.publish(bundle());
    const page = await store.listHistory('example-app', 5, 'not-a-number');
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('rejects a path-traversing product slug', async () => {
    const store = createFileContentStore({ root });
    await expect(store.getCurrent('../etc/passwd')).rejects.toThrow(/Invalid product slug/);
    await expect(store.publish(bundle({ product: '../evil' }))).rejects.toThrow(
      /Invalid product slug/,
    );
  });

  it('history is unaffected when a product has never published', async () => {
    const store = createFileContentStore({ root });
    const page = await store.listHistory('empty-product', 10);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
