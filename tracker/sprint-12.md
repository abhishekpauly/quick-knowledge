# Sprint 12 · Days 64–70 · v1.0 prep — forgetUser + ConsentAdapter

**Goal:** Convert ADR-0005 and ADR-0006 from design docs into shipping code. Both were flagged during compliance review; both need to exist before v1.0 tag.

**Status:** COMPLETE.

## Task list

| ID | Task | Status |
| --- | --- | --- |
| T-180 | `ConsentAdapter` interface + `TrainerConfig.consent?` (ADR-0006) | DONE |
| T-181 | Additive `consentCategory` on `TourSchema` (default 'functional') | DONE |
| T-182 | Consent gates: tour execution + analytics emission | DONE |
| T-183 | `Persistence.clearAll?()` + localStorage + memory impls (ADR-0005 prep) | DONE |
| T-184 | `Trainer.forgetUser(userId?)` + `ForgetUserReceipt` (ADR-0005) | DONE |
| T-185 | `user_forget_requested` event; dictionary regen (union → 11) | DONE |
| T-186 | Tests: `isCategoryAllowed`, consent-gated tour, consent-gated emission, forgetUser happy + idempotency | DONE |

## Retro (compressed)

- **What went well:** Both ADRs held up under implementation. Zero rework needed on the design.
- **What went badly:** The consent-emission gate needed a `notifyLocalListeners` split — local listeners (checklist reactivity, dev tools) shouldn't be gated. Small refactor.
- **Sprint 13 shape:** Adopter Product B onboarding (Vue-first, Pins-heavy per the scouting doc).

**Tag:** `v0.5.2-compliance`.
