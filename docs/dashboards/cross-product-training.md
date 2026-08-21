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

## First page — panels (Sprint 19 build)

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

## Sprint 20 hardening list (previewed here)

- Alerts on `content_bundle_update_failed` count > 10 in an hour per product (Slack via Retool's built-in webhook).
- A page-2 "adopter overview" — one row per adopter with the latest of every metric above, so the SDK team stands up a status ping in 5 seconds.
- Documentation for adopters on how to expose the training event stream to their own dashboards (already covered in `docs/wiring-analytics-sink.md`; needs a cross-link).
