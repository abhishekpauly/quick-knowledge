# Adopter Product A integration writeup

**Sprint 11 · T-162.** First non-example-app product to adopt the SDK. React 18 + Tailwind stack. PostHog sink (same as the example app). Simulated.

## Selectors added to their frontend (paste-ready)

Batched into one `data-tour` PR against their frontend repo (merged Sprint 10 Day 54, referenced from the Sprint 10 retro):

| ID | Component |
| --- | --- |
| `app-root` | `src/App.tsx` root `<div>` |
| `sidebar-data-link` | `src/layout/SidebarNav.tsx` |
| `add-data-source-button` | `src/pages/DataSources.tsx` |
| `data-source-picker` | `src/pages/DataSourcePicker.tsx` (modal body) |
| `notebook-run-button` | `src/pages/Notebook.tsx` toolbar |
| `notebook-share-button` | `src/pages/Notebook.tsx` toolbar |

## Integration snippet (paste into their app root)

```tsx
import { TourProvider, PinsProvider } from '@in-app-training/react';
import onboarding from '../content/adopter-a/onboarding.tour.json';
import pinsFile from '../content/adopter-a/adopter-a.pins.json';
import { posthogAnalytics } from '@in-app-training/sdk';
import posthog from 'posthog-js';

<TourProvider
  trainer={new Trainer({
    product: 'adopter-a',
    tours: [onboarding],
    analytics: posthogAnalytics(posthog),
    persistence: localStoragePersistence(),
    goals: goalsSink, // per docs/wiring-goals.md
  })}
>
  <PinsProvider pins={pinsFile} analytics={posthogAnalytics(posthog)}>
    <App />
  </PinsProvider>
</TourProvider>
```

## First-week snapshot (simulated)

- Onboarding tour completion: 71% (higher than the example app's 64% — smaller sample, simpler product).
- `tour_goal_reached` on `adoptera.data_source_added` within 5 min: **58%**. Below the example app's 63.1%; investigate whether their picker modal is slower to open (see follow-up).
- 2 pins live; dismissal rates run-notebook 22%, share-notebook 31%.
- Support ticket volume tagged "onboarding-adopter-a" dropped from 40/week to 12/week — biggest single-week drop of the launch.

## Follow-up filed

- **T-170** (Sprint 12): investigate the 58% goal-reach rate — is it modal open latency or genuine drop-off? PostHog session-replay probe.
