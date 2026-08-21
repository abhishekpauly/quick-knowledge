import { describe, expect, it } from 'vitest';
import { openapiSpec } from '../src/openapi.js';

describe('openapiSpec', () => {
  it('produces a 3.1 spec pinned to the given base URL and exposes every route', () => {
    const spec = openapiSpec({ baseUrl: 'https://api.example.com/training/v1' }) as {
      openapi: string;
      info: { title: string; version: string };
      servers: Array<{ url: string }>;
      components: { securitySchemes: Record<string, unknown>; schemas: Record<string, unknown> };
      paths: Record<string, unknown>;
    };
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.servers[0]?.url).toBe('https://api.example.com/training/v1');
    expect(Object.keys(spec.components.securitySchemes)).toContain('bearerAuth');
    for (const schema of ['Problem', 'BundleSummary', 'ContentBundle']) {
      expect(spec.components.schemas[schema]).toBeDefined();
    }
    for (const route of [
      '/content/{product}',
      '/content/{product}/history',
      '/users/{userId}/forget',
    ]) {
      expect(spec.paths[route]).toBeDefined();
    }
  });

  it('accepts an override title', () => {
    const spec = openapiSpec({ baseUrl: 'x', title: 'Custom' }) as {
      info: { title: string };
    };
    expect(spec.info.title).toBe('Custom');
  });

  it('defaults ContentBundle to the opaque placeholder when no schema is passed', () => {
    const spec = openapiSpec({ baseUrl: 'x' }) as {
      components: { schemas: { ContentBundle: Record<string, unknown> } };
    };
    expect(spec.components.schemas.ContentBundle).toEqual({ type: 'object' });
  });

  it('substitutes the caller-supplied ContentBundle schema when provided (Sprint 20 T-290)', () => {
    const caller = {
      type: 'object',
      description: 'from-caller',
      properties: { id: { type: 'string' } },
      required: ['id'],
    };
    const spec = openapiSpec({ baseUrl: 'x', contentBundleSchema: caller }) as {
      components: { schemas: { ContentBundle: Record<string, unknown> } };
    };
    expect(spec.components.schemas.ContentBundle).toBe(caller);
  });
});
