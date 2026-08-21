# Sprint 11 · Days 57–63 · Adopter Product A onboarding + Sprint 10 carry-overs

**Goal:** First tour + first pin live in Adopter Product A. Close the 3 Sprint 10 carry-overs.

**Status:** COMPLETE (simulated).

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-160 | Content: `content/adopter-a/` — onboarding tour authored (mirrors example-app shape) | DONE |
| T-161 | Content: `content/adopter-a/adopter-a.pins.json` — 2 pins for their top ticket-drivers | DONE |
| T-162 | Adopter Product A integration doc + PR template — `releases/adopter-a-integration.md` | DONE |
| T-163 | Simulated staging → prod walkthrough for Adopter Product A — `releases/v0.5.1-adopter-a-launch-log.md` | DONE |
| T-150 | Doc note in `how-to-use-pins.md`: target-visibility caveat (from Sprint 10) | DONE |
| T-151 | `docs/how-to-use-goals.md` — authoring recipe | DONE |
| T-152 | `pin_shown` LRU cap on localStorage (from Sprint 10) | DEFERRED (no signal yet — moved to Sprint 14 or dropped) |

## Retro (compressed)

- **What went well:** Adopter Product A integration took less than a day because their frontend team had `data-tour` selectors on the exact 3 elements we needed. The React adapter dropped in with zero code changes.
- **What went badly:** Their onboarding tour's step 2 (data-source picker) is behind a modal that renders on click — needed `waitForElement` to catch it. Worked, but shows the modal-target case is under-documented.
- **Surprise:** Adopter Product A PM asked if they could contribute a Pin themselves (author-side, JSON PR). Answer: yes — that's the whole point of the schema.
- **Sprint 12 shape:** v1.0 prep starts. Implement ADR-0005 (`trainer.forgetUser`) + ADR-0006 (`ConsentAdapter`). Both are design-locked.

**Tag:** `v0.5.1-adopter-a`.
