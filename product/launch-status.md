# v0.1.0-mvp launch status

**Status:** Engineering complete. Awaiting three operational human tasks before production.
**Last updated:** 2026-08-20

## What's done

Everything the SDK team can do without external inputs. All engineering, all documentation, all templates, all tests.

### Code
- ✅ Core engine (`@uptiq/training-sdk`) — Trainer, targeting, triggers, advance-on, schema, adapters, theme.
- ✅ React adapter (`@uptiq/training-sdk-react`) — provider, hooks, checklist, hint, first-run.
- ✅ Vue adapter (`@uptiq/training-sdk-vue`) — API-parity port of React adapter (un-deferred once we learned the AI Platform frontend is 50/50).
- ✅ PostHog analytics adapter (`posthogAnalytics()`) wired as the default. Any other sink is a one-line swap using `docs/wiring-analytics-sink.md`.
- ✅ 45+ tests across three packages. Schema, engine lifecycle, targeting, triggers, advance, audience, localization, personalization, frequency, permalinks, PostHog, React provider + hooks, Vue provider + hooks + hints.

### Content
- ✅ Sample content in `content/ai-platform/` — onboarding tour + create-workflow tour + hints.
- ✅ Content-repo pattern documented and scaffolded (`sample-content-repo/` + `docs/content-repos.md`) per direction (separate repo per product).

### v0.1 features (per `releases/v0.1.0-mvp.md`)
- ✅ FEAT-001 Core tour engine.
- ✅ FEAT-002 JSON content schema v1 + Zod validation.
- ✅ FEAT-003 `data-tour` CI validator.
- ✅ FEAT-004 React adapter.
- ✅ FEAT-005 Analytics adapter interface + concrete PostHog implementation.
- ✅ FEAT-006 LocalStorage persistence.
- ✅ FEAT-007 CSS-variable theming.
- ✅ FEAT-008 Advanced targeting (wait-for-element, URL trigger, event trigger, advance-on).
- ✅ FEAT-009 Checklist widget.
- ✅ FEAT-010 Contextual `<TrainingHint>`.

### v0.2 (bonus — landed alongside v0.1 prep in Sprints 5 & 6)
- ✅ Property-based audience targeting.
- ✅ Localization (schema-additive).
- ✅ Personalization templating.
- ✅ Image/GIF rendering.
- ✅ Frequency limits.
- ✅ Flow priority.
- ✅ Permalinks.
- ✅ Slideout / hotspot / redirect step types.
- ✅ Vue adapter.

### Documentation
- ✅ Architecture, ADRs 0001–0004, content schema, `data-tour` conventions.
- ✅ How-to-integrate (for host product teams).
- ✅ How-to-author-a-tour (for the curriculum author).
- ✅ Analytics adapter cookbook (7 recipes).
- ✅ Content-repos model.
- ✅ Wiring the analytics sink.
- ✅ 5-user usability test protocol.
- ✅ Analytics verification checklist.

### Release artifacts
- ✅ Deploy checklist.
- ✅ Deploy runbook (environment-agnostic).
- ✅ Rollback runbook.
- ✅ AI Platform data-tour PR description template.
- ✅ Compliance / security review request template.
- ✅ v0.1.0-mvp release plan.
- ✅ Product overview / use cases / ROI / how-to-use.
- ✅ Appcues comparison + scope-pass + roadmap-to-parity.

### Product management
- ✅ ROADMAP with tiered plan (v0.1 shipped, v0.2 substantially done, v0.5 / v1.0 scoped, non-goals codified).
- ✅ Feature specs FEAT-001..FEAT-015.
- ✅ Backlog with all tasks marked.

## What's still on the human's plate

Three items. All external, none engineering. Ordered.

### 1. Send the compliance / security review request  →  Estimated 3–7 business days

- **What to do:** Take `releases/compliance-review-request.md`. Fill the `[bracketed]` sections (owner names, timelines, links). Send to whoever owns InfoSec at UPTIQ.
- **Blocks:** Production deploy. Staging deploy MAY be OK before this depending on your org — check.
- **My assumption:** standard internal review, few days to complete. If they push back, most concerns are pre-addressed in the request; be ready to walk them through the personalization XSS mitigation and the "no third-party network calls" posture.

### 2. Send the `data-tour` PR to the AI Platform frontend team  →  Estimated 1–3 business days

- **What to do:** Take `releases/ai-platform-data-tour-pr.md`. Fill the file paths and reviewer names. Open the PR against the AI Platform frontend repo.
- **Blocks:** Staging deploy of the SDK (nothing to attach tours to until the attributes exist).
- **My assumption:** senior frontend reviewer fast-tracks; changes are one-line attribute additions with zero behavior change. If it stalls, escalate — that's the correct move for a purely-mechanical safe PR.

### 3. Confirm PostHog is actually your sink OR swap the adapter  →  Estimated 15 minutes

- **What to do:** Confirm PostHog is what AI Platform uses. If yes, no work. If not, swap the constructor call in `[wherever you construct the Trainer]` — one line per `docs/wiring-analytics-sink.md`.
- **Blocks:** Nothing hard — the placeholder adapter shipped can be used through staging and swapped anytime.
- **My assumption:** PostHog was a defensible default given the AI-startup context. Any sink is 15 minutes to swap.

## What happens once those are done

Follow `releases/deploy-runbook.md`:

- **Day 0:** staging deploy → manual acceptance suite → analytics verification → 5-user usability test → content revisions.
- **Day +2:** production deploy → 30-minute post-deploy watch → support team briefed → internal announcement posted.
- **Days +2 to +7:** watch metrics against `releases/v0.1.0-mvp.md` success criteria.
- **Day +9:** post-launch retro. Decide on v0.5 promotion signals.

## What you can do in parallel while blocked

Nothing that changes v0.1's outcome. But if you want to keep the momentum, these are all safe:

- Write the actual AI Platform content — refine the 2 existing tours based on how they'll really flow, author the intermediate + common-task tours, refine the hints. All authorable now without env access.
- Get the real AI Platform brand tokens from design and swap into `packages/core/src/theme/default.ts` `aiPlatformTheme` (currently placeholder values).
- Send a heads-up to the AI Platform PM that this is coming so they can weigh in on the checklist widget's default position + label.
- Scout a second UPTIQ product to be adopter #2 once v0.1 ships. The whole cross-product ROI story rests on adopter #2 showing up.

## Contact for the operational stage

- Compliance follow-up: `[your contact info]`
- Frontend PR review: `[reviewer name]`
- Post-launch triage: `[on-call rotation]`

## Where to find things

- Code: `packages/core/`, `packages/react/`, `packages/vue/`.
- Docs: `docs/` and `product/`.
- Operational artifacts: `releases/`.
- Tracking: `tracker/backlog.md`, `tracker/sprint-01.md` through `tracker/sprint-05.md`.
- Living plan-of-record: the "In-App Training" Claude project.
