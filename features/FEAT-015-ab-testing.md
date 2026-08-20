# FEAT-015: A/B testing hooks

- **Status:** Deferred
- **Priority:** P3
- **Sprint:** TBD

## Problem (future)

Two versions of the same tour, split-tested to see which drives better completion or better downstream product engagement.

## Deferral rationale

Requires an experiment framework + statistical infrastructure. Overkill for MVP where we have one version of each tour and no baseline data.

**Promotion trigger:** Two viable copy variants for the same tour where we genuinely want to test, AND the host product's analytics has experiment infrastructure we can integrate with.

## Sketch (for when it's time)

- Content: `variants: [{ id: "a", weight: 0.5, steps: [...] }, { id: "b", weight: 0.5, steps: [...] }]`.
- Engine picks a variant per user based on stable hash of user ID.
- Variant ID included in every analytics event.
- Reuses host product's experiment framework for exposure logging.
