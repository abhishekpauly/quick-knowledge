# FEAT-011: Vue adapter

- **Status:** Deferred
- **Priority:** P3
- **Sprint:** TBD (post-MVP)
- **Owner:** Solo build
- **Depends on:** FEAT-001, FEAT-002
- **Related ADRs:** ADR-0004

## Problem

Once a Vue-based UPTIQ product commits to adopting the SDK, we need an idiomatic Vue integration.

## Deferral rationale

No Vue product has committed. Building speculatively risks getting the API wrong for the actual Vue product's needs. Wait for a real customer, then build.

**Promotion trigger:** A UPTIQ Vue product's PM commits to adopting the SDK in a specific quarter.

## Sketch (for when it's time)

- Vue plugin: `app.use(TrainingSDK, { trainer })`.
- `useTour()` composable mirroring the React hook's shape.
- Estimated effort: 3–5 days once the trainer + content layer are stable.

## Acceptance criteria (for when it's time)

- [ ] Vue 3 support.
- [ ] Feature parity with the React adapter.
- [ ] Shared test suite runs against both adapters (integration level).
