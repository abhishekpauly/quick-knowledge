# Contributing

## Roles

- **Curriculum owner** — writes tour content, decides what workflows get covered, owns copy quality.
- **SDK engineer** — owns the engine, adapters, CI checks, release process.
- **Product engineer (per host product)** — owns adding `data-tour` attributes to elements in their product's frontend.

Solo build for now — one person wears all three hats. This doc exists so the hand-off is smooth when it isn't.

## Adding a new tour

1. Copy `content/_template.tour.json` to `content/<product>/<tour-id>.tour.json`.
2. Fill in `schemaVersion`, `id`, `title`, `steps`, `triggers`.
3. Every `step.target` must be a `[data-tour="..."]` selector. If the element doesn't exist yet in the host product, coordinate with the product engineer to add the attribute (see below).
4. Run `npm run validate:content` — the Zod schema check.
5. Run `npm run validate:selectors` — CI check that every `data-tour` reference exists in the target codebase.
6. Preview locally with `npm run dev`.
7. Open a PR. Assign the SDK engineer as reviewer.

## Adding a `data-tour` attribute (product engineer)

1. Decide a stable ID: `<area>-<component>-<intent>`. Example: `workflows-canvas-add-node-button`.
2. Add `data-tour="workflows-canvas-add-node-button"` to the element.
3. Do NOT reuse an ID for a different element. IDs are effectively public API.
4. Do NOT remove an ID without checking the SDK's content repo for references (`grep -r "workflows-canvas-add-node-button" content/`).

See `docs/data-tour-conventions.md` for full naming rules.

## Adding a feature to the SDK

1. Copy `features/_template.md` to `features/FEAT-XXX-<name>.md`. Increment XXX.
2. Fill in problem, non-goals, MVP scope, priority, sprint, dependencies, acceptance criteria.
3. If the feature involves an architectural decision (new dependency, new pattern, breaking change), also write an ADR in `docs/adrs/`.
4. Add the feature to `tracker/backlog.md` with a status.
5. Discuss with SDK engineer before starting build.

## Writing an ADR

1. Copy `docs/adrs/_template.md` to `docs/adrs/ADR-XXXX-<name>.md`. Increment XXXX.
2. Status starts as `Proposed`. Move to `Accepted` after review. Never delete — supersede if reversed.
3. Every ADR has: Context, Decision, Consequences (positive + negative + neutral).

## Cross-product feature requests

Once a second product installs the SDK, feature requests will come in. Governance:

- **In scope for the core:** anything that's clearly useful for 2+ products.
- **In scope for adapters:** anything that's product-specific behavior (analytics sink, persistence backend, theme).
- **Not in scope:** anything that only benefits one product's specific workflow — build that in the host product itself, not in the SDK.

Requesting team: open an RFC as a feature spec (`features/FEAT-XXX-...`) with a "Which products benefit" section. SDK engineer decides in or out and communicates back within one week.

## Release process

See `releases/deploy-checklist.md` for pre-release verification. Follow [Semantic Versioning](https://semver.org/). Update `CHANGELOG.md` under `[Unreleased]` as work merges; move to a versioned section on release.
