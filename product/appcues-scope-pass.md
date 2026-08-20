# Appcues scope pass — per-category gap analysis

A structured comparison of Appcues' 7 web experience types against our roadmap. Written after fetching each Appcues subpage and taking factual notes in `docs/competitive-research/appcues/`.

**Purpose:** Confirm the tier plan in `product/roadmap-to-parity.md` still covers the right scope. Surface new backlog candidates. Recommend any tier adjustments.

**TL;DR:** The roadmap holds. **10 new small backlog candidates** surfaced. **No non-goal reopened.** Two candidate re-orderings within v0.5.

## Summary table

Legend: **✓** shipped in v0.1 · **◐** partial today · **○** planned in tier shown · **✗** deliberate non-goal · **+** new candidate this pass surfaced

| Appcues capability | Status | Tier | Notes |
| --- | --- | --- | --- |
| **Flows — Modal step** | ✓ | v0.1 | Via center placement |
| **Flows — Tooltip step** | ✓ | v0.1 | `data-tour` anchored |
| **Flows — Slideout step** | ○ | v0.2 | Already planned |
| **Flows — Hotspot / beacon step** | ○ | v0.2 | Already planned |
| **Flows — Redirect step** | ○ | v0.2 **+** | **New candidate** — small; tour step that navigates the user |
| **Flows — Snooze / show-later** | ○ | v0.5 **+** | **New candidate** — "remind me tomorrow" button on any step |
| **Flows — Skippable vs required** | ◐ | v0.5 **+** | **New candidate** — currently all tours are skippable; "required" mode for critical onboarding |
| **Flows — Personalization (`{{user.firstName}}`)** | ○ | v0.2 **+** | **New candidate** — small; Mustache-style templating in step body |
| **Flows — Localization** | ○ | v0.2 | Already planned (schema v2) |
| **Flows — Content: images/GIFs** | ◐ | v0.2 **+** | **New candidate** — schema supports `media`; renderer doesn't yet |
| **Flows — Content: video (YouTube/Wistia)** | ○ | v0.5 **+** | **New candidate** — embed as iframe block |
| **Flows — Content: custom HTML** | ○ | v0.5 **+** | **New candidate** — sanitized HTML block for edge cases |
| **Flows — Per-step CSS** | ✗ | Never | Requires Studio; deliberate non-goal. Author style via theme tokens instead |
| **Pins — Icon-with-tooltip** | ✓ | v0.1 | `<TrainingHint>` |
| **Pins — Button variant (persistent CTA that launches a flow)** | ○ | v0.5 **+** | **New candidate** — `<PinButton tourId="...">Learn how</PinButton>` |
| **Pins — Overlay-on-target (vs inline)** | ○ | v0.5 **+** | **New candidate** — some products can't wrap the target in JSX; need a floating variant that attaches to a `data-tour` selector |
| **Embeds** | ○ | v1.0 | Already planned |
| **Checklists — Core floating widget** | ✓ | v0.1 | `<TrainingChecklist>` |
| **Checklists — Congratulations screen on completion** | ○ | v0.5 **+** | **New candidate** — small, delightful |
| **Checklists — External URL items** | ○ | v0.5 **+** | **New candidate** — link to a doc or changelog, not just a tour |
| **Checklists — Auto-completion via event/property** | ○ | v0.5 **+** | **New candidate** — item ticks when e.g. `workflow_created` fires |
| **Checklists — Account-wide completion** | ○ | v1.0 | **Needs persistence backend** — depends on cross-device sync. Already tied to v1.0 timing |
| **Checklists — Auto-suppress under active tour** | ○ | v0.2 **+** | **New candidate** — one-liner: hide pill when `getActiveTourId() !== null` |
| **Banners** | ○ | v0.5 | Already planned |
| **Launchpads — Core widget** | ○ | v0.5 | Already planned; recommend building as separate component from Checklist (not merged) |
| **Launchpads — Knowledge base search** | ○ | v0.5 | Already planned; ship one integration first (whichever UPTIQ uses) |
| **Launchpads — Auto icon-merge with Checklist** | ○ | v0.5 **+** | **New candidate** — subtle UX detail |
| **NPS — Core survey** | ○ | v0.5 | Already planned |
| **NPS — Score-based property (for downstream targeting)** | ○ | v0.5 | Depends on v0.2 property targeting — sequence v0.2 before NPS |
| **NPS — Branching follow-up (per bucket)** | ○ | v1.0 **+** | **New candidate** — nudges schema v2 with branching support |
| **Surveys/Forms — Rating** | ○ | v0.5 | Already planned |
| **Surveys/Forms — Single/multi-select** | ○ | v0.5 | Already planned |
| **Surveys/Forms — Text short/long** | ○ | v0.5 | Already planned |
| **Surveys/Forms — Required + validation** | ○ | v0.5 | Already planned |
| **Surveys/Forms — Typeform iframe embed** | ○ | v0.5 | Already planned (via generic iframe content block) |
| **Targeting — Property-based** | ○ | v0.2 | Already planned. **Sequence before NPS since NPS depends on it** |
| **Targeting — Segments (reusable audience defs)** | ○ | v0.5 | Already planned |
| **Targeting — Permalinks** | ○ | v0.2 | Already planned |
| **Targeting — Frequency limits** | ○ | v0.2 | Already planned |
| **Targeting — Flow priority** | ○ | v0.2 | Already planned |
| **Targeting — Scheduling (start/end datetimes)** | ○ | v0.5 **+** | **New candidate** — trivial extension of trigger metadata; Appcues has this for Banners and Flows |
| **Studio (visual no-code builder)** | ✗ | Never | Non-goal per `vs-appcues.md` |
| **Mobile SDKs** | ✗ | Never | Non-goal |
| **Multi-channel Workflows** | ✗ | Never | Non-goal |
| **Full Analytics Studio** | ✗ | Sprint 18–20 (lightweight aggregator only) | Non-goal for full replica |

**Totals:**
- **Shipped in v0.1:** 6 capabilities.
- **Planned in existing tiers:** 16 capabilities.
- **New candidates surfaced this pass:** **10 (or 14 if you count the trivial ones)**.
- **Deliberate non-goals:** 4 major (Studio, Mobile, Workflows, Analytics Studio) + 1 minor (per-step CSS).

## Sequencing recommendation

Two small re-orderings inside v0.2:

1. **Move personalization (`{{user.firstName}}`) into v0.2.** Trivial (~2 days), and it's the single most-requested feature in every SaaS training tool. Push nothing out to make room — it fits.
2. **Move "auto-suppress checklist under active tour" into v0.2.** One-liner UX fix; catch it while we're already in the widget code for the reactive count fix.

Inside v0.5, one sequencing note:

- **Ship property targeting (v0.2) before NPS (v0.5)** so NPS-score-based downstream flow targeting works from day one. This is naturally already sequenced correctly by tier, but worth calling out — if v0.2 slips, NPS's downstream story slips with it.

## Ten new backlog candidates (from this pass)

Add to `tracker/backlog.md` when we open v0.2 planning. In rough priority order:

1. **Personalization templating** (`{{user.firstName}}` in step body) — v0.2, ~2 days.
2. **Auto-suppress checklist under active tour** — v0.2, ~1 hour.
3. **Redirect step type** — v0.2, ~2 days.
4. **Image/GIF rendering in step body** (schema already supports; renderer doesn't) — v0.2, ~1 day.
5. **Scheduling (start/end datetimes on triggers)** — v0.5, ~2 days.
6. **Snooze / show-later button** — v0.5, ~2 days.
7. **"Required" mode for critical tours (can't skip)** — v0.5, ~1 day. Use sparingly.
8. **Congratulations screen on checklist completion** — v0.5, ~2 days.
9. **External URL items in checklist** — v0.5, ~2 days.
10. **Auto-completion of checklist items via event/property** — v0.5, ~4 days.

Total additional effort at v0.2: ~1 week. At v0.5: ~2 weeks. Both absorb without pushing the tier boundaries.

## Design decisions worth locking now (before v0.2 PRDs)

Three questions this pass surfaced that need a decision before we start writing PRDs:

- **Merge Launchpad and Checklist into one widget, or keep separate?** Recommend keep separate — Appcues, Pendo, Chameleon, and Intercom all do; users know both patterns.
- **Ship Pin-button variant (persistent CTA that launches a tour) or route through the launchpad?** Recommend ship — smaller, more flexible, and Appcues treats them as different UX patterns for good reason.
- **Overlay-on-target hint variant (attaches to a `data-tour` selector at runtime, vs. our current inline-in-JSX only)?** Recommend defer to v1.0 unless a real UPTIQ product asks. Inline JSX is cheaper for product teams to ship.

## Non-goals reconfirmed

Nothing in this pass challenged the four locked non-goals:

1. **Mobile SDKs** — Appcues has iOS/Android/RN/Flutter for every category. Not touching.
2. **Visual no-code Studio** — per-step CSS editor, in-Studio content authoring, WYSIWYG placement — none of it.
3. **Multi-channel Workflows** — email + push orchestration off the table.
4. **Full Analytics Studio** — funnels, saved charts, in-SDK dashboards. Only the lightweight cross-product aggregator at Sprint 18–20.

## Where our design is genuinely better

Worth noting explicitly for the pitch:

- **Uniform analytics event model.** Appcues' legacy differentiates Modal-seen from Tooltip-completed (Flows 2.0 unifies this, but there's a migration story). We landed on the uniform model in v0.1.
- **Checklist positioning.** Appcues supports two corners. We support four.
- **Adapter model beats an integration hub.** Appcues has to build a Salesforce integration, a HubSpot integration, a Slack integration. We hand the customer an interface and they wire it in an afternoon.
- **Content in git.** Diffable, reviewable, revertible. Studio-authored content in Appcues is proprietary and requires their UI to inspect history.

## What to do next

1. Add the 10 new candidates to `tracker/backlog.md` under v0.2 and v0.5 sections when we start v0.2 planning.
2. Answer the three design decisions above.
3. When ready to write a real PRD, pick one (recommend Hotspots or Slideout) and follow the workflow: fetch the corresponding Pendo + Userpilot pages first, add sibling folders under `docs/competitive-research/`, then draft the PRD from `features/_template.md` citing all three sources in Prior Art.

## Related

- Raw research notes per feature: [`docs/competitive-research/appcues/`](../docs/competitive-research/appcues/README.md).
- Strategic direction + non-goals: [`vs-appcues.md`](./vs-appcues.md).
- Tiered path: [`roadmap-to-parity.md`](./roadmap-to-parity.md).
- Sprint-level roadmap: root [`ROADMAP.md`](../ROADMAP.md).
