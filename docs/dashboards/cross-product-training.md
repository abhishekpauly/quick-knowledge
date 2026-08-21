# Cross-product training dashboard

**Sprint 18 (T-265) · skeleton.**

The v1.0 roadmap deferred a lightweight cross-product training dashboard to Sprints 18–20. This doc pins the tool choice and lists the first page's panels. It is deliberately **NOT** a rebuilt Amplitude — see `product/vs-appcues.md` "Never" list.

## Tool choice

**Retool.** Rationale:

- Already the internal default for one-off ops dashboards. Zero new SaaS to procure.
- Reads directly from the analytics warehouse (PostHog → Snowflake via the standard connector), so the dashboard consumes the same event dictionary the SDK already generates (`docs/event-dictionary.json`).
- Query-first authoring — the operator writes SQL against the shipped events. No new schema owned by the SDK team.
- Free tier covers up to five internal viewers, which matches the current adopter count (example-app, A, B, C).

**Rejected:**

- **Metabase.** Comparable feature set; loses on "already installed and used elsewhere."
- **A hand-rolled Next.js page.** More work, brittler, no query builder. Reopen only if Retool becomes unusable.
- **A component inside the SDK's own dashboard.** No such thing exists and there's no reason to build one — this is a cross-product view for the SDK team, not per-adopter analytics.

## First page — panels 1–5 built (Sprint 19 T-282), panel 6 pending (Sprint 20 T-291)

Each panel is one SQL query against the events warehouse. The event names are the exact strings from `docs/event-dictionary.json`.

1. **Onboarding completion rate — 7-day rolling, per product.**
   `tour_completed` / `tour_started` grouped by `product`, filtered to tours where `difficulty = 'onboarding'`.
2. **Goal-reach rate — 7-day rolling, per tour.**
   `tour_goal_reached` / `tour_started` grouped by `tourId`, per product. Adopter A's goal-window fix (Sprint 14 T-210) makes this the canonical "did the tour matter" number.
3. **Pin engagement — per pin, per product.**
   `pin_shown` unique-user count, `pin_dismissed` unique-user count. Dismiss rate is a leading indicator that a pin isn't earning its screen space.
4. **Content bundle freshness — per adopter on the API path.**
   `content_bundle_updated.timestamp` — freshest ts per product. If it drops behind `now() - 24h`, the adopter's publish pipeline is stalled.
5. **Content bundle errors — per adopter.**
   `content_bundle_update_failed` counts grouped by `reason`. `network` + `timeout` are ops signals; `schema-version-mismatch` and `validation` are content-pipeline signals.
6. **Consent-gated tour skips — per product.**
   Difference between "tour qualifies for auto-trigger" (a synthetic metric from persistence + audience match) and `tour_started`. Filed as a Sprint 20 addition — needs the synthetic side.

## What this dashboard is NOT

- **Not per-adopter.** Each adopter already ships their own PostHog/Amplitude view of tour metrics. This one aggregates across adopters for the SDK team.
- **Not a Funnel/Cohort builder.** The events land in the warehouse; every host is free to build funnels there. Rebuilding those tools inside the SDK's dashboard is the "Never" case.
- **Not a real-time monitor.** Refresh cadence is hourly. Real-time alerting belongs in the host's ops stack.

## Panel SQL sketches (as-built for Sprint 19)

These are the queries the Retool page runs against the analytics warehouse (`analytics.events`, one row per emitted training event, `name` matches the dictionary, `properties` is a JSONB column mirroring the payload interface). Copy verbatim into a new Retool query; the panel type is noted alongside each.

### Panel 1 — Onboarding completion rate (line chart, per product, 7-day rolling)

```sql
with starts as (
  select date_trunc('day', ts) as d, product, count(*) as n
  from analytics.events
  where name = 'tour_started'
    and properties->>'triggerSource' = 'first-run'
  group by 1, 2
),
completes as (
  select date_trunc('day', ts) as d, product, count(*) as n
  from analytics.events
  where name = 'tour_completed'
  group by 1, 2
)
select s.d as day, s.product,
       (coalesce(c.n, 0)::float / nullif(s.n, 0)) as completion_rate
from starts s left join completes c using (d, product)
where s.d >= current_date - interval '30 days'
order by 1, 2;
```

### Panel 2 — Goal-reach rate (bar chart, per tour, 7-day rolling)

```sql
with starts as (
  select properties->>'tourId' as tour_id, count(*) as n
  from analytics.events
  where name = 'tour_started'
    and ts >= now() - interval '7 days'
  group by 1
),
reached as (
  select properties->>'tourId' as tour_id, count(*) as n
  from analytics.events
  where name = 'tour_goal_reached'
    and ts >= now() - interval '7 days'
  group by 1
)
select s.tour_id,
       s.n as starts,
       coalesce(r.n, 0) as reached,
       (coalesce(r.n, 0)::float / nullif(s.n, 0)) as reach_rate
from starts s left join reached r using (tour_id)
order by reach_rate asc;
```

### Panel 3 — Pin engagement (table, per pin, per product)

```sql
select product,
       properties->>'pinId' as pin_id,
       count(*) filter (where name = 'pin_shown') as shown,
       count(*) filter (where name = 'pin_dismissed') as dismissed,
       (count(*) filter (where name = 'pin_dismissed')::float
         / nullif(count(*) filter (where name = 'pin_shown'), 0)) as dismiss_rate
from analytics.events
where name in ('pin_shown', 'pin_dismissed')
  and ts >= now() - interval '7 days'
group by 1, 2
order by shown desc;
```

### Panel 4 — Content bundle freshness (stat tile, per adopter)

```sql
select product,
       max(ts) as last_update,
       (now() - max(ts)) as age
from analytics.events
where name = 'content_bundle_updated'
group by 1
order by age desc;
```

Retool alert rule: any row where `age > interval '24 hours'` → yellow badge on the tile.

### Panel 5 — Content bundle errors (bar chart, per adopter, per reason)

```sql
select product,
       properties->>'reason' as reason,
       count(*) as errors
from analytics.events
where name = 'content_bundle_update_failed'
  and ts >= now() - interval '24 hours'
group by 1, 2
order by 3 desc;
```

## Sprint 20 hardening — shipped (T-291)

### Panel 6 — Consent-gated tour skips (per product, 7-day rolling)

Requires the synthetic "would-have-fired" side: for every `first-run` / `url` / `event` trigger opportunity the Trainer evaluated, host code records a `training_qualified` event via the same analytics sink. The delta between `training_qualified` and `tour_started` for the same `(user, tourId)` pair — filtered to cases where the tour has a `consentCategory` — is a good proxy for consent-driven skips.

```sql
with qualified as (
  select date_trunc('day', ts) as d, product, properties->>'tourId' as tour_id, count(distinct properties->>'userId') as n
  from analytics.events
  where name = 'training_qualified' and ts >= now() - interval '7 days'
  group by 1, 2, 3
),
started as (
  select date_trunc('day', ts) as d, product, properties->>'tourId' as tour_id, count(distinct properties->>'userId') as n
  from analytics.events
  where name = 'tour_started' and ts >= now() - interval '7 days'
  group by 1, 2, 3
)
select q.d, q.product, q.tour_id,
       q.n as qualified_users,
       coalesce(s.n, 0) as started_users,
       (q.n - coalesce(s.n, 0)) as skipped_users
from qualified q left join started s using (d, product, tour_id)
where q.n - coalesce(s.n, 0) > 0
order by skipped_users desc;
```

The synthetic side is opt-in for adopters — a small helper is documented in `docs/wiring-analytics-sink.md`. Adopters who don't wire it get an empty panel with a link.

### Slack alert — `content_bundle_update_failed > 10/hour`

Retool "Notify" step on the panel-5 query, thresholded at `sum(errors) > 10` in the last hour. Payload posts to `#sdk-alerts` with the product, the top reason, and a link to the panel-5 view. No paging behaviour — this is a Slack ping, not PagerDuty.

## Deferred

- **Page-2 "adopter overview" — one row per adopter with the latest of every metric above.** Nice-to-have, not requested by anyone. Reopen if the SDK team needs a status ping in 5 seconds.
- **Adopter-facing doc: "expose the training event stream to your own dashboards".** Already covered by `docs/wiring-analytics-sink.md`; adding a cross-link is a one-line follow-up, not a sprint task.
