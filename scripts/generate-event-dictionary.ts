#!/usr/bin/env tsx
/**
 * generate-event-dictionary.ts
 *
 * Reads packages/core/src/engine/events.ts, extracts every event name and its
 * payload's field/type/optionality, and writes:
 *   - docs/event-dictionary.md  (human-readable Markdown table)
 *   - docs/event-dictionary.json (machine-readable schema for dashboard lint)
 *
 * Runs via `npm run docs:events`. CI wires a `--check` mode that fails if the
 * generated files drift from the checked-in copies (dashboard authors read
 * the JSON; drift means their filters would be wrong).
 *
 * Author-side flow: change events.ts, run `npm run docs:events`, commit the
 * regenerated docs alongside the type change.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const EVENTS_TS = resolve(REPO, 'packages/core/src/engine/events.ts');
const OUT_MD = resolve(REPO, 'docs/event-dictionary.md');
const OUT_JSON = resolve(REPO, 'docs/event-dictionary.json');

interface Field {
  name: string;
  type: string;
  optional: boolean;
}
interface EventEntry {
  name: string;
  payload: string;
  fields: Field[];
}

function extractFieldsFromInterface(node: ts.InterfaceDeclaration): Field[] {
  const fields: Field[] = [];
  for (const member of node.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const name = member.name.getText();
    const type = member.type.getText();
    const optional = member.questionToken !== undefined;
    fields.push({ name, type, optional });
  }
  return fields;
}

function main(): void {
  const src = readFileSync(EVENTS_TS, 'utf-8');
  const sourceFile = ts.createSourceFile(
    'events.ts',
    src,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
  );

  // Collect all interface declarations by name.
  const interfaces = new Map<string, ts.InterfaceDeclaration>();
  // Find the TrainingEvent discriminated-union type alias and read its members.
  let unionNode: ts.TypeAliasDeclaration | undefined;

  sourceFile.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(node.name.text, node);
    } else if (ts.isTypeAliasDeclaration(node) && node.name.text === 'TrainingEvent') {
      unionNode = node;
    }
  });

  if (!unionNode) throw new Error('Could not find TrainingEvent type alias in events.ts');
  if (!ts.isUnionTypeNode(unionNode.type)) {
    throw new Error('TrainingEvent is not a union — dictionary generator needs updating.');
  }

  const entries: EventEntry[] = [];
  for (const member of unionNode.type.types) {
    if (!ts.isTypeLiteralNode(member)) continue;
    let eventName = '';
    let payloadInterface = '';
    for (const prop of member.members) {
      if (!ts.isPropertySignature(prop) || !prop.type) continue;
      const key = prop.name.getText();
      if (
        key === 'name' &&
        ts.isLiteralTypeNode(prop.type) &&
        ts.isStringLiteral(prop.type.literal)
      ) {
        eventName = prop.type.literal.text;
      } else if (key === 'payload' && ts.isTypeReferenceNode(prop.type)) {
        payloadInterface = prop.type.typeName.getText();
      }
    }
    if (!eventName || !payloadInterface) continue;
    const iface = interfaces.get(payloadInterface);
    if (!iface)
      throw new Error(
        `Payload interface "${payloadInterface}" not found for event "${eventName}".`,
      );
    entries.push({
      name: eventName,
      payload: payloadInterface,
      fields: extractFieldsFromInterface(iface),
    });
  }

  // Emit Markdown.
  const md: string[] = [];
  md.push('# Training event dictionary');
  md.push('');
  md.push('**Generated** — do not edit by hand. Regenerate via `npm run docs:events`.');
  md.push('**Source:** `packages/core/src/engine/events.ts`');
  md.push('');
  md.push(
    'Every event emitted by `@in-app-training/sdk` through the `Analytics.track(name, properties)` contract.',
  );
  md.push('');
  md.push(
    'Dashboard authors: filter names below are exact. Property names are camelCase in the payload as delivered to `track()`; if your sink rewrites to snake_case, that is a sink-side concern.',
  );
  md.push('');
  for (const e of entries) {
    md.push(`## \`${e.name}\``);
    md.push('');
    md.push(`Payload interface: \`${e.payload}\``);
    md.push('');
    md.push('| Property | Type | Required |');
    md.push('| --- | --- | --- |');
    for (const f of e.fields) {
      md.push(`| \`${f.name}\` | \`${f.type}\` | ${f.optional ? '—' : '✓'} |`);
    }
    md.push('');
  }

  // Emit JSON.
  const json = {
    generatedFrom: 'packages/core/src/engine/events.ts',
    events: entries,
  };

  const mdOut = md.join('\n');
  const jsonOut = JSON.stringify(json, null, 2) + '\n';

  const args = process.argv.slice(2);
  const check = args.includes('--check');
  if (check) {
    let drift = false;
    for (const [path, want] of [[OUT_MD, mdOut] as const, [OUT_JSON, jsonOut] as const]) {
      if (!existsSync(path)) {
        console.error(`✗ ${path} missing — run \`npm run docs:events\` and commit.`);
        drift = true;
        continue;
      }
      const have = readFileSync(path, 'utf-8');
      if (have !== want) {
        console.error(`✗ ${path} out of date — run \`npm run docs:events\` and commit.`);
        drift = true;
      } else {
        console.log(`✓ ${path} up to date`);
      }
    }
    process.exit(drift ? 1 : 0);
  }

  writeFileSync(OUT_MD, mdOut);
  writeFileSync(OUT_JSON, jsonOut);
  console.log(`Wrote ${OUT_MD} and ${OUT_JSON} — ${entries.length} events.`);
}

main();
