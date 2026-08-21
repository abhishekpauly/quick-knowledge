import { describe, expect, it } from 'vitest';
import { openapiSpec, describeBundleFromTourSchema } from '../src/openapi.js';

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
});

describe('describeBundleFromTourSchema', () => {
  it('renders the TourSchema top-level fields as descriptions-only OpenAPI properties', () => {
    const block = describeBundleFromTourSchema() as {
      type: string;
      description: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(block.type).toBe('object');
    expect(block.description).toMatch(/TourSchema/);
    // Every top-level Tour field the SDK ships shows up.
    for (const key of [
      'schemaVersion',
      'id',
      'product',
      'title',
      'difficulty',
      'triggers',
      'steps',
    ]) {
      expect(block.properties[key]).toBeDefined();
    }
    // Required fields are declared as such.
    expect(block.required).toEqual(
      expect.arrayContaining([
        'schemaVersion',
        'id',
        'product',
        'title',
        'difficulty',
        'triggers',
        'steps',
      ]),
    );
    // Optional fields (e.g. `goal`) are present but NOT required.
    expect(block.properties.goal).toBeDefined();
    expect(block.required).not.toContain('goal');
    // Coarse types map correctly.
    expect(block.properties.triggers?.type).toBe('array');
    expect(block.properties.steps?.type).toBe('array');
    expect(block.properties.schemaVersion?.type).toBe('string');
  });

  it('is embedded under components.schemas.ContentBundle', () => {
    const spec = openapiSpec({ baseUrl: 'x' }) as {
      components: {
        schemas: { ContentBundle: { type: string; properties: Record<string, unknown> } };
      };
    };
    expect(spec.components.schemas.ContentBundle.type).toBe('object');
    expect(Object.keys(spec.components.schemas.ContentBundle.properties).length).toBeGreaterThan(0);
  });
});
