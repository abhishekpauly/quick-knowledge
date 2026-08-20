# ADR-0003: JSON content schema for tours (versioned, Zod-validated)

- **Status:** Accepted
- **Date:** 2026-08-20
- **Deciders:** Curriculum + Engineering (solo)

## Context

Tour content needs to be authored, reviewed, versioned, and shipped independently of engine code. It needs to be readable by non-engineers (curriculum authors) and machine-validatable (to catch bad content before it hits users). It needs to evolve — v1 will not be the final shape — without breaking existing content or requiring a coordinated update across every tour.

## Decision

Tours are authored as JSON files (one per tour) under `content/<product>/<tour-id>.tour.json`. Every file has a `schemaVersion` field. A Zod schema validates content at build and CI time; TypeScript types are inferred from the same source. The engine supports the last two schema versions in parallel during any migration.

## Alternatives considered

- **YAML.** More human-readable. Rejected — trailing whitespace and indentation traps are hostile to non-engineer authors. JSON errors are easier to debug.
- **TypeScript files (author tours as `.ts` modules).** Rich typing, but requires curriculum authors to know TypeScript and requires a build step to iterate. Rejected.
- **Markdown with YAML frontmatter.** Good for prose-heavy content. Rejected for MVP — steps are structured, not prose. Reconsider if content becomes long-form.
- **Custom DSL.** No. We're not that big.
- **Database-backed content.** Rejected for MVP — requires an authoring UI, an API, and a backend. Reconsider in a later phase.

## Consequences

### Positive
- Curriculum authors can edit content in any editor.
- Content changes are diffable and reviewable in PRs.
- Zod gives strong runtime validation without hand-writing checkers.
- Version field lets us evolve the schema without breaking old content.
- Same source of truth for the schema (Zod) generates TypeScript types (`z.infer<>`).

### Negative
- No visual editor (yet). Authors must edit JSON directly. Trailing commas, unescaped quotes will happen.
- JSON is verbose. Long tours are long files.
- No inline comments (JSON doesn't support them). Metadata like "why this step" has to live in a `notes` field.

### Neutral
- Content ships bundled with the SDK for MVP. We may serve it from an API in v0.5+ so updates don't require redeploy.

## Revisit triggers

- Author velocity is < 1 tour/hour after Sprint 03. → Consider Markdown+frontmatter or a visual editor.
- Content grows past ~50 tours. → Consider content-from-API + admin UI.
- Non-engineer authors can't do it without help. → Consider visual editor.
