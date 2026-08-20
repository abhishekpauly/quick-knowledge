# FEAT-014: Segmentation (show tour X to users of type Y)

- **Status:** Deferred
- **Priority:** P3
- **Sprint:** TBD

## Problem (future)

Different user segments need different training. New free-tier users see basic onboarding; enterprise admins see admin-specific tours; power users skip beginner content.

## Deferral rationale

MVP ships all tours to all users, with prerequisites gating advanced content. Simpler and enough for the first N users.

**Promotion trigger:** AI Platform PM asks for it, OR completion metrics show one segment consistently skipping tours that don't apply to them.

## Sketch (for when it's time)

- Tour content declares `audience: ["plan:enterprise", "role:admin"]`.
- Host product passes user attributes at wire-up: `<TourProvider userAttributes={{ plan: "enterprise", role: "admin" }}>`.
- Engine filters tours by matching attributes.
- No custom rule engine — simple attribute matching is enough for v1.
