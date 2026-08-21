/**
 * RFC 7807 problem+json helpers — per ADR-0007.
 *
 * Every error response from the reference server uses this shape. The
 * `validationErrors[]` extension appears only on Zod failures at
 * publish-time so publish clients get actionable messages.
 */

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  validationErrors?: Array<{ path: string; message: string }>;
}

const CONTENT_TYPE = 'application/problem+json';

export function problem(
  status: number,
  opts: Partial<Problem>,
): {
  status: number;
  headers: Record<string, string>;
  body: Problem;
} {
  const body: Problem = {
    type: opts.type ?? 'about:blank',
    title: opts.title ?? 'Error',
    status,
    detail: opts.detail,
    instance: opts.instance,
    validationErrors: opts.validationErrors,
  };
  return {
    status,
    headers: { 'content-type': CONTENT_TYPE },
    body,
  };
}
