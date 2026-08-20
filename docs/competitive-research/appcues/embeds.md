# Appcues — Embeds

Source: https://docs.appcues.com/web-embeds/what-are-embeds · Fetched 2026-08-20

## Definition

Appcues content placed inside the product's layout — inline with the UI, not layered on top. Renders within the DOM structure rather than overlaying it.

## Placement

- Target CSS selector.
- Three placement modes: **Append** (after existing element), **Prepend** (before), **Replace** (swap out the element).

## Content types

- Text, Button, Image, iFrame.
- Multi-step embeds via carousel-style navigation within the same container.

## Coexistence

- Multiple Embeds can display on one page.
- Only one Flow shows per user at a time — Embeds do not have this restriction.

## Differences from other patterns

- **vs Flows:** Flows overlay (modal/slideout requiring interaction); Embeds render inline and feel native.
- **vs Pins:** Pins are hoverable icons; Embeds inject richer content directly into the page.
- **vs Banners:** Banners fix to top/bottom; Embeds target any layout element and support multi-step + iframes.

## Targeting

- Standard audience / property / page / event targeting.
- Dismiss options: permanent or temporary; optional close button.

## Use cases (from docs)

- Contextual onboarding + adoption guidance.
- In-context help + explanations.
- Upsells + feature highlights.
- Personalized nudges based on behavior or lifecycle stage.

## Comparison against our SDK (v0.1.0-mvp)

- ○ No equivalent today. This is a v1.0 item on our roadmap.
- The core idea — inline content injected into the host product's layout — is different from anything in v0.1. Our tooltips and hints are anchored floats; our checklist is a floating widget. Nothing is "part of the page layout."
- Value proposition when we build it: empty-state coaching, contextual explainers in dashboards, upgrade banners inline with feature blocks.
- Implementation sketch (for v1.0 PRD): a component that mounts arbitrary tour-schema content into a host-provided container. Same content model as tours (steps + advanceOn), rendered inline instead of anchored.
- iFrame support: probably yes, since it's a trivial content block. Text / button / image: already in our schema, minor extraction to render inline.
- Append / Prepend / Replace: the host chooses via where they mount the component in JSX. Simpler than Appcues' declarative selector model — but requires host cooperation.
