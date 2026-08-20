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
import { parseTour } from '../packages/core/src/schema/loader.js';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.tour.json') && !entry.startsWith('_')) out.push(full);
  }
  return out;
}

function main(): void {
  const [, , contentDir = 'content'] = process.argv;
  let files: string[];
  try {
    files = walk(contentDir);
  } catch (err) {
    console.error(`Cannot read content dir "${contentDir}":`, (err as Error).message);
    process.exit(2);
  }

  if (files.length === 0) {
    console.warn(`No *.tour.json files found under ${contentDir}. Nothing to validate.`);
    process.exit(0);
  }

  let failed = 0;
  const seenIds = new Set<string>();

  for (const file of files) {
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
    if (seenIds.has(result.tour.id)) {
      console.error(`✗ ${file}\n    Duplicate tour id: ${result.tour.id}`);
      failed++;
      continue;
    }
    seenIds.add(result.tour.id);
    console.log(`✓ ${file}  (${result.tour.id}, ${result.tour.steps.length} steps)`);
  }

  console.log('');
  if (failed === 0) {
    console.log(`OK — ${files.length} tour(s) validated.`);
    process.exit(0);
  } else {
    console.error(`FAIL — ${failed} of ${files.length} tour(s) invalid.`);
    process.exit(1);
  }
}

main();
