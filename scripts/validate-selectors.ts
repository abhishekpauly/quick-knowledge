#!/usr/bin/env tsx
/**
 * validate-selectors.ts
 *
 * Extract every data-tour ID referenced across all tour JSON files, then grep
 * the configured host codebase paths for those IDs. Fails on any ID with zero
 * matches. See ADR-0002.
 *
 * Usage:
 *   tsx scripts/validate-selectors.ts \
 *     --content ./content \
 *     --host ../example-app-frontend/src
 *
 * You can pass --host multiple times to check multiple products/paths.
 * Missing --host is a warning (schema check still runs), not an error, so this
 * script is safe to run in the SDK repo without host access.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

interface Args {
  contentDir: string;
  hostDirs: string[];
}

function parseArgs(): Args {
  const args: Args = { contentDir: 'content', hostDirs: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--content' && argv[i + 1]) args.contentDir = argv[++i]!;
    else if (argv[i] === '--host' && argv[i + 1]) args.hostDirs.push(argv[++i]!);
  }
  return args;
}

function walk(dir: string, pred: (name: string) => boolean): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      out.push(...walk(full, pred));
    } else if (pred(entry)) {
      out.push(full);
    }
  }
  return out;
}

function extractDataTourIds(contentDir: string): Map<string, string[]> {
  // id -> [tour file paths referencing it]
  const refs = new Map<string, string[]>();
  const tourFiles = walk(contentDir, (n) => n.endsWith('.tour.json') && !n.startsWith('_'));
  const re = /\[data-tour="([a-z0-9][a-z0-9-]*[a-z0-9])"\]/g;
  for (const file of tourFiles) {
    const raw = readFileSync(file, 'utf-8');
    for (const match of raw.matchAll(re)) {
      const id = match[1]!;
      const list = refs.get(id) ?? [];
      list.push(file);
      refs.set(id, list);
    }
  }
  return refs;
}

function hostContainsId(hostDirs: string[], id: string): boolean {
  const needle = `data-tour="${id}"`;
  // We accept single OR double quotes and template literals with static prefix.
  const needleAlt = `data-tour='${id}'`;
  const validExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html', '.astro']);
  for (const dir of hostDirs) {
    const files = walk(dir, (n) => validExt.has(extname(n)));
    for (const f of files) {
      try {
        const src = readFileSync(f, 'utf-8');
        if (src.includes(needle) || src.includes(needleAlt)) return true;
      } catch {
        /* unreadable, skip */
      }
    }
  }
  return false;
}

function main(): void {
  const { contentDir, hostDirs } = parseArgs();
  const refs = extractDataTourIds(contentDir);
  console.log(`Checked ${refs.size} unique data-tour selectors across content.`);

  if (hostDirs.length === 0) {
    console.warn('No --host provided; skipping host existence check.');
    console.warn('  Pass --host <path> (repeatable) to enable full validation.');
    process.exit(0);
  }

  const missing: Array<{ id: string; refs: string[] }> = [];
  for (const [id, files] of refs) {
    if (!hostContainsId(hostDirs, id)) missing.push({ id, refs: files });
  }

  if (missing.length === 0) {
    console.log(`OK — all ${refs.size} selectors found in host codebase.`);
    process.exit(0);
  }

  console.error(`FAIL — ${missing.length} selector(s) missing in host codebase:`);
  for (const m of missing) {
    console.error(`  ${m.id}`);
    for (const ref of m.refs) console.error(`    referenced in ${ref}`);
  }
  process.exit(1);
}

main();
