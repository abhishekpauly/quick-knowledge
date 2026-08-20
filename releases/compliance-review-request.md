# Compliance / security review request — In-App Training SDK

Paste-ready template. Send to whoever owns security review at UPTIQ (Security team / InfoSec / Compliance).

---

## Subject

`Security review request: @uptiq/training-sdk (internal in-app training system)`

## Summary

We've built an in-house SDK for guided in-app training in UPTIQ products. First customer is the AI Platform. The SDK is code we own end-to-end — no third-party script tags, no external data flow, no third-party services in the runtime. We're requesting a security review before the first production deploy.

## Deployment posture

- **Type:** Two internal npm packages published to UPTIQ's internal registry (not npmjs.org): `@uptiq/training-sdk` (framework-agnostic engine) and `@uptiq/training-sdk-react` / `@uptiq/training-sdk-vue` (framework adapters).
- **How it runs:** Bundled with the host product's frontend build. Loaded in-browser as JS. No server-side component.
- **Where it runs:** Only inside authenticated UPTIQ product apps.
- **Third-party runtime dependencies:** Two.
  - `shepherd.js` (MIT license) — the tooltip rendering engine. Framework-agnostic, ~40KB gzipped.
  - `zod` (MIT license) — schema validator, ~15KB gzipped.
- **Third-party network calls made by the SDK:** Zero. The SDK does not phone home. All communication is with the host product's own analytics sink, via an adapter the host product wires up.

## Data flow

- The SDK reads DOM elements to anchor tooltips. Only elements the host product explicitly tags with `data-tour="..."` attributes are queryable — we enforce this at runtime.
- The SDK writes tour completion state to `localStorage` under a namespaced key (`uptiq-training:*`). No PII stored by default.
- The SDK emits typed events (`tour_started`, `step_viewed`, etc.) to whatever analytics adapter the host product wires. Events include: tour ID, step ID, timestamps, and durations. No PII in the default event schema.
- The host product may pass `userAttributes` to the trainer for targeting / personalization. These stay in-browser and are only echoed to the analytics adapter if the host product's adapter chooses to include them. This is a deliberate choice by the host product, not the SDK.

## Personalization templating

The SDK supports `{{user.firstName}}`-style interpolation into tour copy, drawing from `userAttributes`. **All interpolated values are HTML-escaped** to prevent XSS via a hostile attribute value. Escape logic is in `packages/core/src/schema/personalize.ts` with test coverage in `personalize.test.ts` (see `describe('personalize') > 'escapes HTML in interpolated values to prevent XSS'`).

## Content model

Tour content is authored as JSON files, validated by a Zod schema at build time and runtime. Content lives in a separate content repo (`@uptiq/ai-platform-training-content` per direction). Content changes ship with the product's next release; no dynamic content loading in v0.1.

## Anticipated compliance questions

- **GDPR data deletion.** LocalStorage keys are namespaced; deletion is `localStorage.clear()` scoped to `uptiq-training:*`. A formal GDPR delete API is planned for v1.0.
- **CCPA / user data export.** Same as above; per-user state is browser-local. No server-side user state until v1.0's cross-device persistence backend.
- **Data residency.** N/A — no data leaves the host product's browser session.
- **Cookie / tracker policy.** Uses `localStorage` (functional, not tracking). No cookies.
- **Third-party data-sharing.** None. The SDK's runtime communicates only with the host product's own analytics adapter.

## Threat model summary

- **XSS via user attribute injection** — mitigated by HTML-escaping in `personalize()`.
- **XSS via tour content** — mitigated by content review + validation. Content is code-reviewed (curriculum author + SDK engineer) before merge. No user-editable content.
- **Selector abuse** — the runtime rejects selectors not matching `[data-tour="..."]`. Product engineers can't accidentally point the SDK at password fields or other sensitive elements.
- **Broken analytics sink crashes the tour** — the SDK wraps every `track()` call in try/catch. A failing sink logs and continues.
- **Supply-chain risk** — two runtime dependencies, both MIT, both audited by many downstream users. Snyk / Dependabot / whatever UPTIQ uses will alert on new CVEs.

## What we're asking for

- [ ] Sign-off on shipping to AI Platform staging.
- [ ] Sign-off on shipping to AI Platform production.
- [ ] Any specific requirements we should incorporate (e.g. GDPR delete endpoint on a specific timeline, additional event redaction, specific consent gating).
- [ ] Confirmation that internal npm registry publishing follows any existing UPTIQ internal-package process.

## Timeline

Target: ship to AI Platform staging within `[N business days]`, production within `[N + 7 business days]`. Please flag any process step that would push this timeline back so we can plan accordingly.

## Owners

- SDK / release owner: `[your name]`
- First customer product owner (AI Platform): `[TBD]`
- Curriculum author: `[your name]`

## Attachments / links

- Repo: `[link to internal repo]`
- Architecture: `docs/architecture.md`
- ADRs: `docs/adrs/`
- Threat model detail (this doc): `releases/compliance-review-request.md`
- Test strategy: `testing/test-strategy.md`
- Pre-release manual acceptance suite: `testing/acceptance-criteria.md`
- Analytics adapter contract: `docs/analytics-adapters.md`

Happy to walk through any of the above or provide more detail on specific concerns.
