/**
 * Sprint 20 (T-290). Descriptions-only OpenAPI schema derived from
 * `TourSchema.shape`. Lives in the SDK so the api-server package
 * doesn't need to import from it at build time (build-order
 * dependency avoided).
 *
 * Coarse types on the top-level fields; discriminated unions render
 * as `type: object`. Zod stays the runtime source of truth. Not a
 * full schema generator — see the Sprint 19 retro for rationale.
 */

import type { z } from 'zod';
import { TourSchema } from './v1.js';

function coarseType(field: z.ZodTypeAny): string {
  const name = field._def?.typeName ?? 'unknown';
  switch (name) {
    case 'ZodString':
    case 'ZodEnum':
    case 'ZodLiteral':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
    case 'ZodRecord':
    case 'ZodDiscriminatedUnion':
      return 'object';
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return coarseType((field._def as { innerType: z.ZodTypeAny }).innerType);
    case 'ZodUnion':
      return 'string';
    default:
      return 'object';
  }
}

/**
 * Produce a descriptions-only OpenAPI schema block for a Tour bundle from
 * `TourSchema.shape`. Field presence is honest (required vs. optional);
 * types are coarse.
 *
 * Pass the result to `openapiSpec({ contentBundleSchema })` in
 * `@in-app-training/api-server`.
 */
export function describeBundleFromTourSchema(): Record<string, unknown> {
  const shape = TourSchema.shape as Record<string, z.ZodTypeAny>;
  const properties: Record<string, { type: string }> = {};
  const required: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    const isOptional =
      field._def?.typeName === 'ZodOptional' || field._def?.typeName === 'ZodDefault';
    properties[key] = { type: coarseType(field) };
    if (!isOptional) required.push(key);
  }
  return {
    description: 'Content bundle shape derived from @in-app-training/sdk TourSchema (v1).',
    type: 'object',
    properties,
    required,
  };
}
