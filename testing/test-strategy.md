# Test strategy

## Philosophy

Test the seams, not the internals. This is an SDK — its API surface is what other teams depend on. Tests should catch:

1. Public API contract breaks (a consumer's code stops working).
2. Content that would surface as broken tours in production.
3. Analytics event schema drift.
4. Selector rot (via CI, not runtime tests).

Do not test Shepherd.js — trust it. Do test our wrapping.

## Test pyramid

```
        E2E (Playwright)
       /                \
      /  Integration    \       ← where most bugs live
     /   (jsdom + real  \
    /    Shepherd)       \
   /                      \
  Unit (Vitest, isolated) \
```

- **Unit** — schema validation, content loader, adapter interfaces, pure functions.
- **Integration** — engine + Shepherd + adapters, exercised in jsdom against fixture DOMs.
- **E2E** — Playwright against a demo app that hosts the SDK. Covers real browser behavior: scroll, resize, focus, animations.

Ratio target: ~60% unit, ~30% integration, ~10% E2E.

## Toolchain

- **Vitest** — unit + integration.
- **Playwright** — E2E.
- **Zod** — schema tests (`safeParse` on valid and invalid fixtures).
- **jsdom** — DOM for integration tests. Shepherd runs in it.
- **fake-timers** — for testing wait-for-element and retry.

## Per-feature testing targets

### FEAT-001 Engine
- Unit: state machine transitions (start → step → complete/dismiss).
- Integration: mount tour → click Next → verify step change + event emitted.

### FEAT-002 Content schema
- Unit: valid fixture parses. Invalid fixtures (missing required, bad selector format, wrong enum) fail with expected message.
- Property tests: any valid `Tour` object survives round-trip through the schema.

### FEAT-003 Selector CI
- Unit: extractor pulls all `[data-tour="..."]` IDs from a fixture content dir.
- Integration: run the full script against a fixture host codebase, verify pass and fail cases.

### FEAT-004 React adapter
- Unit: `<TourProvider>` errors when trainer missing. `useTour` errors outside provider.
- Integration: render provider, call `start`, assert tooltip appears in DOM.
- E2E: real React app in Playwright, run a tour end-to-end.

### FEAT-005 Analytics adapter
- Unit: engine calls `track` with expected event names and payloads.
- Unit: adapter errors don't crash engine.

### FEAT-006 Persistence
- Unit: `get` returns what `set` wrote. Namespace prefix applied.
- Unit: `localStorage` unavailable → falls back to in-memory + logs warning.

### FEAT-007 Theming
- E2E: apply theme, snapshot tooltip visual. (Visual regression — Playwright + Percy or local baselines.)

### FEAT-008 Advanced targeting
- Integration + fake-timers: target renders late → tour advances. Target never renders → times out, emits `tour_error`.

### FEAT-009 Checklist
- E2E: renders all tours, marks completed ones, locks prerequisite-gated ones.

## Content testing

Every tour content file has automated checks:

1. **Schema validation** — `npm run validate:content`.
2. **Selector existence** — `npm run validate:selectors`.
3. **Manual playthrough** — before every release, run the full tour set in QA and check that each one completes.

## Manual smoke test (pre-release)

Documented in `testing/acceptance-criteria.md`. Approximately 30 minutes. Every release runs it.

## CI matrix

| Job | Runs on | Fails build |
| --- | --- | --- |
| Lint (eslint + prettier) | every PR | yes |
| Type check (tsc --noEmit) | every PR | yes |
| Unit tests (vitest) | every PR | yes |
| Integration tests (vitest jsdom) | every PR | yes |
| Content validation (Zod) | every PR | yes |
| Selector validation (grep host codebase) | every PR | yes |
| E2E (Playwright) | every PR, main branch | yes |
| Bundle size check | every PR | warn only for now |

## Coverage targets

- Engine + schema + adapters: 85%+ line coverage.
- React adapter: 80%+ line coverage.
- Do not chase coverage on generated types or trivial getters.

## What we don't test

- Shepherd.js internals.
- Browser-native behavior (scroll, resize) except at E2E level.
- Cross-browser rendering pixel-perfection (accept minor differences).
