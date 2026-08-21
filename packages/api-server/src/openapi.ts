/**
 * OpenAPI 3.1 spec for the reference API.
 *
 * Hand-written envelope + `describeBundleFromTourSchema()` for the
 * `ContentBundle` block. Sprint 20 (T-290): descriptions-only shape
 * derived from `TourSchema.shape` so the spec references the SDK's
 * actual field set instead of an opaque `type: object` placeholder.
 * Does NOT recurse into discriminated unions (Trigger, AdvanceOn,
 * Step) — a full generator was rescoped out; no adopter has asked
 * for it. If one does, plan `zod-to-openapi` as its own work.
 */
import { TourSchema } from '@in-app-training/sdk/schema/v1';
import type { z } from 'zod';

export interface OpenApiOptions {
  /** e.g. "https://api.example.com/training/v1" */
  baseUrl: string;
  /** Human title for the spec's info block. */
  title?: string;
}

/**
 * Map a top-level `TourSchema` field to a coarse OpenAPI type marker. Kept
 * intentionally shallow — the goal is "consumers see the field names and
 * roughly what they are", not full validation. Zod stays the source of truth
 * at runtime.
 */
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
      // Unwrap once to describe the inner type.
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
 * types are coarse. Discriminated unions render as `type: object` — see
 * the module comment for the rationale.
 */
export function describeBundleFromTourSchema(): Record<string, unknown> {
  const shape = TourSchema.shape as Record<string, z.ZodTypeAny>;
  const properties: Record<string, { type: string; description?: string }> = {};
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

export function openapiSpec(opts: OpenApiOptions): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: opts.title ?? '@in-app-training/api-server',
      version: '1.0.0-api-preview',
      description:
        'Reference implementation of the ADR-0007 REST API. Framework-agnostic handlers — adopters wire their own HTTP framework. All error responses are application/problem+json (RFC 7807).',
    },
    servers: [{ url: opts.baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        Problem: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'integer' },
            detail: { type: 'string' },
            instance: { type: 'string' },
            validationErrors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' },
                },
                required: ['path', 'message'],
              },
            },
          },
          required: ['type', 'title', 'status'],
        },
        BundleSummary: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            publishedBy: { type: 'string' },
          },
          required: ['version', 'publishedAt', 'publishedBy'],
        },
        // Sprint 20 (T-290): descriptions-only shape from TourSchema.shape.
        // Coarse types on the top-level fields; discriminated unions render
        // as `type: object`. Zod stays the source of truth at runtime.
        ContentBundle: describeBundleFromTourSchema(),
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/content/{product}': {
        get: {
          summary: 'Get the current live content bundle.',
          parameters: [
            { name: 'product', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'If-None-Match', in: 'header', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Bundle payload.',
              headers: { ETag: { schema: { type: 'string' } } },
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ContentBundle' } },
              },
            },
            '304': { description: 'Not modified.' },
            '401': { $ref: '#/components/responses/Problem' },
            '404': { $ref: '#/components/responses/Problem' },
          },
        },
        post: {
          summary: 'Publish a new content bundle.',
          parameters: [{ name: 'product', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    body: { $ref: '#/components/schemas/ContentBundle' },
                    version: { type: 'string' },
                  },
                  required: ['body'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Published.' },
            '401': { $ref: '#/components/responses/Problem' },
            '403': { $ref: '#/components/responses/Problem' },
            '422': { $ref: '#/components/responses/Problem' },
          },
        },
      },
      '/content/{product}/history': {
        get: {
          summary: 'List published bundle summaries.',
          parameters: [
            { name: 'product', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Page of history.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BundleSummary' },
                      },
                      nextCursor: { type: ['string', 'null'] },
                    },
                    required: ['items', 'nextCursor'],
                  },
                },
              },
            },
          },
        },
      },
      '/users/{userId}/forget': {
        post: {
          summary: 'Server-side counterpart of Trainer.forgetUser() (ADR-0005).',
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Receipt.' } },
        },
      },
    },
  };
}
