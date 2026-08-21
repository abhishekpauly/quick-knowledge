# FEAT-002: JSON content schema + Zod validator

- **Status:** Backlog
- **Priority:** P0
- **Sprint:** SPR-02
- **Owner:** Solo build
- **Depends on:** FEAT-001
- **Related ADRs:** ADR-0003

## Problem

Tour content needs to live outside engine code so curriculum authors can edit it, PR it, and evolve it independently. Content needs to be validated so bad content fails at build time, not at runtime in front of users.

## Non-goals

- Content authoring UI (deferred — see FEAT-012).
- Content served from an API (later phase).
- Multi-language content (v2 schema).

## Solution sketch

Define Zod schema at `src/schema/v1.ts`. TypeScript types are inferred via `z.infer<>`. Loader reads `.tour.json` files from `content/<product>/`, validates each against the schema, and returns typed `Tour[]`. Any validation failure is a build error.

## MVP scope (Sprint 02)

- Zod schema matching `docs/content-schema.md` v1.
- `loadContent(dir)` returns `Tour[]`.
- CLI script `npm run validate:content` walks `content/` and validates every file.
- CI job that fails on invalid content.
- Migrate the two Sprint 01 hardcoded tours into JSON files.
- Support ≥ 5 tours in the example app product folder.

## Full scope (Sprint 03+)

- Multiple schema versions in parallel (v1 + v2 support during migrations).
- Helpful validation error messages ("step 3: 'target' must match [data-tour=...]").
- Optional JSON Schema export for editor autocomplete.

## Acceptance criteria

- [ ] A valid tour file loads and returns a typed `Tour`.
- [ ] An invalid tour file (missing required field, bad selector format, wrong difficulty enum) fails validation with a clear error.
- [ ] `npm run validate:content` exits non-zero on any invalid file and prints the file + field path + reason.
- [ ] CI fails on invalid content.
- [ ] All Sprint 02 tours pass validation.

## Open questions

- Should content be a single JSON file per tour, or a folder-per-tour with `tour.json` + `assets/`? → Single file for MVP; folder-per-tour if we start adding images.

## Risks

- Zod bundle size — we ship the schema to the browser. Mitigation: schema stays under a few hundred lines, or move validation to build-time only if bundle bloat becomes an issue.
