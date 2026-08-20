# Deploy runbook — v0.1.0-mvp

Environment-agnostic. Fill the `[BRACKETED]` sections with your actual environment details before running through.

## Pre-flight (T -1 day)

- [ ] `data-tour` PR merged to AI Platform frontend main branch. See `releases/ai-platform-data-tour-pr.md`.
- [ ] Compliance sign-off received. See `releases/compliance-review-request.md`.
- [ ] `sample-content-repo/` extracted to its own repo `@uptiq/ai-platform-training-content` and published to `[internal npm registry URL]`.
- [ ] Real analytics adapter wired (NOT `placeholderAnalytics()`). See `docs/wiring-analytics-sink.md`.
- [ ] Theme values replaced with real AI Platform brand tokens (currently stubs in `packages/core/src/theme/default.ts` `aiPlatformTheme`).
- [ ] SDK packages published: `@uptiq/training-sdk`, `@uptiq/training-sdk-react` (and `@uptiq/training-sdk-vue` since the frontend is 50/50).
- [ ] AI Platform frontend has installed all three packages + the content repo package.
- [ ] `<TourProvider>` (React) and `<TourProvider>` (Vue) mounted at appropriate roots.
- [ ] `<FirstRunTour tourId="ai-platform-onboarding">` mounted.
- [ ] `<TrainingChecklist>` mounted.
- [ ] Analytics adapter's sink dashboard is watchable in real time — url: `[BRACKETED]`.

## Staging deploy (T 0, day of)

- [ ] Merge AI Platform frontend PR that consumes the SDK + content packages.
- [ ] Deploy AI Platform frontend to staging via `[BRACKETED — normal AI Platform deploy pipeline]`.
- [ ] Confirm staging URL loads without console errors: `[BRACKETED — staging URL]`.
- [ ] Sign in as a fresh test user (no localStorage).
- [ ] Onboarding tour auto-starts within 2 seconds — smoke pass.
- [ ] Run full manual acceptance suite: `testing/acceptance-criteria.md` (~30 min).
- [ ] Run analytics verification suite: `testing/analytics-verification.md` (~20 min).
- [ ] All checks green.

## 5-user usability test (T 0 or T +1)

- [ ] Follow `testing/five-user-test-protocol.md` end-to-end.
- [ ] Consolidate notes into a rewrite list per the decision rubric in that doc.
- [ ] Rewrite the ~30% of copy that didn't land.
- [ ] Re-deploy the content-only update.
- [ ] Re-verify onboarding tour on a fresh test user.

## Production deploy (T +2)

- [ ] All acceptance criteria green in staging.
- [ ] User-test content revisions merged.
- [ ] Support team briefed (see below).
- [ ] Internal announcement drafted (see below).
- [ ] Deploy AI Platform frontend to production via `[BRACKETED — normal AI Platform prod deploy pipeline]`.
- [ ] Confirm production URL loads without console errors: `[BRACKETED — prod URL]`.
- [ ] Confirm SDK is loaded (check browser devtools for the `@uptiq/training-sdk` bundle).
- [ ] Watch analytics dashboard for 30 minutes post-deploy. Confirm events arriving with expected payloads.

## Post-deploy monitoring (T +2 to T +9)

- [ ] Day of deploy: watch `tour_error` rate every hour for the first 4 hours. Rollback trigger: > 5% of `tour_started`.
- [ ] Day +1: check onboarding completion rate. Rollback trigger: < 20% in the first 24 hours.
- [ ] Day +2 to +7: daily check on completion rate, drop-off by step, and console-error rate.
- [ ] Day +7: hit the success-metrics checklist in `releases/v0.1.0-mvp.md`.
- [ ] Day +9: post-launch retro. Decide on v0.2 promotion signals.

## Support team briefing (T +1)

Send 24 hours before ship. Content:

> The AI Platform will start showing in-app training walkthroughs to users tomorrow. New users will see a ~4-minute onboarding tour automatically on first sign-in. All users will see a small "Getting started" widget in the bottom-right corner they can open anytime.
>
> If users report anything odd (tour not appearing, tooltip in wrong spot, can't close, seeing the tour again after completing it), please tag those tickets `training-sdk` and ping `[YOUR NAME]`.
>
> Users can always skip the tour with the X button.

## Internal announcement (T +2, right after deploy)

Post to `#product-updates` or equivalent:

> **Shipped:** In-app training for AI Platform. New users get a 4-minute onboarding walkthrough on first sign-in. Everyone can open the "Getting started" checklist in the corner anytime. Runs on a new in-house SDK we built to avoid $12–24k/year in Appcues-style licenses per product.
>
> **What to expect:** Completion metrics land in `[YOUR ANALYTICS TOOL]` under `training.*` events. Support has been briefed.
>
> **Adopting for your product?** Ping me — 15 minute setup.

## Rollback (any time metrics trigger it)

See `releases/rollback-runbook.md`. Fast path: revert the AI Platform frontend PR that consumed the SDK. Time to safety: ~10 minutes.

## Owners

- SDK / deploy owner: `[your name]`
- AI Platform frontend on-call: `[TBD]`
- Analytics sink on-call: `[TBD]`
- Support team lead (for briefing): `[TBD]`
