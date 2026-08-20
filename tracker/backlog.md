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
| T-060 | Send compliance / security review request | P0 | TODO | v0.1 launch | Blocks prod |
| T-061 | Open AI Platform `data-tour` PR | P0 | TODO | v0.1 launch | Blocks staging |
| T-062 | Confirm or swap analytics sink | P1 | TODO | v0.1 launch | PostHog default; swap is 1 line |
| T-063 | Real AI Platform brand tokens in `aiPlatformTheme` | P1 | TODO | v0.1 launch | Design hand-off |
| T-064 | Content pre-flight — refine + author remaining tours | P1 | TODO | v0.1 launch | Parallel with unblocks |
| T-065 | Staging deploy | P0 | TODO | v0.1 launch | Per `deploy-runbook.md` |
| T-066 | Acceptance suite on staging | P0 | TODO | v0.1 launch | `testing/acceptance-criteria.md` |
| T-067 | Analytics verification on staging | P0 | TODO | v0.1 launch | `testing/analytics-verification.md` |
| T-068 | 5-user usability test | P0 | TODO | v0.1 launch | `testing/five-user-test-protocol.md` |
| T-069 | Merge usability rewrites | P0 | TODO | v0.1 launch | Re-run `validate:content` |
| T-070 | Production deploy + 30-min watch | P0 | TODO | v0.1 launch | Requires compliance approval |
| T-071 | 7-day metrics snapshot vs. success criteria | P1 | TODO | v0.1 launch | Onboarding completion, drop-off, `tour_error` |
| T-072 | Post-launch retro + v0.5 promotion decision | P1 | TODO | v0.1 launch | `releases/v0.1.0-retro.md` + ROADMAP update |
| T-073 | Shepherd.js type coverage — resolve `Cannot find namespace 'Shepherd'` in `Trainer.ts` | P0 | DONE | v0.1 launch | Swapped `import type Shepherd from 'shepherd.js'` for named type imports (`Tour`, `StepOptions`, ...); runtime constructor pulled from the default-export instance. Also swept 3 collateral strict-mode errors surfaced once Shepherd resolved (EventListener + payload casts, `process` guard). `npm run typecheck` / `npm run build` now clean across all 3 workspaces. |
| T-074 | Vue package: implicit-any + strict cleanup | P0 | VERIFY | v0.1 launch | Cannot reproduce after full `npm install --include-workspace-root --workspaces`. The 8 TS7006 errors surface only when Vue's peer dep is missing; once resolved, `defineComponent` types propagate. Re-verify from a clean clone; if reproducible, the fix is dep-hygiene (or add explicit prop types). |
| T-075 | Schema tests: `[data-tour="x"]` fixtures fail kebab min-length | P2 | TODO | hardening | `parseTour` rejects single-char selector ids because the shared regex requires ≥ 2 chars. Either the test data should use 2+ chars (`[data-tour="xx"]`) or the schema should allow single-char ids. Test: `schema.test.ts > parseTour > accepts advanceOn with all supported types`. |
| T-076 | React tests: missing testing-library cleanup between cases | P2 | TODO | hardening | `TrainingChecklist.test.tsx` (3) + `TrainingHint.test.tsx` (1) fail with "Found multiple elements". Vitest is configured with `globals: false`, so `@testing-library/react`'s auto-cleanup is off. Add an `afterEach(cleanup)` to each file, or a shared `tests/setup.ts` wired via `setupFiles`. |

---

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
