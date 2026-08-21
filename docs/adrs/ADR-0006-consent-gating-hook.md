# ADR-0006: Consent gating hook

- **Status:** Proposed
- **Date:** 2026-08-29
- **Deciders:** Abhishek Paul (SDK), [Product PM] (the example app PM), InfoSec (async review)
- **Related:** [`ADR-0005-gdpr-delete-api.md`](ADR-0005-gdpr-delete-api.md), [`docs/analytics-adapters.md`](../analytics-adapters.md), [`releases/compliance-review-request.md`](../../releases/compliance-review-request.md). Sprint 08 T-093.

## Context

The v0.1 SDK emits analytics events unconditionally through whatever `Analytics` adapter the host wired. The host's consent framework (cookie banner, tracking-preferences UI, GDPR/ePrivacy compliance flow, region-specific defaults) sits **outside the SDK**. That's correct — consent is a host-product concern — but it leaves a gap:

- The host today has to gate consent by *not wiring* the adapter until the user has consented. That works for the initial page load but is awkward for mid-session preference changes (user opens Preferences → toggles Analytics off → the SDK keeps emitting until reload).
- Some tours are **essential UX** (onboarding, safety warnings). Blocking them under strict-consent regimes is user-hostile. Some are **analytics-tracked but functional-optional** (feature tours). Some are **pure product analytics** hidden from users.

Compliance's Sprint 07 sign-off flagged this as a v1.0 requirement: give hosts a first-class way to plug consent state into the trainer without rewiring adapters, and let content authors mark tours by consent category so the trainer can honour category-level preferences automatically.

Two forces at play:

1. **Reactivity.** Consent state changes at runtime; the trainer must observe it, not snapshot it at construction.
2. **Content-category granularity.** Not every tour is analytics. A `tour_started` event for an onboarding tour that's classified as *functional* should fire even under strict analytics-off consent, because dropping it would break the tour's own persistence and progress tracking.

## Decision

Add a **`consent` hook on `TrainerConfig`** plus a **`consentCategory` field on the tour schema**. The hook is a small reactive interface the host implements; the field lets content authors declare each tour's category so the hook can be applied per-event, not just per-tour-lifecycle.

### 1. `ConsentAdapter` interface

```ts
export type ConsentCategory = 'strictly-necessary' | 'functional' | 'analytics' | 'marketing';

export interface ConsentDecision {
  /** Categories the user has explicitly agreed to. */
  granted: ReadonlyArray<ConsentCategory>;
}

export interface ConsentAdapter {
  /** Current decision. Synchronous — the trainer calls this per-event. */
  read(): ConsentDecision;
  /**
   * Subscribe to changes. Fires whenever the user's decision changes.
   * Returns an unsubscribe function. Optional — hosts with static
   * consent (e.g. B2B products with per-account defaults) can omit it.
   */
  subscribe?(listener: (decision: ConsentDecision) => void): () => void;
}
```

Passed via `TrainerConfig`:

```ts
new Trainer({
  product: 'example-app',
  tours,
  analytics: posthogAnalytics(posthog),
  persistence: localStoragePersistence(),
  consent: myHostConsentAdapter, // ← new, optional
});
```

Omitting the field means "no consent gating" — v0.1 behaviour, preserved for backwards compatibility.

### 2. `consentCategory` on the tour schema

```ts
// packages/core/src/schema/v1.ts — additive, defaults to 'functional'
export const ConsentCategorySchema = z.enum([
  'strictly-necessary',
  'functional',
  'analytics',
  'marketing',
]);

// TourSchema gains:
consentCategory: ConsentCategorySchema.optional(), // default 'functional'
```

Authors classify a tour by declaring the field. Missing = `functional`, which is the safe default: functional tours run under all common consent regimes (they're part of product operation) and their analytics events are gated per the trainer rules below.

### 3. Gating rules

The trainer applies two independent gates:

- **Tour-execution gate.** A tour runs only if its `consentCategory` is in the user's `granted` list OR is `strictly-necessary`. `strictly-necessary` is always granted, even if the host's adapter never returns it — treated as an SDK-side invariant.
- **Event-emission gate.** For every `TrainingEvent`, the trainer checks whether the tour's category is in `granted` before calling `Analytics.track`. If not, the event is dropped silently (no error, no queue). Rationale: retroactive replay after consent grant would need a queue with retention/PII policy of its own — out of scope.

If no `ConsentAdapter` is supplied, both gates are no-ops. Every existing v0.1 integration keeps working.

Categories map naturally onto standard consent frameworks (IAB TCF v2, GDPR, ePrivacy) without pinning to any one — the four values are the widely-shared minimum. Hosts using IAB TCF map their purpose flags to these four in their adapter implementation.

## Alternatives considered

- **A single boolean `analyticsConsent`.** Too coarse. Doesn't cover functional vs. marketing, and forces the tour-execution gate and event-emission gate to be conflated.
- **Per-event opt-out** (host filters at the analytics adapter). Works today — the host wraps `posthogAnalytics()` with their own filter. Rejected as the primary answer: (a) doesn't gate tour *execution*, only its analytics; (b) forces every host to hand-roll the same filter; (c) makes the consent story invisible in the SDK's public surface, which compliance dislikes.
- **Cookie-based auto-detect** (SDK reads the standard `euconsent-v2` cookie itself). Rejected: cookies are region-specific, the framework churn is real, and reading cookies from an SDK is a compliance surface all on its own. Host owns consent state; SDK trusts what it's told.
- **Async `read()`.** Rejected: the trainer calls `read()` per-event on hot paths; sync is a hard constraint. Hosts that need to fetch consent from a remote endpoint cache locally and update via the `subscribe` hook.
- **No `consentCategory` field on tours; only the adapter.** Rejected: without the field the SDK has no way to decide which tours to skip. Would push every host into building the mapping themselves.

## Consequences

### Positive

- **One source of truth for consent inside the SDK.** Hosts stop hand-rolling ad-hoc gating.
- **Content authors express intent** (this tour is marketing / this tour is functional) close to the tour definition, where it belongs.
- **Zero behaviour change for existing integrations** — the whole feature is opt-in via `TrainerConfig.consent`.
- **Composable with `ADR-0005 forgetUser`** — a host that respects consent revocation naturally follows with a delete-user call.

### Negative

- **Four categories won't cover every jurisdiction perfectly.** Some regimes want "preferences" or "personalization" as distinct categories. Hosts needing more granularity map several external categories into our four, or supply a custom `consentCategory` value we don't currently validate. We accept some lossiness at the SDK boundary.
- **A silent-drop policy on analytics events might surprise a debugging engineer.** Mitigation: in `IS_DEV`, log a one-time console warning when the first event is dropped by the consent gate, naming the category.
- **The tour-execution gate is another reason a tour might silently not run.** Adds to the list (already: prerequisites, audience, frequency). The `getTours()` return keeps the tour visible; the checklist should render it as "unavailable — analytics consent needed" — see revisit trigger.

### Neutral

- Bundle size: +~1.5 KB gzipped (categories enum + gate logic).
- Schema is additive — every existing tour still validates. `validate:content` unaffected.

## Revisit triggers

- **A host product needs a category we don't have** (e.g. `personalization` distinct from `analytics`). Extend the enum in a schema-additive minor bump.
- **A jurisdiction requires an audit trail of what was dropped.** Add an optional `onEventDropped(event, category)` hook to `ConsentAdapter`.
- **A checklist widget UX study finds users confused by tours listed but ungated.** Add first-class rendering hints to `TrainingChecklist` for "blocked by consent" state.
- **IAB TCF v3 (or successor) becomes the standard our hosts converge on.** Consider shipping a first-party `iabTcfConsent(...)` helper adapter that maps purpose flags into our four categories automatically.
- **A tour needs to fire analytics under one consent policy but not run under another** (unusual — mostly the same category answers both). Would force the two gates to take separate categories.
