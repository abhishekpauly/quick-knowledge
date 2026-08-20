# How to integrate the Training SDK

For a UPTIQ product team adopting the in-app training system for the first time. If you're the AI Platform team, you're following this too — you're just the first.

Time to first working tour: ~15 minutes.

## Prerequisites

- A React or Vue app. React support ships in v0.1.0; Vue lands when a Vue product commits (FEAT-011, deferred).
- Access to the internal npm registry.
- Ability to add `data-tour` attributes to your frontend components — see `docs/data-tour-conventions.md`.
- An analytics sink you can wire events into (Amplitude, PostHog, Mixpanel, internal, or none for now).

## Step 1 — Install

```bash
npm install @uptiq/training-sdk @uptiq/training-sdk-react
```

Add Shepherd's CSS to your app's HTML head (once, globally):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/shepherd.js@14.0.0/dist/css/shepherd.css" />
```

Or import it if your bundler handles CSS:

```ts
import 'shepherd.js/dist/css/shepherd.css';
```

## Step 2 — Add `data-tour` attributes to elements tours will target

This is the one required change to your existing components. See `docs/data-tour-conventions.md` for the naming rules.

```tsx
// Before
<button className="btn-primary" onClick={onCreate}>+ New project</button>

// After
<button data-tour="create-project-button" className="btn-primary" onClick={onCreate}>
  + New project
</button>
```

Add attributes for every element any tour will point at. The curriculum team will tell you which — see `tracker/sprint-01-selectors.md` for the AI Platform's initial list.

## Step 3 — Author or import tour content

The curriculum team owns this. For the integration itself, you just need to load their JSON. Either import files directly (bundled with your app):

```ts
import onboarding from '@uptiq/training-content/ai-platform/onboarding.tour.json';
import workflows from '@uptiq/training-content/ai-platform/workflows-create-project.tour.json';
```

Or serve content from an API (v0.5+ feature — not MVP).

## Step 4 — Wire an analytics adapter

Every host product implements the `Analytics` interface for its own sink. Full recipes for Amplitude, PostHog, Mixpanel, and custom sinks in `docs/analytics-adapters.md`. Simplest example (PostHog):

```ts
import type { Analytics } from '@uptiq/training-sdk';
import { posthog } from './your-posthog-instance';

export const analytics: Analytics = {
  track(event, properties) {
    posthog.capture(`training.${event}`, properties);
  },
};
```

If you don't have a sink yet, use `consoleAnalytics()` in dev and `noopAnalytics()` in prod. The engine keeps working; you just don't get completion data.

## Step 5 — Construct the Trainer

Once, at app root. Not inside a component.

```ts
// src/training.ts
import {
  Trainer,
  localStoragePersistence,
  parseTour,
} from '@uptiq/training-sdk';
import { analytics } from './analytics-adapter';
import { aiPlatformTheme } from './theme';
import onboardingRaw from './content/onboarding.tour.json';
import workflowsRaw from './content/workflows-create-project.tour.json';

// Parse content at boot. If it fails, we want to know at startup, not in front of a user.
const tours = [onboardingRaw, workflowsRaw]
  .map(parseTour)
  .filter((r) => r.ok)
  .map((r) => r.tour!);

if (tours.length !== 2) {
  throw new Error('Training content failed validation at boot. Check the console.');
}

export const trainer = new Trainer({
  product: 'ai-platform',
  tours,
  analytics,
  persistence: localStoragePersistence(),
  theme: aiPlatformTheme,
});
```

## Step 6 — Mount the provider

At your app root, inside the auth-protected area:

```tsx
// src/App.tsx
import { TourProvider, FirstRunTour } from '@uptiq/training-sdk-react';
import { trainer } from './training';
import { aiPlatformTheme } from './theme';

export function App() {
  return (
    <TourProvider trainer={trainer} theme={aiPlatformTheme}>
      <FirstRunTour tourId="ai-platform-onboarding" delayMs={500} />
      <YourAppShell />
    </TourProvider>
  );
}
```

Two things happen here:

- `<TourProvider>` puts the trainer into React context and applies the theme's CSS variables.
- `<FirstRunTour>` starts the onboarding tour on first mount for new users. It renders nothing.

## Step 7 — Trigger tours from anywhere

Anywhere in your component tree:

```tsx
import { useTour } from '@uptiq/training-sdk-react';

function HelpButton() {
  const { start } = useTour();
  return (
    <button onClick={() => start('ai-platform-workflows-create-project')}>
      Show me how to create a workflow
    </button>
  );
}
```

## Step 8 — Read progress (optional, for checklist widgets and unlock logic)

```tsx
import { useTourProgress } from '@uptiq/training-sdk-react';

function WorkflowsBadge() {
  const progress = useTourProgress('ai-platform-workflows-create-project');
  if (progress.status === 'completed') return <span>✓ Learned</span>;
  return null;
}
```

## Step 9 — Verify

- Load your app as a fresh user (no localStorage). The first-run tour should auto-start after 500ms.
- Click your help button. The workflow tour should trigger.
- Check your analytics sink. You should see `tour_started`, `step_viewed`, `step_completed`, `tour_completed` (or `tour_dismissed`) events with the tour and step IDs.
- Complete a tour. Reload. It should NOT re-trigger (persistence works).

## Common problems

**Tooltip doesn't appear on the first step.** Check the target element has a `data-tour="..."` attribute and is present in the DOM when the tour starts. For lazy-rendered targets, wait-for-element handles this — see `docs/architecture.md`.

**Tooltip appears in the wrong spot.** Check the `placement` value in the tour JSON. For overlay/modal cases where the target is off-screen, `placement: "center"` skips anchoring and shows in the middle.

**Tour starts, then immediately closes.** Almost always the target selector doesn't match. Check `[data-tour="..."]` matches an element in the DOM at that moment.

**"Cannot read properties of null" in production.** You mounted `<TourProvider>` above your auth wrapper and the trainer is initialized before the user context. Move the provider inside the auth-protected section.

**Analytics events aren't showing up.** Test with `consoleAnalytics()` first — if events log to console, your custom adapter has a bug. If they don't, the trainer isn't running (see previous items).

**Content changes locally but doesn't update.** Content is bundled with your app; you need to redeploy. In v0.5+ we'll add API-served content that hot-updates.

## Rollback

If the SDK misbehaves in production:

- Comment out `<FirstRunTour>` and any `useTour().start()` calls.
- Deploy. Tours stop appearing. The SDK does no harm at rest.
- File an issue with the SDK team. See `releases/rollback-runbook.md`.

## Contract you're depending on

- Public API is stable across MINOR versions.
- Content schema version changes are MAJOR bumps of the core package.
- The `Analytics` interface is stable — adding new event types is MINOR.
- `data-tour` attributes on your elements are effectively public API of your product. Don't rename or remove them without checking the SDK's content repo for references.
