# Appcues — Launchpads

Source: https://docs.appcues.com/launchpads/what-are-launchpads · Fetched 2026-08-20

## Definition

In-app content centers (a.k.a. resource centers or help widgets). Users access support materials without workflow interruption.

## Content blocks

- **Links block** — group of items that open external URLs or trigger published Flows. Layout: vertical list or horizontal grid.
- **Flow list block** — dynamically generated list of published Flows the user qualifies for. Respects each Flow's own audience targeting.
- **Knowledge base search** — integrates with Freshdesk, Helpjuice, or Zendesk. Users search KB directly inside the widget.

## Positioning

- **Floating** — fixed corner position, visible while scrolling.
- **Inline** — embedded in page layout, positioned via CSS selector.

## Behavior

- Multiple Launchpads can coexist for qualifying users.
- Flows require explicit enablement to appear in Launchpads.
- Flows in a Flow-list block respect their own audience targeting.
- Flows in a Links item render regardless of targeting.
- Automatic icon-merging when both Launchpad and Checklist would occupy the same location.
- Localization supported.
- Independent page + audience targeting per Launchpad.

## Triggering

- Flows can be configured "manually only" — they appear only when clicked inside the Launchpad, not via first-run or URL triggers.

## Comparison against our SDK (v0.1.0-mvp)

- ◐ Our `<TrainingChecklist>` overlaps significantly — floating corner widget, list of tours grouped by difficulty. But we don't yet:
  - External URL items (links to docs, blog posts, changelogs).
  - Knowledge base search integration.
  - Static Links group vs dynamic Flow list distinction.
  - Auto icon-merge when checklist + launchpad both would render.
- Planned as a dedicated widget in v0.5. Two paths:
  1. Extend `<TrainingChecklist>` to accept external-link items and a search integration — one widget, two roles. Simpler but conflates concepts.
  2. Ship `<TrainingLaunchpad>` as a separate component. Cleaner separation, more code.
  - Recommend path 2 for v0.5 PRD, since Appcues, Pendo, Chameleon, and Intercom all treat them as separate widgets — and users know both patterns.
- KB search: integration-hub territory. Freshdesk / Helpjuice / Zendesk each have public search APIs. Ship one integration (whichever UPTIQ uses) as v0.5; add others when triggered.
- Auto icon-merge (when both a checklist and a launchpad would appear in the same corner): worth including in v0.5 spec — a subtle UX detail that matters a lot in the wild.
