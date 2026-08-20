# ADR-0002: `data-tour` attribute contract for DOM targeting

- **Status:** Accepted
- **Date:** 2026-08-20
- **Deciders:** Curriculum + Engineering (solo)

## Context

Tour systems die when CSS selectors break. A refactor renames a class, someone restructures a component, a Tailwind utility gets reordered — and every tour targeting that element silently breaks. Users hit a broken tour, complete rates drop, trust in the training is gone, no one notices for weeks.

We need a way to point tours at elements that survives normal frontend refactoring.

## Decision

Every element that any tour targets has a `data-tour="..."` attribute with a stable, unique ID. The SDK's engine only accepts selectors of the form `[data-tour="..."]` — nothing else. This is enforced at runtime (engine throws on other selectors) and in CI (validator confirms every referenced ID exists in the host codebase).

## Alternatives considered

- **CSS selectors (`.button-primary`, `#sidebar-nav`).** Rejected — fragile, breaks on every refactor.
- **XPath.** Rejected — same fragility, plus worse readability.
- **ARIA landmarks / roles.** Considered as a supplementary target. Rejected as primary because they're not unique enough (`role="button"` matches many elements).
- **Ref-based targeting (product mounts a React ref).** Only works in React, and requires product code changes for every step. Rejected.

## Consequences

### Positive
- Tour targets survive refactors as long as the ID is preserved.
- CI can catch missing selectors before merge.
- Naming becomes a documented contract that product engineers can follow.
- Attribute-based selectors are fast and reliable.

### Negative
- Product engineers must add attributes to their code. This is a coordination tax.
- IDs become effectively public API of the host product — can't be renamed silently.
- Someone has to enforce the naming convention or IDs will diverge.

### Neutral
- CI validator adds one more check to the build. Fast (< 1s).

## Revisit triggers

- Product engineers push back hard on maintaining `data-tour` attributes. (Unlikely if we prove the value; more likely if the SDK is not well maintained.)
- We discover a fundamentally better targeting mechanism (unlikely).
