# How to use Pins

Pins are the "point at the thing" surface. A small anchored dot sits on a `data-tour` target; clicking it opens a compact popover with a title, an optional body, an optional Learn-more link, and (by default) a Dismiss button.

Ship a Pin when you need a **persistent** affordance for one element — not a step in a tour, not a one-off `?`-tooltip.

## When to use a Pin (vs. a Tour, vs. a Hint)

Decision box:

| You want to… | Use |
| --- | --- |
| Walk a user through a multi-step flow (welcome, feature intro, first-task). | **Tour** |
| Explain a single form field on hover / click. Inline with the field. | **Hint** (`<TrainingHint>`) |
| Announce that a specific button exists and stays there until the user has clearly seen it. | **Pin** |
| Point at "the thing" you keep saying users can't find. | **Pin** |
| Broadcast to every user regardless of context (e.g. maintenance notice). | Not this SDK — a host-side banner |

## Authoring a Pin

Pins live in `content/<product>/<name>.pins.json`. One file per product; every pin in one file (the loader dedupes ids across files, but keeping a single file makes ownership obvious).

### Minimal example

```jsonc
{
  "schemaVersion": "v1",
  "product": "example-app",
  "pins": [
    {
      "id": "share-workflow",
      "target": "[data-tour=\"workflows-canvas-share-button\"]",
      "title": "Share this workflow"
    }
  ]
}
```

### Every field

```jsonc
{
  "id": "share-workflow",                       // kebab-case, unique across all pin files
  "target": "[data-tour=\"…\"]",                // same data-tour contract as tours
  "title": "Share this workflow",               // string OR { locale: string }
  "body": "Click the paper-plane icon…",        // optional; same LocalizedString shape
  "learnMoreUrl": "https://example.com/docs",   // optional; opens in a new tab
  "audience": ["plan:enterprise", "!role:trial"], // optional; AND semantics, `!` negation
  "dismissible": true,                          // default true; set false for safety pins
  "showUntil": "2026-12-31"                     // optional ISO date; hides the pin after
}
```

Validation runs via `npm run validate:content` (also in CI). A malformed pin fails the build with a pointed message — same guarantee tours get.

## Integrating a Pin (host product)

### React

```tsx
import { PinsProvider } from '@in-app-training/react';
import pinsFile from '../content/example-app/example-app.pins.json';

<PinsProvider
  pins={pinsFile}
  userAttributes={{ plan: currentUser.plan, role: currentUser.role }}
  analytics={analytics}    // reuse the one wired to your Trainer
  locale="en"
>
  <App />
</PinsProvider>
```

That's it. Every visible pin auto-mounts via a portal into `document.body` and positions itself over its target. No `<Pin>` component to place manually.

### Vue

```vue
<template>
  <PinsProvider :pins="pinsFile" :user-attributes="userAttributes" :analytics="analytics">
    <App />
  </PinsProvider>
</template>

<script setup lang="ts">
import { PinsProvider } from '@in-app-training/vue';
import pinsFile from '../content/example-app/example-app.pins.json';
</script>
```

Same shape, same behaviour.

### Escape hatch — `<Pin id="…" />`

If you need explicit control over where a Pin renders (storybook, layout-nested variant, debugging), the provider also exports a `<Pin>` component:

```tsx
<Pin id="share-workflow" />
```

`<Pin>` throws if used outside a `<PinsProvider>`. This is intentional — the provider owns dismissal state; a stray `<Pin>` would drift out of sync.

## What the SDK does at runtime

1. `PinsProvider` filters the pins file by `audience`, `showUntil`, and dismissal state (loaded from localStorage under `in-app-training:pins:dismissed:<id>`).
2. Each surviving pin gets a `PinAnchor` (core) — waits for the target, then follows it via `resize`, `scroll` (capture), and a `MutationObserver` on the target's own subtree.
3. The dot renders at the target's top-right corner. Clicking toggles a popover.
4. Dismiss writes the `in-app-training:pins:dismissed:<id>` key and updates in-memory state; the pin disappears immediately.
5. Analytics fires:
   - `pin_shown` on the first render this session (deduped per browser session).
   - `pin_dismissed` when the user hits Dismiss.
   Both payloads: `{ pinId, target, timestamp }`. See [`event-dictionary.md`](event-dictionary.md).

## Consent and privacy

Per ADR-0006, Pins default to `consentCategory: 'functional'` — they run under all common consent regimes because they're part of product operation, not marketing. When `ConsentAdapter` is wired (v1.0), a pin whose category is denied will be filtered before render and its events will not emit.

For now (v0.5): pins render unless dismissed. If you need marketing-category pins, wait for the consent hook or gate them host-side via `audience`.

## Adding a new `data-tour` target for a Pin

Same story as tours: add the attribute to the host product's element, batch it into a single `data-tour` PR against the host frontend (template in `releases/adopter-data-tour-pr.md`). CI catches missing selectors via `validate:selectors`.

## Target visibility (from Sprint 10 T-139 pin-effectiveness investigation)

Pins render at their target's rect via `PinAnchor`. If the target is scrolled off-screen, so is the pin — which is usually correct but can make a pin invisible to users on a long-scroll page. Before shipping a pin, check that the target is above the fold on the typical viewport for your product.

## Anchoring caveats

- **Elements inside `overflow: hidden` scroll containers** track correctly; the capture-phase `scroll` listener catches any ancestor scroll.
- **Animated targets** (transforms mid-flight) will show the pin at the animation's current frame; if the animation is jittery, so is the pin. Prefer targets that only reposition on layout events.
- **Off-screen targets** (target scrolled out of viewport) still show the pin at the target's rect — which may be off-screen too. That's usually correct; if it's confusing, wrap the pin with a host-side visibility gate.
- **SSR**: no-op. `PinsProvider` skips the portal when `document` is undefined. Client-side hydration re-runs the pin lifecycle.

## Success criteria (per v0.5-kickoff)

Track these 30 days after your first Pin ships:

- ≥ 3 pins live and rendering.
- Dismissal rate < 40% per pin. Higher = the pin is noise; prune or rewrite.
- Zero P0 bugs. Zero support tickets tagged "pin" beyond baseline noise.
- Anchoring holds across your 3 layout breakpoints — manual QA.

If a pin's dismissal rate climbs above 40% within the first week, dismiss it in content (drop it from the pins file). Better a smaller pin set than an annoying one.

## Also see

- [`event-dictionary.md`](event-dictionary.md) — canonical `pin_shown` / `pin_dismissed` payload shape.
- [`../product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) — the design that motivated Pins.
- [`../docs/adrs/ADR-0006-consent-gating-hook.md`](adrs/ADR-0006-consent-gating-hook.md) — future consent integration.
- [`how-to-author-a-tour.md`](how-to-author-a-tour.md) — the tour equivalent of this doc.
