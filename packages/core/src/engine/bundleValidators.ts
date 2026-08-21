/**
 * Sprint 18 (T-262). Reusable `BundleValidator`s for `RemoteContentSource`.
 *
 * `RemoteContentSource` is bundle-shaped, not tour-shaped — the same source
 * can host tours, pins, or a mixed bundle if the validator says so. These
 * helpers give hosts a paved path for the three cases without having to
 * hand-wire Zod every time.
 *
 * Reports (Adopter Product C) uses `pinsBundleValidator()` — the Sprint 17
 * retro surfaced the ask.
 */

import { TourSchema, PinsFileSchema, type Tour, type PinsFile } from '../schema/v1.js';
import type { BundleValidator, ValidatorFailure, ValidatorResult } from './RemoteContentSource.js';

function fail(reason: ValidatorFailure['reason'], message: string): ValidatorFailure {
  return { ok: false, reason, message };
}

function ok<T>(value: T): ValidatorResult {
  return { ok: true, value };
}

/**
 * Accepts a bundle shaped like `Tour[]` or `{ tours: Tour[] }`. The plain-array
 * form matches what the reference `api-server` returns from `GET /content/:product`
 * when the store holds tours-only. The wrapped form leaves room for a mixed bundle.
 */
export function toursBundleValidator(): BundleValidator {
  return (bundle) => {
    const candidate: unknown = Array.isArray(bundle)
      ? bundle
      : (bundle as { tours?: unknown } | null)?.tours;
    if (!Array.isArray(candidate)) {
      return fail('validation', 'Expected an array of Tour or an object with a `tours` array');
    }
    const parsed = TourSchema.array().safeParse(candidate);
    return parsed.success
      ? ok<Tour[]>(parsed.data)
      : fail('validation', parsed.error.issues[0]?.message ?? 'Tour validation failed');
  };
}

/**
 * Accepts a `PinsFile` object per `schema/v1`. Reports's first bundle is
 * pins-only; this is the validator they wire.
 */
export function pinsBundleValidator(): BundleValidator {
  return (bundle) => {
    const parsed = PinsFileSchema.safeParse(bundle);
    return parsed.success
      ? ok<PinsFile>(parsed.data)
      : fail('validation', parsed.error.issues[0]?.message ?? 'Pins validation failed');
  };
}

/**
 * A composed validator: accepts either shape and returns `{ tours?, pins? }`.
 * Useful when a single bundle URL is expected to eventually carry both.
 */
export function mixedBundleValidator(): BundleValidator {
  return (bundle) => {
    if (!bundle || typeof bundle !== 'object') {
      return fail('validation', 'Expected an object with `tours` and/or `pins`');
    }
    const b = bundle as { tours?: unknown; pins?: unknown };
    const out: { tours?: Tour[]; pins?: PinsFile } = {};
    if (b.tours !== undefined) {
      const t = TourSchema.array().safeParse(b.tours);
      if (!t.success) return fail('validation', t.error.issues[0]?.message ?? 'Bad tours');
      out.tours = t.data;
    }
    if (b.pins !== undefined) {
      const p = PinsFileSchema.safeParse(b);
      if (!p.success) return fail('validation', p.error.issues[0]?.message ?? 'Bad pins');
      out.pins = p.data;
    }
    if (out.tours === undefined && out.pins === undefined) {
      return fail('validation', 'Bundle contained neither `tours` nor `pins`');
    }
    return ok<{ tours?: Tour[]; pins?: PinsFile }>(out);
  };
}
