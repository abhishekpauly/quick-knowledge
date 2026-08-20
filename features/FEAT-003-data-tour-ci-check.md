# FEAT-003: `data-tour` selector CI validator

- **Status:** Backlog
- **Priority:** P0
- **Sprint:** SPR-03
- **Owner:** Solo build
- **Depends on:** FEAT-002
- **Related ADRs:** ADR-0002

## Problem

Tour targets rot silently when someone refactors the host product and drops or renames a `data-tour` attribute. We need to catch this in CI, not in production.

## Non-goals

- Autofix. This just detects.
- Enforcing the naming convention (that's a separate lint rule; do it in v0.2).
- Detecting unused `data-tour` attributes in the host codebase (nice but not MVP).

## Solution sketch

`scripts/validate-selectors.ts` walks `content/` and extracts every `[data-tour="..."]` ID referenced across all tours. It then greps the configured host codebase paths for those IDs. Any ID with zero matches is a failure. Runs in both the SDK repo's CI (against a snapshot of the host codebase or a linked path) and the host product's CI (against its own source).

## MVP scope (Sprint 03)

- CLI script `npm run validate:selectors -- --content ./content --host ../ai-platform-frontend/src`.
- Extracts IDs from all `.tour.json` files.
- Greps host source for each ID.
- Reports missing IDs with file:line context if possible.
- Exits non-zero on any missing ID.
- Documented in the host product's PR template ("run this if you're touching the frontend").

## Full scope (later)

- Bidirectional check: also flag `data-tour` IDs in the host that no tour references (potential dead code).
- Suggest similar IDs on typos ("Did you mean `sidebar-projects-link`?").
- Cache mode for faster local runs.

## Acceptance criteria

- [ ] Running against valid content + host source: exits 0, prints count of checked IDs.
- [ ] Running against content that references a missing ID: exits non-zero, names the missing ID and the tour file that references it.
- [ ] Runs in under 5 seconds on the AI Platform codebase.
- [ ] Wired into SDK repo's CI (fails on missing IDs).
- [ ] Documented + added to AI Platform frontend repo's CI as an optional-but-recommended job.

## Open questions

- How do we handle host codebases that use dynamic IDs (`data-tour={`prefix-${id}`}`)? → Flag as unresolvable; require an explicit allow-list.

## Risks

- Grep-based check has false negatives on dynamic IDs. Mitigation: warn on `data-tour={` patterns in host code, and support an allow-list.
- Requires host codebase access from CI. Mitigation: for the SDK repo, use a submodule or checkout step; for the host repo, run locally against its own source.
