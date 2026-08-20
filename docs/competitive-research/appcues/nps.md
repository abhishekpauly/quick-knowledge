# Appcues — NPS

Source: https://docs.appcues.com/nps/what-is-nps · Fetched 2026-08-20

## Definition

NPS (Net Promoter Score) survey: measures likelihood-to-recommend. Appcues delivers **continuous sampling** across the user base rather than one-time surveys.

## Survey flow

Three steps:
1. **0–10 likelihood scale.** Endpoint labels configurable ("Not likely" / "Very likely").
2. **Open-ended follow-up question** (optional).
3. **Snooze option** — dismisses temporarily with a configurable re-appearance delay (default 7 days).

## Score buckets (automatic segmentation)

- **Promoter** — 9–10.
- **Passive** — 7–8.
- **Detractor** — 0–6.

Overall score = `% promoters − % detractors`. Ranges −100 to +100.

## Metric window

Trailing 30-day window for score calculation.

## Customization

- Main question text.
- Endpoint labels.
- Snooze messaging.
- Follow-up questions per bucket (typical pattern: ask promoters "what did you love," ask detractors "what's missing").

## Response destinations

- Integrations: Salesforce, HubSpot, Segment, Slack.
- User-property `Most Recent NPS Score` — usable as a targeting attribute for downstream flows.

## Other

- Multiple simultaneous NPS surveys supported (v2).
- Localization.
- Mobile responsiveness.
- Expanded styling.

## Comparison against our SDK (v0.1.0-mvp)

- ○ No NPS today. Planned for v0.5.
- Implementation shape (for v0.5 PRD):
  - New content type `nps` in schema (companion to `tour` and `hints`).
  - React component `<NPSPrompt promptId="...">`.
  - Three-step wizard: score → follow-up → thanks.
  - Score written to a new analytics event `training.nps_submitted` with `{score, comment, promptId}`.
  - Re-appear-after config (default 7 days) via persistence adapter.
- Score buckets: straightforward — computed at analytics dashboard time (Amplitude / PostHog can bucket). Or emit as bucket string in the event payload for convenience.
- Trailing-30-day overall score: computed downstream in the analytics tool, NOT in the SDK. This matches our decision to offload analytics dashboards.
- Response destinations: our analytics adapter handles all of these (PostHog, Amplitude, HubSpot via webhooks, Slack via webhooks). No new work.
- `Most Recent NPS Score` as a user property: needs the property-targeting feature from v0.2. Blocks NPS-driven downstream flow targeting until property targeting lands. Sequence v0.2 before NPS in v0.5.
- Multi-question follow-up (promoter vs detractor): the schema needs a branching mechanism. Nudges toward a `branches` concept in schema v2 (deferred until we need it — NPS is the first real trigger).
