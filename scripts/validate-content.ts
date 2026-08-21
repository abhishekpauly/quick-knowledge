#!/usr/bin/env tsx
/**
 * validate-content.ts
 *
 * Walk a content directory, parse every *.tour.json file, and validate against
 * the schema. Exits non-zero on any failure.
 *
 * Usage:
 *   tsx scripts/validate-content.ts <content-dir>
 *
 * Wired into CI as `npm run validate:content`. Never skip failures — a broken
 * tour caught here is a bug prevented in front of a user.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseTour, parsePinsFile } from '../packages/core/src/schema/loader.js';

function walk(dir: string): { tourFiles: string[]; pinsFiles: string[] } {
  const tourFiles: string[] = [];
  const pinsFiles: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      const nested = walk(full);
      tourFiles.push(...nested.tourFiles);
      pinsFiles.push(...nested.pinsFiles);
    } else if (entry.startsWith('_')) {
      continue;
    } else if (entry.endsWith('.tour.json')) {
      tourFiles.push(full);
    } else if (entry.endsWith('.pins.json')) {
      pinsFiles.push(full);
    }
  }
  return { tourFiles, pinsFiles };
}

function main(): void {
  const [, , contentDir = 'content'] = process.argv;
  let tourFiles: string[];
  let pinsFiles: string[];
  try {
    ({ tourFiles, pinsFiles } = walk(contentDir));
  } catch (err) {
    console.error(`Cannot read content dir "${contentDir}":`, (err as Error).message);
    process.exit(2);
  }

  const totalFiles = tourFiles.length + pinsFiles.length;
  if (totalFiles === 0) {
    console.warn(
      `No *.tour.json or *.pins.json files found under ${contentDir}. Nothing to validate.`,
    );
    process.exit(0);
  }

  let failed = 0;
  const seenTourIds = new Set<string>();
  const seenPinIds = new Set<string>();

  for (const file of tourFiles) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, 'utf-8'));
    } catch (err) {
      console.error(`✗ ${file}\n    Invalid JSON: ${(err as Error).message}`);
      failed++;
      continue;
    }
    const result = parseTour(raw);
    if (!result.ok || !result.tour) {
      console.error(`✗ ${file}`);
      for (const issue of result.errors ?? []) {
        console.error(`    ${issue.path}: ${issue.message}`);
      }
      failed++;
      continue;
    }
    if (seenTourIds.has(result.tour.id)) {
      console.error(`✗ ${file}\n    Duplicate tour id: ${result.tour.id}`);
      failed++;
      continue;
    }
    seenTourIds.add(result.tour.id);
    console.log(`✓ ${file}  (${result.tour.id}, ${result.tour.steps.length} steps)`);
  }

  for (const file of pinsFiles) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, 'utf-8'));
    } catch (err) {
      console.error(`✗ ${file}\n    Invalid JSON: ${(err as Error).message}`);
      failed++;
      continue;
    }
    const result = parsePinsFile(raw);
    if (!result.ok || !result.file) {
      console.error(`✗ ${file}`);
      for (const issue of result.errors ?? []) {
        console.error(`    ${issue.path}: ${issue.message}`);
      }
      failed++;
      continue;
    }
    const dupes = result.file.pins.filter((p) => seenPinIds.has(p.id));
    if (dupes.length > 0) {
      console.error(`✗ ${file}`);
      for (const d of dupes) console.error(`    Duplicate pin id: ${d.id}`);
      failed++;
      continue;
    }
    for (const p of result.file.pins) seenPinIds.add(p.id);
    console.log(`✓ ${file}  (${result.file.product}, ${result.file.pins.length} pin(s))`);
  }

  console.log('');
  if (failed === 0) {
    console.log(`OK — ${tourFiles.length} tour(s) and ${pinsFiles.length} pins file(s) validated.`);
    process.exit(0);
  } else {
    console.error(`FAIL — ${failed} of ${totalFiles} file(s) invalid.`);
    process.exit(1);
  }
}

main();
