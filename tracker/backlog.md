# Backlog

The single source of truth for everything on the plate. One row per task. Update status inline. Grouped by sprint; deferred items live at the bottom.

Status: `TODO` · `IN PROGRESS` · `DONE` · `BLOCKED` · `DEFERRED` · `DROPPED`
Priority: `P0` (blocker) · `P1` (must for MVP) · `P2` (nice-to-have) · `P3` (future)

---

## Sprint 01 — Days 1–3 · Live prototype in QA

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-001 | Fork Shepherd.js example, set up local dev | P0 | TODO | FEAT-001 | ~30 min |
| T-002 | Pick target screen in AI Platform QA env | P0 | TODO | FEAT-001 | Suggest onboarding/dashboard |
| T-003 | Add `data-tour` attributes to 5-8 target elements | P0 | TODO | FEAT-001 | Coordinate PRs with product engineers |
| T-004 | Hardcode Tour A (onboarding, ~6 steps) as JS objects | P0 | TODO | FEAT-001 | |
| T-005 | Hardcode Tour B (one basic workflow, ~4 steps) as JS objects | P0 | TODO | FEAT-001 | |
| T-006 | Verify tours run end-to-end in QA | P0 | TODO | FEAT-001 | Manual test |
| T-007 | Record 60s screencast for internal demo | P1 | TODO | — | Success signal |

## Sprint 02 — Days 4–8 · MVP as a real package

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-010 | Extract engine into `@uptiq/training-sdk` npm workspace | P0 | TODO | FEAT-001 | |
| T-011 | Define Zod v1 schema in `src/schema/v1.ts` | P0 | TODO | FEAT-002 | Mirror `docs/content-schema.md` |
| T-012 | Content loader: `loadContent(dir): Tour[]` | P0 | TODO | FEAT-002 | |
| T-013 | Migrate Tour A + Tour B to JSON | P0 | TODO | FEAT-002 | |
| T-014 | Author 3 more tours (basic + intermediate + common task) | P0 | TODO | FEAT-002 | Curriculum work |
| T-015 | Wire `data-tour` attributes for new tours | P0 | TODO | FEAT-003 | |
| T-016 | Implement LocalStorage persistence adapter | P1 | TODO | FEAT-006 | |
| T-017 | CSS variables + AI Platform theme | P1 | TODO | FEAT-007 | |
| T-018 | Console analytics adapter | P1 | TODO | FEAT-005 | Real sink in Sprint 03 |
| T-019 | `npm run validate:content` script | P0 | TODO | FEAT-002 | |

## Sprint 03 — Days 9–14 · Reusability layer

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-020 | `@uptiq/training-sdk-react` package + `<TourProvider>` | P0 | DONE | FEAT-004 | `packages/react/src/TourProvider.tsx` |
| T-021 | `useTour()` and `useTourProgress()` hooks | P0 | DONE | FEAT-004 | + bonus: `<FirstRunTour>` |
| T-022 | `npm run validate:selectors` script | P0 | DONE | FEAT-003 | Delivered in Sprint 02 |
| T-023 | Wire real analytics adapter (AI Platform sink) | P0 | DONE | FEAT-005 | `posthogAnalytics()` shipped as chosen default. Swap via docs/wiring-analytics-sink.md if needed. |
| T-024 | Write "How to integrate" doc | P0 | DONE | — | `docs/how-to-integrate.md` |
| T-025 | Write "How to author a tour" doc | P0 | DONE | — | Delivered in Sprint 02 |
| T-026 | Public API docs (inline JSDoc + README) | P1 | DONE | — | TypeDoc HTML deferred to v0.2 |

## Sprint 04 — Days 15–21 · Hardening + real users

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-030 | Advanced targeting (wait-for-element, retry) | P1 | DONE | FEAT-008 | `targeting.ts` |
| T-031 | URL trigger + event trigger | P1 | DONE | FEAT-008 | `triggers.ts`, wired for SPA nav |
| T-032 | Checklist widget component | P1 | DONE | FEAT-009 | `TrainingChecklist.tsx` |
| T-033 | Contextual `<TrainingHint>` component | P2 | DONE | FEAT-010 | + hints schema + `HintsProvider` |
| T-034 | Deploy to AI Platform staging | P0 | BLOCKED | — | Env access needed. Checklist ready. |
| T-035 | 5-user usability test | P0 | BLOCKED | — | Protocol in `testing/five-user-test-protocol.md` |
| T-036 | Ship to production | P0 | BLOCKED | — | See `releases/v0.1.0-mvp.md` |
| T-037 | Verify analytics events flowing end-to-end | P0 | BLOCKED | FEAT-005 | Checklist in `testing/analytics-verification.md` |

## Sprint 05 — v0.2 kickoff · Targeting + polish

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-040 | Property-based audience targeting | P1 | TODO | v0.2 | Foundation for NPS + segmentation later |
| T-041 | Localization (schema-additive) | P1 | TODO | v0.2 | String or `{locale: string}` |
| T-042 | Personalization templating `{{user.firstName}}` | P1 | TODO | v0.2 | From Appcues scope pass |
| T-043 | Image/GIF rendering in step body | P2 | TODO | v0.2 | Schema already supports; renderer only |
| T-044 | Auto-suppress checklist under active tour | P2 | TODO | v0.2 | Trivial UX fix |
| T-045 | Reactive checklist pill count | P2 | TODO | v0.2 | `useAllTourProgress` hook |
| T-046 | Tests for Sprint 5 additions | P1 | TODO | — | |
| T-047 | Docs + CHANGELOG + roadmap tick-off | P1 | TODO | — | |

## Sprint 06 (planned) — v0.2 targeting rest

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-050 | Frequency limits | P1 | TODO | v0.2 | Per-tour + global caps |
| T-051 | Flow priority / ordering | P1 | TODO | v0.2 | When multiple qualify |
| T-052 | Permalinks | P1 | TODO | v0.2 | Deep link into any tour, bypass targeting |
| T-053 | Slideout step pattern | P1 | TODO | v0.2 | Shepherd supports natively |
| T-054 | Hotspot / beacon pattern | P1 | TODO | v0.2 | |
| T-055 | Redirect step type | P2 | TODO | v0.2 | From Appcues scope pass |

---

## Sprint 07 (planned) — launch + hardening

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-060 | Send compliance / security review request | P0 | DONE | v0.1 launch | Ticket SEC-1187. Approved for staging + prod, with two v1.0-scoped follow-ups (GDPR delete API, consent hook). |
| T-061 | Open AI Platform `data-tour` PR | P0 | DONE | v0.1 launch | ai-platform-frontend#4291 merged. 9 selectors added. |
| T-062 | Confirm or swap analytics sink | P1 | DONE | v0.1 launch | Confirmed PostHog. No adapter swap. |
| T-063 | Real AI Platform brand tokens in `aiPlatformTheme` | P1 | DONE | v0.1 launch | Tokens from AI Platform design system v2.4. |
| T-064 | Content pre-flight — refine + author remaining tours | P1 | DONE | v0.1 launch | 3 draft tours filled: basic-2 Import dataset, intermediate Scheduled workflow, common-task Share workflow. |
| T-065 | Staging deploy | P0 | DONE | v0.1 launch | v0.1.0-rc.1 to AI Platform staging Day 30. |
| T-066 | Acceptance suite on staging | P0 | DONE | v0.1 launch | All P0/P1 items ✅ Day 30. |
| T-067 | Analytics verification on staging | P0 | DONE | v0.1 launch | Every event fires. 1 dashboard-side filter typo caught + fixed. |
| T-068 | 5-user usability test | P0 | DONE | v0.1 launch | Day 31. 4 rewrite items, 0 blocking bugs. |
| T-069 | Merge usability rewrites | P0 | DONE | v0.1 launch | 4 rewrites merged. validate:content green. Cut rc.2. |
| T-070 | Production deploy + 30-min watch | P0 | DONE | v0.1 launch | Day 33 10:14 UTC. Watch clean. |
| T-071 | 7-day metrics snapshot vs. success criteria | P1 | DONE | v0.1 launch | Every target hit. Snapshot in v0.1.0-mvp.md. |
| T-072 | Post-launch retro + v0.5 promotion decision | P1 | DONE | v0.1 launch | Retro filled. v0.5 verdict: Pins + Goals go, others hold/drop. |
| T-073 | Shepherd.js type coverage — resolve `Cannot find namespace 'Shepherd'` in `Trainer.ts` | P0 | DONE | v0.1 launch | Blocks `npm run build` on core. Fix: install types, pin version with types, or write ambient .d.ts |
| T-074 | Vue package: implicit-any + strict cleanup | P0 | DONE | v0.1 launch | 8 TS7006 errors in `TrainingChecklist.ts`, `useTour.ts`, `useTourProgress.ts` under strict mode |
| T-075 | Wire GitHub Actions CI (`.github/workflows/ci.yml`) — runs `npm ci && npm run build && npm run ci` on push/PR to main | P0 | DONE | v0.1 launch | Deploy checklist requires "all CI jobs green on main"; previously there were no jobs |
| T-076 | Make CI a required status check for `main` in repo Settings → Rules | P1 | DONE | v0.1 launch | Configured in repo Settings → Rules. CI is now a required check for main. |
| T-077 | Wire Dependabot (`.github/dependabot.yml`) — weekly npm + github-actions bumps | P2 | DONE | v0.1 launch | Fulfils compliance-review-request.md promise of automatic CVE alerting |
| T-078 | Core coverage gap: raise functions from 73.73% → 80% | P2 | DONE | v0.1 launch | Added analytics-adapters.test.ts (all 4 factories × their track methods), theme.test.ts (applyTheme merge + skip-undefined + default root), 6 more trainer smoke tests (getTours, getActiveTourId, dismiss no-op, dismiss active, next/prev idle). Core coverage now lines 86.92 / statements 86.92 / functions 81.55 / branches 77.25. |
| T-079 | React coverage gap: `FirstRunTour.tsx` untested (0%) | P2 | DONE | v0.1 launch | Added 7 FirstRunTour tests + 2 TrainingHint tests + 1 TrainingChecklist test. React coverage now lines 97.62 / statements 97.62 / functions 80.76 / branches 85.18 — all above thresholds. |
| T-080 | Vue coverage gap: 3 files fully untested (`FirstRunTour.ts`, `TrainingChecklist.ts`, `useAllTourProgress.ts` + `useTourProgress.ts`) | P1 | DONE | v0.1 launch | Added FirstRunTour.test.ts (7 tests), TrainingChecklist.test.ts (7 tests), useTourProgress.test.ts (7 tests covering both hooks). Vue coverage now lines 95.1 / statements 95.1 / functions 80.64 / branches 85.83 — all above thresholds. |
| T-081 | Promote CI coverage step from informational to blocking | P2 | DONE | v0.1 launch | Dropped `continue-on-error: true` from `.github/workflows/ci.yml`. Coverage regressions now fail the build. |

---



## Sprint 08 (planned) — bridge into v0.5

| ID | Task | Priority | Status | Feature | Notes |
| --- | --- | --- | --- | --- | --- |
| T-090 | Event dictionary exporter (`docs/event-dictionary.md` + JSON) | P1 | DONE | v0.2 tail | `scripts/generate-event-dictionary.ts` parses `events.ts` via TS compiler API. `npm run docs:events` regenerates; `npm run docs:events:check` fails CI on drift. 6 events emitted. |
| T-091 | Investigate `create-project → user-menu` drop-off (12 pts) | P1 | DONE | v0.2 tail | 65% class-A (went-to-goal), 15% B (abandoned), 10% C (confused), 10% D. Hypothesis confirmed. Do not "fix" the tour; adopt Goals to measure correctly. `product/investigations/onboarding-drop-off-s08.md`. |
| T-092 | `TrainingChecklist` `preferredCorners` prop (React + Vue) | P1 | DONE | v0.2 | Shared `pickFreeCorner` via `elementFromPoint` per package. Widget marks itself with `data-uptiq-training="1"` so re-probes on resize do not disqualify our own corner. React + Vue parity. 12 new tests (6 shared logic × 2 packages). |
| T-093 | v1.0 compliance follow-ups — ADR-0005 (GDPR delete API) + ADR-0006 (consent gating hook) | P2 | DONE | v1.0 prep | ADR-0005 spec: `trainer.forgetUser(userId?)` returning a receipt; analytics is a host-signalled event, not a sink call. ADR-0006 spec: `ConsentAdapter` on `TrainerConfig` + `consentCategory` on tour schema, dual gating (execution + emission). Both design-only; implementation lands in v1.0. |
| T-094 | Adopter-#2 outreach calls (Workbench PM, Insights PM) | P1 | DONE | v0.5 prep | Both calls held. Workbench = GO (React, real pain, sponsor). Insights = DEFER to Pins (Vue, low tour pain but Pins fit). |
| T-095 | `product/adopter-scouting.md` capture | P1 | DONE | v0.5 prep | Adopter #2 = Workbench (Sprints 10–11). Adopter #3 = Insights via Pins-first (Sprints 10–11). Both on PostHog. |
| T-096 | `product/v0.5-kickoff.md` — Pins + Goals scope | P1 | DONE | v0.5 | Pins: `*.pins.json` schema + PinsProvider/Pin (React + Vue) + 2 events. Goals: additive tour field + `GoalsSink` on TrainerConfig + 2 events + PostHog/Amplitude recipes. Explicit non-goals; Sprint 9 + 10–11 shapes; success criteria per feature. |
| T-097 | CHANGELOG + roadmap tick-off | P2 | DONE | — | Sprint 08 additions logged. ROADMAP Sprint 08 line flipped to shipped. |

## Deferred (post-MVP)

| ID | Task | Priority | Status | Feature | Trigger |
| --- | --- | --- | --- | --- | --- |
| T-100 | Vue adapter | P3 | DEFERRED | FEAT-011 | A Vue product commits |
| T-101 | Admin authoring UI | P3 | DEFERRED | FEAT-012 | Author velocity < 1/hour |
| T-102 | Sandbox mode | P3 | DEFERRED | FEAT-013 | A specific tour needs it |
| T-103 | Segmentation | P3 | DEFERRED | FEAT-014 | AI Platform PM asks |
| T-104 | A/B testing hooks | P3 | DEFERRED | FEAT-015 | Two viable variants ready |
| T-105 | Cross-device persistence backend | P3 | DEFERRED | — | Cross-device UX complaint |

---

## Open questions — resolved

All engineering-blocking questions closed. Remaining items are external actions tracked in `product/launch-status.md`.

- [x] Analytics sink → **PostHog** wired as default. `posthogAnalytics()` shipped. Swap via `docs/wiring-analytics-sink.md` if AI Platform confirms a different tool.
- [x] Frontend framework mix → **50/50 React and Vue**. Both adapters shipped (React `@uptiq/training-sdk-react`, Vue `@uptiq/training-sdk-vue`).
- [x] SDK name → **Keep `@uptiq/training-sdk`** (working name is final).
- [x] Content location → **Separate content repo per product** (`sample-content-repo/` scaffolds the pattern; `docs/content-repos.md` documents it).
- [x] Compliance / security review path → **Templated in `releases/compliance-review-request.md`**. Send when ready.

## Open items — external only (not blocking engineering)

Tracked in `product/launch-status.md`:

- Send the compliance review request (est. 3–7 business days).
- Send the AI Platform `data-tour` PR (est. 1–3 business days).
- Confirm PostHog is the actual sink OR swap the adapter (est. 15 minutes).
