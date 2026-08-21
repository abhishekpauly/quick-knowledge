# Sprint 07 content pre-flight — draft tours

**Task:** T-064. Bring the example app curriculum to the Sprint 02 DoD of **five tours** live:

1. `onboarding.tour.json` — DONE (v0.1).
2. `workflows-create-project.tour.json` — DONE (v0.1). *(One basic.)*
3. Second basic — draft: `_draft-basic-2.tour.json`.
4. Intermediate — draft: `_draft-intermediate.tour.json`.
5. Common task — draft: `_draft-common-task.tour.json`.

## What these files are

Structural skeletons only. Every step has a shape, a placement, and a `[TODO]`-tagged body. The curriculum author (you) refines copy and swaps the `data-tour` selectors for real ones once the example app screens are picked.

## What underscore prefix means

`validate-content.ts` skips files whose basename starts with `_`. These drafts do **not** break CI. When ready to ship a tour:

1. Rename `_draft-basic-2.tour.json` → `basic-<topic>.tour.json` (drop the underscore).
2. Fill every `[TODO]` bracket.
3. Replace placeholder selectors (they all start with `TODO-`) with real `data-tour` IDs.
4. Add those selectors to `tracker/sprint-01-selectors.md` and the example app `data-tour` PR (extend `releases/adopter-data-tour-pr.md`).
5. Run `npm run validate:content`.

## Selector additions this pre-flight will require

Aggregate all `TODO-*` selectors across the three drafts; batch as one addendum to the example app `data-tour` PR (T-061). Estimated new IDs: ~10.

## Author checklist per draft

- [ ] Pick real screens in the example app this tour will run on. Confirm they're stable (not being redesigned).
- [ ] Replace `TODO-<id>` selectors with `<area>-<component>-<intent>` names per `docs/data-tour-conventions.md`.
- [ ] Fill title and body — aim for the same voice as `onboarding.tour.json`. Warm, second-person, no jargon in the first sentence.
- [ ] Set `estimatedMinutes` honestly. Round up.
- [ ] Set `prerequisites` if the tour assumes the user has already done another one.
- [ ] Decide on `triggers`: `manual` (default — user clicks from checklist) unless there's a strong `url` or `event` trigger case.
- [ ] Where useful, use `advanceOn: { type: "click", target: "…" }` so the tour follows the user's action instead of a "Next" click.

## Estimated content sizes

Based on `onboarding.tour.json` (6 steps, 4 minutes):

- Second basic: 4–6 steps, 3 minutes.
- Intermediate: 6–8 steps, 5–7 minutes. Break into two tours if it grows past 8.
- Common task: 3–5 steps, 2 minutes. Common tasks earn their keep by being fast — no filler.
