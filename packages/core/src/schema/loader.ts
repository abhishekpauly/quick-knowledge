/**
 * Content loader — validates one tour JSON object against the schema.
 *
 * Filesystem walking is handled by the CLI scripts (scripts/validate-content.ts).
 * At runtime, consumers typically import their content JSON directly and pass
 * the array of parsed tours to the Trainer:
 *
 *   import onboarding from './content/example-app/onboarding.tour.json';
 *   const tour = parseTour(onboarding);
 */
import { TourSchema, PinsFileSchema, type Tour, type Pin, type PinsFile } from './v1.js';

export interface LoadResult {
  ok: boolean;
  tour?: Tour;
  errors?: Array<{ path: string; message: string }>;
}

export interface LoadPinsResult {
  ok: boolean;
  file?: PinsFile;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Parse and validate a single tour object. Returns typed Tour on success or
 * a list of Zod issues on failure. Never throws.
 */
export function parseTour(raw: unknown): LoadResult {
  const result = TourSchema.safeParse(raw);
  if (result.success) return { ok: true, tour: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '<root>',
      message: issue.message,
    })),
  };
}

/**
 * Load and validate an array of raw tour objects. Returns the successful ones
 * as typed Tours and the failures with their errors. Never throws.
 */
export function loadContent(raws: unknown[]): {
  tours: Tour[];
  failures: Array<{ index: number; errors: Array<{ path: string; message: string }> }>;
} {
  const tours: Tour[] = [];
  const failures: Array<{
    index: number;
    errors: Array<{ path: string; message: string }>;
  }> = [];
  raws.forEach((raw, index) => {
    const result = parseTour(raw);
    if (result.ok && result.tour) tours.push(result.tour);
    else failures.push({ index, errors: result.errors ?? [] });
  });
  return { tours, failures };
}

/**
 * Parse and validate a single pins-file object. Returns the typed PinsFile
 * on success, Zod issues on failure. Never throws.
 */
export function parsePinsFile(raw: unknown): LoadPinsResult {
  const result = PinsFileSchema.safeParse(raw);
  if (result.success) return { ok: true, file: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '<root>',
      message: issue.message,
    })),
  };
}

/**
 * Load and validate an array of raw pins-file objects. Returns the flattened
 * list of Pin objects from successful files and per-file failure details.
 * Duplicate pin ids across files are reported as failures on the second file
 * to surface them without silently dropping data.
 */
export function loadPins(raws: unknown[]): {
  pins: Pin[];
  failures: Array<{ index: number; errors: Array<{ path: string; message: string }> }>;
} {
  const pins: Pin[] = [];
  const failures: Array<{
    index: number;
    errors: Array<{ path: string; message: string }>;
  }> = [];
  const seen = new Set<string>();
  raws.forEach((raw, index) => {
    const result = parsePinsFile(raw);
    if (!result.ok || !result.file) {
      failures.push({ index, errors: result.errors ?? [] });
      return;
    }
    const localDupes: Array<{ path: string; message: string }> = [];
    for (const pin of result.file.pins) {
      if (seen.has(pin.id)) {
        localDupes.push({ path: `pins[${pin.id}]`, message: `Duplicate pin id: ${pin.id}` });
        continue;
      }
      seen.add(pin.id);
      pins.push(pin);
    }
    if (localDupes.length > 0) {
      failures.push({ index, errors: localDupes });
    }
  });
  return { pins, failures };
}
