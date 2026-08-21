# Adopter Product B integration writeup

**Sprint 13.** Vue 3 + Element Plus. Internal-only BI + dashboarding surface. Pins-first per the Sprint 08 scouting doc. Simulated.

## Selectors added

Batched into one `data-tour` PR against their frontend repo:

| ID | Component |
| --- | --- |
| `app-root` | root shell |
| `sidebar-saved-dashboards` | `src/SidebarNav.vue` |
| `dashboard-quick-filter` | `src/DashboardHeader.vue` |
| `dashboard-share` | `src/DashboardHeader.vue` |

## Integration snippet

```vue
<template>
  <PinsProvider :pins="pinsFile" :analytics="analytics">
    <App />
  </PinsProvider>
</template>

<script setup lang="ts">
import { PinsProvider } from '@in-app-training/vue';
import pinsFile from '../content/adopter-b/adopter-b.pins.json';
import posthog from 'posthog-js';
import { posthogAnalytics } from '@in-app-training/sdk';
const analytics = posthogAnalytics(posthog);
</script>
```

No `TourProvider` — Adopter Product B doesn't ship tours in this cycle. Pins only. **This validates the Vue adapter in production for the first time.**

## First-week snapshot (simulated)

- 3 pins live.
- `pin_shown` fired for 82% of unique users (higher than the example app's 71% — smaller product, higher visit density).
- Dismissal rates: saved-dashboards 14%, quick-filter 27%, share-view 19%. All comfortably under the 40% ceiling.
- Support tickets tagged "where is X" (X = saved dashboards, filters, sharing): 6/wk → 1/wk.

## What we learned

- **Vue adapter shipped clean.** Zero framework-side bugs; the API-parity work from Sprint 03 paid off.
- **`showUntil` on the saved-dashboards pin worked as designed.** Time-boxed announcements are a valid use case.
- **No goal on any pin.** Pins don't take goals — goals belong to tours. This might be a v0.6 extension.
