/**
 * Permalink support — a URL param that deep-links into a tour, bypassing all
 * triggers, audience, frequency, and prerequisite gates.
 *
 * Format: `?training=<tour-id>` on any page load.
 * Optional: `?training=<tour-id>&trainingBypass=1` (kept as future switch to
 *   distinguish "start the tour and skip prereqs" from "start only if eligible").
 *   MVP: presence of `?training=` implies full bypass.
 *
 * Use cases:
 * - QA: share a link to test a specific tour.
 * - Support: send a customer a link that reproduces their reported flow.
 * - Sales demos: consistent tour trigger regardless of user state.
 *
 * Deliberately simple. If needs signed permalinks (to prevent tampering)
 * or scoped permalinks (only for support agents), extend in v0.5.
 */

const PERMALINK_PARAM = 'training';

export function readPermalinkTourId(
  url: string | URL = typeof window !== 'undefined' ? window.location.href : '',
): string | null {
  if (!url) return null;
  try {
    const parsed = typeof url === 'string' ? new URL(url) : url;
    const value = parsed.searchParams.get(PERMALINK_PARAM);
    if (!value) return null;
    // Validate shape — matches kebab-case tour ids.
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) return null;
    return value;
  } catch {
    return null;
  }
}
