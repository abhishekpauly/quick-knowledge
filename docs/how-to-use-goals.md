# How to use Goals

Goals let a tour declare "this was worthwhile if the host analytics observes event X within N minutes." Sprint 10 feature.

## When to use a Goal

- **Onboarding tours** — measure whether the user actually did the thing the tour taught. Example app: onboarding tour → `exampleapp.project_created` within 5min.
- **Feature-intro tours** — did the user try the feature within the window?
- **Do NOT use for** — session-length engagement, retention, or anything that isn't a single host analytics event. Those are dashboard queries, not goals.

## Authoring

Additive on the tour:

```jsonc
{
  "id": "onboarding",
  // ...
  "goal": {
    "event": "yourapp.something_done",     // your host analytics event name
    "windowMinutes": 5,                    // optional; default 60, max 7 days
    "match": { "source": "onboarding" }    // optional; subset filter on properties
  }
}
```

## Window sizing

- **Short (≤5 min):** for direct-action goals ("did they click the button we just taught?"). Higher signal-to-noise.
- **Medium (30–60 min):** for exploratory tours ("did they eventually get to it?"). Watch for `tour_goal_reached` false-positives from unrelated actions.
- **Long (≥1 day):** almost never worth it — you're asking about retention, use a cohort analysis in your BI tool instead.

## A/B testing goal thresholds

You can't A/B test the `windowMinutes` field directly, but you can:
1. Ship two tours (`onboarding-v1`, `onboarding-v2`) with different goal windows, gated by `audience`.
2. Compare `tour_goal_reached` rates between them.
3. Pick the shorter window that still hits ≥60% reach — anything higher is measurement drift.

## Wiring the sink

See [`wiring-goals.md`](wiring-goals.md) for PostHog, Amplitude, and warehouse-backed recipes.

## Also see

- [`../product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) — design.
- [`event-dictionary.md`](event-dictionary.md) — `tour_goal_reached` / `tour_goal_missed` payload shape.
