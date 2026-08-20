# Appcues — Flows

Source: https://docs.appcues.com/flows/what-is-a-flow · Fetched 2026-08-20

## Definition

Multi-step, in-app experiences that guide users through a product. Cover onboarding, feature adoption, feedback collection, announcements.

## Step patterns

- **Modal** — center-positioned overlay with dimmed backdrop. Layouts in legacy: Standard, Sidebar, Full-screen. Flows 2.0 adds configurable backdrop, entrance/exit animations, background styling.
- **Tooltip** — anchored to a UI element via CSS selector. Flows 2.0 adds three backdrop modes (None / Soft spotlight / Hard spotlight), "Advance on target click" toggle, automatic scroll-into-view.
- **Slideout** (legacy only in Flows 2.0 lineage) — edge-appearing overlay, less intrusive than modal, app remains visible behind.
- **Hotspot** (legacy) — simultaneous beacons on one page for non-sequential interaction across multiple targets.

## Content components per step

- Flows 2.0: Text (typography controls), Images (fill modes), Buttons (next/prev, URL nav, close, dismiss, trigger flows, event tracking, snooze).
- Legacy: Text, Images/GIFs, Videos (YouTube, Wistia), Buttons, Forms/surveys, Custom HTML.

## Sequencing

- Flows 2.0: freely mix Modals + Tooltips in sequence without grouping constraints.
- Legacy: steps organized into step-groups by pattern type — affects progress bars, nav buttons, theming, completion requirements.

## Analytics events

- Flows 2.0: `has been seen` · `has been completed` · `has been dismissed` — uniform across step types.
- Legacy: differentiates by pattern — Modals/Slideouts fire "seen"; Tooltips/Hotspots fire "completed" via interaction.

## Advanced

- Localization (built-in, RTL supported).
- Snooze / show-later option in a Flow.
- Per-block or per-step CSS editor.
- Theme system (per-block in 2.0, basic in legacy).
- Integrations: Salesforce v2, HubSpot v2, Slack v2, Zapier, webhooks.

## Not covered on this page (deeper pages exist)

- Multi-page flow spanning route changes.
- Skippable vs required.
- Targeting axes / frequency / priority (see targeting subpages).
- Personalization (user-property injection).
- Redirect steps.

## Comparison against our SDK (v0.1.0-mvp)

- Modal: ✓ (center placement).
- Tooltip: ✓ (`data-tour` anchored).
- Slideout: ○ (planned v0.2).
- Hotspot / simultaneous beacons: ○ (planned v0.2).
- Analytics events (seen/completed/dismissed): ✓ (matches our `tour_started` / `step_viewed` / `step_completed` / `tour_completed` / `tour_dismissed`).
- Snooze: ○ (new backlog candidate).
- Skippable/required: ◐ (all our tours are skippable via X; "required" mode not implemented).
- Personalization / user-property injection: ○ (new backlog candidate — could be simple `{{user.firstName}}` templating in step body).
- Redirect step: ○ (new backlog candidate).
- Per-step CSS editor: ○ (deliberate — we don't have Studio; would happen in JSON if ever).
