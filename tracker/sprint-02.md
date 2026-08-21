# Sprint 02 · Days 4–8 · MVP as a real package

**Goal:** Five real tours live in QA, all authored in JSON, running from a real npm package with a real content schema.

**Definition of done:**
- `@in-app-training/sdk` extracted as a workspace/package.
- Zod v1 schema in place. All tours are JSON files that validate.
- Five tours live: onboarding, 2 basic, 1 intermediate, 1 common task.
- CSS variable theming matches the example app.
- LocalStorage persistence — completed tours don't re-trigger.
- `npm run validate:content` green.

**Not this sprint:** React adapter (Sprint 03), real analytics sink, CI selector validator (Sprint 03), advanced targeting (Sprint 04).

---

## Task list

See `backlog.md` T-010 through T-019.

## Sequencing

- **Days 4–5:** T-010 (package extraction) + T-011 (Zod schema) + T-012 (content loader) + T-013 (migrate Sprint 01 tours to JSON).
- **Day 6:** T-014 (author 3 new tours). Curriculum work — content-heavy day.
- **Day 7:** T-015 (`data-tour` attributes for new tours), T-016 (persistence), T-017 (theming), T-018 (console analytics).
- **Day 8:** T-019 (validation script), integration testing, buffer for spillover.

## Success signals

- All 5 tours load from JSON and pass validation.
- Onboarding tour does not re-trigger after completion (localStorage working).
- Visual matches the example app brand.

## Risks

- Content authoring for 3 new tours can rathole. Timebox it: 2 hours per tour max. If it takes longer, the schema is wrong.
- Package extraction can drag if we over-engineer the workspace. Keep it minimal — single package for now, split later if needed.

## Retro questions

- Was 2 hours per tour realistic?
- Did the schema get in the way, or did it help?
- What field(s) do we wish we had?
