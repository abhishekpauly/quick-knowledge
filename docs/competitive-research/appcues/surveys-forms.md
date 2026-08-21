# Appcues — Surveys & Forms

Source: https://docs.appcues.com/surveys-forms/forms-surveys · Fetched 2026-08-20

## Definition

Native form and survey creation within Flows. Both built-in components and external-tool integrations.

## Five built-in patterns

1. **Rating** — configurable scale (0–1 through 0–10, arbitrary bounds).
2. **Single Select** — choose exactly one option from a list.
3. **Multi-Select** — choose one or more options. Requires SDK ≥ 6.2.3.
4. **Small Text Input** — open-ended short response with optional character limit.
5. **Large Text Input** — extended text with format validation.

## Features

- Responses captured in Appcues + displayed in analytics dashboards. Custom reporting labels become column headers.
- **Required fields** — prevent advancement until answered.
- **Field validation** — email, phone, character limits.
- **Multi-question capability** — multiple survey components in a single Modal or Slideout step.
- **Flow targeting based on responses** — a separate feature. Downstream flows can be gated on a user's prior survey answer.

## External integrations

- **Typeform** — embed via iframe HTML block. Pattern: pass Appcues user properties into the Typeform URL using curly-brace syntax.
- **Other platforms** — SurveyMonkey, Google Forms work via HTML embedding.

## Limitations

- Survey components **NOT available on Tooltip or Hotspot steps**. Only Modal and Slideout support forms.

## Comparison against our SDK (v0.1.0-mvp)

- ○ No native survey/form support today. Planned for v0.5.
- Implementation shape (for v0.5 PRD):
  - New step-body components in the schema: `rating`, `select`, `multi-select`, `text-short`, `text-long`.
  - Each renders inside a Modal step (our center-placement).
  - `required` field on each component blocks the Next button.
  - `validation` on text inputs — email/phone regex, minLength/maxLength.
  - On submit, emit `training.survey_response` event with `{promptId, fields}`.
  - Follow the same analytics-flows-out-to-your-sink pattern — no in-SDK response viewer.
- Tooltip/hotspot restriction: whether we match or exceed Appcues here is a design call. Their limitation may be UX-driven (surveys inside tooltips are cramped). Suggest starting with Modal-only for MVP; expand later if a real tour needs it.
- Multi-question per step: we support because step body is arbitrary content in our model.
- Response destinations: reuse analytics adapter. Response data goes to the same sink (PostHog, Amplitude) as other events. Products with a dedicated response viewer (e.g. via webhook to a custom backend) build it themselves.
- Downstream flow targeting on response: overlaps with property-targeting from v0.2. If we store the response as a user property (via persistence), other tours can gate on it.
- Typeform / external embed: we support iframe in a step body trivially. Priority is our own components; iframe embed is a nice-to-have.
