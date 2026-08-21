import { describe, expect, it } from 'vitest';
import { problem } from '../src/errors.js';

describe('problem()', () => {
  it('applies default type + title when caller supplies neither', () => {
    const res = problem(500, {});
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toBe('application/problem+json');
    expect(res.body.type).toBe('about:blank');
    expect(res.body.title).toBe('Error');
    expect(res.body.detail).toBeUndefined();
    expect(res.body.instance).toBeUndefined();
    expect(res.body.validationErrors).toBeUndefined();
  });

  it('passes caller-supplied fields through verbatim', () => {
    const res = problem(422, {
      type: 'https://api.example.com/errors/validation',
      title: 'Bad body',
      detail: '3 errors',
      instance: '/x',
      validationErrors: [{ path: 'a', message: 'missing' }],
    });
    expect(res.body.type).toBe('https://api.example.com/errors/validation');
    expect(res.body.title).toBe('Bad body');
    expect(res.body.detail).toBe('3 errors');
    expect(res.body.instance).toBe('/x');
    expect(res.body.validationErrors).toEqual([{ path: 'a', message: 'missing' }]);
  });
});
