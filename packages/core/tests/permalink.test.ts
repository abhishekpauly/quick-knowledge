/**
 * Permalink parser tests.
 */
import { describe, it, expect } from 'vitest';
import { readPermalinkTourId } from '../src/schema/permalink.js';

describe('readPermalinkTourId', () => {
  it('returns the tour id when ?training=<id> is present', () => {
    expect(readPermalinkTourId('https://app.example.com/?training=my-tour')).toBe('my-tour');
  });

  it('returns null when the param is missing', () => {
    expect(readPermalinkTourId('https://app.example.com/')).toBeNull();
  });

  it('returns null when the value is empty', () => {
    expect(readPermalinkTourId('https://app.example.com/?training=')).toBeNull();
  });

  it('returns null when the id is malformed', () => {
    expect(readPermalinkTourId('https://app.example.com/?training=Not_A_Valid_ID')).toBeNull();
    expect(readPermalinkTourId('https://app.example.com/?training=!!')).toBeNull();
  });

  it('returns null on an invalid URL string', () => {
    expect(readPermalinkTourId('not a url')).toBeNull();
  });
});
