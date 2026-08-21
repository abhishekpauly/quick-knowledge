# ADR-0005: GDPR delete API surface

- **Status:** Proposed
- **Date:** 2026-08-29
- **Deciders:** Abhishek Paul (SDK), [Product PM] (the example app PM), InfoSec (async review)
- **Related:** [`releases/compliance-review-request.md`](../../releases/compliance-review-request.md) — Sprint 07 security review flagged GDPR delete as a v1.0 requirement. Sprint 08 T-093 opens the design; implementation lands in the v1.0 window.

## Context

The SDK stores per-user state in the browser only. There is no server component in v0.1.

- **v0.1 persistence** — `Persistence` interface (see `packages/core/src/adapters/persistence.ts`); the shipped adapter is `localStoragePersistence()` writing under `in-app-training:*`. No cross-device sync, no server round-trip.
- **v0.1 analytics** — every `TrainingEvent` payload is delivered synchronously into the host product's `Analytics` adapter (PostHog by default). The SDK never phones home; the host owns retention.
- **v1.0 promised capabilities** (per `ROADMAP.md`): cross-device persistence backend + a public REST API. Both create *server-side* per-user state, which brings GDPR Article 17 (right to erasure) squarely into scope.

Compliance's Sprint 07 sign-off gave staging + prod for v0.1 conditional on this ADR being drafted before any server-side persistence lands. Sprint 08 fulfils that conditional.

The design must cover **three data locations** once v1.0 ships:

1. The browser's `localStorage` (already present today).
2. The v1.0 cross-device backend (any store used to sync tour progress across devices).
3. The analytics sink (PostHog / whatever the host wired). The SDK does not own this store, but the delete API must document how the host propagates the request.

## Decision

Ship a **single-verb public API** on the `Trainer` class:

```ts
class Trainer {
  /**
   * Right-to-erasure entry point. Idempotent. Removes every piece of
   * per-user state the SDK holds for the given user or for the current
   * browser session. Returns a summary of what was cleared for auditing.
   *
   * Callers pass either a userId (v1.0 server-side stores) or nothing
   * (browser-only stores). Passing a userId also clears the browser
   * state if the trainer is bound to that user's session.
   */
  async forgetUser(userId?: string): Promise<ForgetUserReceipt>;
}

interface ForgetUserReceipt {
  /** Was any local (browser) state cleared? */
  clearedLocal: boolean;
  /** Was any remote (v1.0 backend) state cleared? */
  clearedRemote: boolean;
  /**
   * Host-analytics propagation notice. The SDK does NOT call the sink's
   * own delete endpoint — it emits one `user_forget_requested` event so
   * the host can trigger its own sink-side deletion (PostHog $delete_user,
   * Amplitude POST /2/deletions, etc.). The receipt tells the host what
   * to do with that hook.
   */
  emittedAnalyticsSignal: boolean;
  /** ISO-8601 completion timestamp. */
  timestamp: string;
}
```

Contract:

- **Idempotent.** Calling twice returns two receipts; both succeed. No error on "nothing to delete."
- **Best-effort per store.** If the local store fails but the remote store succeeds, the receipt reflects it and the method resolves (not rejects). A dedicated `errors: string[]` field on the receipt reports failures; the host's compliance flow decides whether to retry.
- **Analytics is a signal, not an action.** The SDK emits a `user_forget_requested` event (added to `TrainingEventName`) with `{ userId, timestamp }`. The host's analytics wiring is responsible for the sink-side deletion call. Rationale: sink deletion APIs vary widely, need auth, and are the host's territory anyway.
- **Not the same as `dismiss` or `clear`.** `forgetUser` is a GDPR-scoped operation; the host is expected to gate it behind a compliance workflow, not user UI. No `TrainingChecklist` UI is added.

A new event lands in the dictionary (T-090 will pick it up automatically on regeneration):

```ts
// added to TrainingEventName union
| 'user_forget_requested'

interface UserForgetRequestedPayload {
  userId?: string;
  timestamp: string;
  scope: 'local' | 'remote' | 'both';
}
```

## Alternatives considered

- **A dedicated `GdprAdapter` interface.** Would sit alongside `Analytics` and `Persistence`. Rejected: the operation is rare (one call per request), doesn't need per-host customization beyond what the analytics event covers, and adds a mandatory-implement contract every host would have to fulfil even if they never see a GDPR request in practice.
- **`Persistence.clear(userId)` only.** Rejected: works for browser storage but says nothing about the analytics propagation obligation. Compliance's concern isn't just the local key; it's the whole data-flow story.
- **A REST endpoint on the SDK itself.** Rejected: the SDK is a browser bundle in v1.0-and-earlier, not a service. When v1.0 ships the server-side backend, that backend gets its own admin endpoint — but the browser-facing `forgetUser` stays and forwards to it.
- **No API — document manual cleanup instead.** Rejected: compliance explicitly asked for a programmatic surface so the example app's account-deletion flow can call it from code, not from a runbook.

## Consequences

### Positive

- **One name to teach and audit.** `trainer.forgetUser()` is what compliance, support, and integrating engineers all learn.
- **Doesn't force adapter changes on hosts that haven't wired the sink deletion.** The analytics event fires unconditionally; hosts that don't listen to it simply skip that step.
- **Works with the current v0.1 store shape** — `localStoragePersistence` gets a `clear()` extension in the same v1.0 window, no schema change.
- **Backwards-compat safe** — new method, no breaking type change.

### Negative

- **The receipt's `emittedAnalyticsSignal` is easy to misread as "the sink was cleared."** Doc callout required; consider naming it `emittedHostSignalToClearAnalytics` if the shorter name proves ambiguous in practice.
- **We now have a second event source in the dictionary that isn't tour-lifecycle.** Consumers filtering `training.*` will see it; benign but new.
- **Adds a `userId` concept to the SDK's public API for the first time.** Today the SDK is user-agnostic; the host supplies `userAttributes` for targeting but nothing keys on identity. v1.0 has to formalise this — see the follow-up in Revisit triggers.

### Neutral

- Bundle size: +~1 KB gzipped. Trivial.
- Documentation: one new page (`docs/how-to-handle-gdpr-delete.md`) landing with implementation, not with this ADR.

## Revisit triggers

- **A host product regulated under CCPA or an APAC equivalent needs a differently-shaped API.** The current shape is Article-17-flavoured; other regimes may need a `restrictProcessing` verb or a data-export receipt.
- **A second store type lands** (e.g. IndexedDB for larger persistence). The receipt shape may need per-store granularity.
- **A host asks for sink-side deletion to happen in-SDK.** Would require a `GdprAdapter` interface after all — reopen this ADR.
- **The v1.0 REST API design formalises `userId` differently than assumed here.** ADR-0005 and the REST design must reconcile.
