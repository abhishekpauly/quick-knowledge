import { createHash } from 'node:crypto';

/**
 * Weak ETag for a content bundle. FNV-style would be enough for equality but
 * we use SHA-256 truncated to 16 hex chars so operators can pattern-match
 * bundle identity in logs without extra plumbing. Weak (`W/"…"`) because we
 * do not guarantee byte-for-byte identity across proxies — only semantic
 * equality of the serialised bundle.
 */
export function computeEtag(body: string): string {
  const digest = createHash('sha256').update(body).digest('hex').slice(0, 16);
  return `W/"${digest}"`;
}

/** RFC 7232 §3.2 If-None-Match: any of the client's tags may match ours. */
export function ifNoneMatch(header: string | undefined, etag: string): boolean {
  if (!header) return false;
  return header
    .split(',')
    .map((t) => t.trim())
    .some((t) => t === etag || t === '*');
}
