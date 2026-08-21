/**
 * OpenAPI 3.1 spec for the reference API.
 *
 * Hand-written for now; when the Zod schema stabilises further we swap to
 * `zod-to-openapi` so the `#/components/schemas/ContentBundle` block is
 * generated from the SDK's own TourSchema and can never drift. Sprint 16
 * ships the hand-written shape so adopters can wire clients today.
 */

export interface OpenApiOptions {
  /** e.g. "https://api.example.com/training/v1" */
  baseUrl: string;
  /** Human title for the spec's info block. */
  title?: string;
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
        // ContentBundle is an opaque `object` here — the SDK's Zod TourSchema
        // is the enforcement mechanism, not this placeholder.
        ContentBundle: { type: 'object' },
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
