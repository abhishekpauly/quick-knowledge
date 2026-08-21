import { describe, expect, it } from 'vitest';
import { describeBundleFromTourSchema } from '../src/schema/describe-openapi.js';

describe('describeBundleFromTourSchema', () => {
  it('renders TourSchema top-level fields as descriptions-only OpenAPI properties', () => {
    const block = describeBundleFromTourSchema() as {
      type: string;
      description: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(block.type).toBe('object');
    expect(block.description).toMatch(/TourSchema/);
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
    // Optional field is present in properties, absent from required.
    expect(block.properties.goal).toBeDefined();
    expect(block.required).not.toContain('goal');
    // Coarse types map correctly.
    expect(block.properties.triggers?.type).toBe('array');
    expect(block.properties.steps?.type).toBe('array');
    expect(block.properties.schemaVersion?.type).toBe('string');
  });
});
