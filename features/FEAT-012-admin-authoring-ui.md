# FEAT-012: Admin authoring UI

- **Status:** Deferred
- **Priority:** P3
- **Sprint:** TBD

## Problem (future)

If author velocity is < 1 tour/hour after Sprint 03, git-based authoring is a bottleneck and we need a friendlier surface.

## Deferral rationale

Building a UI is weeks of work. Prove the file-based authoring loop first. If the curriculum author says "this is fine," we saved the effort.

**Promotion trigger:** Measured author velocity is < 1 tour/hour, OR the curriculum author explicitly says git is a blocker.

## Sketch (for when it's time)

- Admin web app that reads content JSON from a backend and writes back on save.
- Preview mode that mounts the SDK against a live app instance.
- Version diffs, undo, publish-vs-draft states.
- Backing store: content stays in Git (source of truth); admin UI commits on publish.
