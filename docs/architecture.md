# Architecture

## The three-layer split

```
┌─────────────────────────────────────────────────────┐
│  Product adapters (thin, per framework)             │
│  • React: <TourProvider>, useTour                   │
│  • Vue: plugin, useTour composable (deferred)       │
│  • Analytics adapter, Persistence adapter, Theme    │
├─────────────────────────────────────────────────────┤
│  Content layer (JSON, versioned, Zod-validated)     │
│  • Tours, steps, targets, triggers, actions         │
│  • Authored in files, edited via PR                 │
├─────────────────────────────────────────────────────┤
│  Engine (framework-agnostic, TypeScript)            │
│  • Built on Shepherd.js + Floating UI               │
│  • Targeting, positioning, lifecycle, event bus     │
└─────────────────────────────────────────────────────┘
```

Keeping these decoupled is what makes cross-product reuse actually work. Every layer talks through a defined interface; no layer reaches around another.

## Layer 1 — Engine

- Vanilla TypeScript. No React, no Vue in the base.
- Built on top of Shepherd.js (MIT, uses Floating UI, actively maintained). Saves us the tooltip-lifecycle bugs.
- Exposes a small, stable public API: `Trainer.start(tourId)`, `Trainer.on(event, cb)`, `Trainer.getProgress(tourId)`, etc.
- ~90% of the SDK code lives here.

See ADR-0001 for why Shepherd.js.

## Layer 2 — Content

- Tours authored as JSON.
- Every tour has a `schemaVersion` field ("v1", "v2", …).
- Schema is Zod at build/CI time and TypeScript types at runtime.
- Multiple schema versions supported in parallel during migrations.

See `docs/content-schema.md` and ADR-0003.

## Layer 3 — Adapters

Three kinds of adapters, each pluggable per host product:

### Framework adapters
- **React** — `<TourProvider>` at the app root, `useTour()` hook. Sprint 03.
- **Vue** — plugin + composable. Deferred until a Vue product is a real customer.
- Each adapter is a few hundred lines wrapping the same engine API.

### Analytics adapter
- Interface: `analytics.track(eventName, properties)`.
- Emitted events (typed): `tour_started`, `step_viewed`, `step_completed`, `tour_completed`, `tour_dismissed`, `tour_error`.
- One concrete implementation per product (Amplitude / Mixpanel / PostHog / internal).

### Persistence adapter
- Interface: `persistence.get(key)`, `persistence.set(key, value)`.
- Default implementation: localStorage.
- Products can swap in a backend adapter for cross-device sync.

### Theme
- CSS variables. One theme object per product, applied via `<TourProvider theme={exampleAppTheme}>`.
- Documented tokens: colors, typography, tooltip shape/shadow, spacing.

## The `data-tour` contract

The number-one killer of tour systems is CSS-selector rot on UI refactors. Rule:

> Every element a tour can target has a `data-tour="unique-stable-id"` attribute. The SDK only accepts `[data-tour="..."]` selectors — nothing else.

Enforcement:
- **Runtime** — engine throws on selectors that don't start with `[data-tour=`.
- **CI** — `scripts/validate-selectors.ts` parses all tour content, grep's the host codebase, fails the build if any referenced ID doesn't exist.

See ADR-0002 and `docs/data-tour-conventions.md`.

## Trigger system

Tours can be triggered by:
- **Manual** — user clicks a "Show me around" button; adapter calls `Trainer.start(tourId)`.
- **First-run** — engine checks persistence; if user hasn't completed onboarding, starts it on mount.
- **URL** — content declares `triggers: [{ type: "url", pattern: "/workflows/*" }]`.
- **Event** — analytics event fires; engine listens and starts a tour (e.g., after "workflow_created", start "next steps" tour).

Triggers are declared in tour content, evaluated by the engine, mounted by the adapter.

## Content authoring flow

```
Curriculum owner writes JSON  →  npm run validate:content  →  npm run validate:selectors  →  PR  →  merge  →  bundled with next SDK release
```

Content ships with the SDK for MVP. In a later phase, we may serve content from an API so updates don't require a redeploy.

## What we're deliberately NOT doing

- **Visual authoring UI on day 1.** Author in files; prove the loop; invest in tooling later if there's evidence it's needed.
- **Vue adapter speculatively.** Build when a Vue product commits.
- **Own tooltip engine.** Shepherd.js is good enough.
- **Sandbox mode from scratch.** If we need one, evaluate Storylane before building.
- **Cross-device sync backend for MVP.** LocalStorage is fine to prove the loop.

## Public API sketch (target for end of Sprint 03)

```ts
import { Trainer } from '@in-app-training/sdk';
import { ReactAdapter } from '@in-app-training/react';
import tours from './content/example-app/index.json';

const trainer = new Trainer({
  content: tours,
  analytics: { track: (name, props) => amplitude.logEvent(name, props) },
  persistence: localStoragePersistence(),
  theme: exampleAppTheme,
});

// In your React root:
<ReactAdapter trainer={trainer}>
  <App />
</ReactAdapter>

// Anywhere in your app:
const { start, progress } = useTour();
<button onClick={() => start('workflows-basic-1')}>Show me how</button>
```
