# Appcues — Pins

Source: https://docs.appcues.com/pins/what-are-pins · Fetched 2026-08-20

## Definition

Persistent, always-visible elements attached to specific parts of the UI to give users on-demand help without interrupting their workflow.

## Pin types

- **Icon-with-tooltip** — small icon (`?`, info, custom SVG) that expands into a tooltip with text / image / buttons / HTML / links on hover or click.
- **Button** — clickable button that immediately triggers a Flow or navigates to a URL. No hover-preview.

## Placement

- Anchored to page elements via CSS selector.
- Positioning modes: inline (left or right of target) or overlay (on top of target).

## Persistence

- "Stay visible whenever the user qualifies." Unlike a Flow set to "Show Once," Pins do not disappear after a single view.
- Multiple Pin experiences can display on the same page simultaneously.

## Actions

- Launch a Flow.
- Navigate to a URL / external resource.
- Display contextual help content (icon-with-tooltip mode).

## Styling

- Inherit Theme settings.
- Do NOT support custom CSS.
- Accessible via screen reader + keyboard navigation.

## Targeting

- Respect audience + page targeting.
- No direct localization — workaround is per-language Pin duplicates targeted by user language property.

## Coexistence

- Independent of Flows — both can appear simultaneously without conflict.

## Comparison against our SDK (v0.1.0-mvp)

- Our `<TrainingHint>` covers the icon-with-tooltip variant (hover + click-to-pin). ~70% overlap.
- Button-variant Pin (a persistent button that launches a flow) — ○ new backlog candidate. Could be `<PinButton tourId="...">Learn how to X</PinButton>`.
- Anchoring by CSS selector: our hints are placed inline in JSX (no selector needed since the author positions them). Appcues Pins float over existing UI. Different model — ours is more integrated; theirs is more retrofit-friendly.
- Overlay vs inline placement: our hints are only inline (via JSX). Overlay ○ — surfaces if a Pin needs to attach to an element we can't easily wrap.
- Persistence-when-qualified: ✓ (hints are static in JSX).
- Multiple simultaneous: ✓.
- Localization: ○ (planned v0.2 for whole schema — will cover hints).
