# FEAT-005: Analytics adapter

- **Status:** Backlog
- **Priority:** P0
- **Sprint:** SPR-03, SPR-04
- **Owner:** Solo build
- **Depends on:** FEAT-001
- **Related ADRs:** ADR-0004

## Problem

Every host product uses a different analytics sink (Amplitude, Mixpanel, PostHog, internal). The engine must not know or care which one. We need typed events, one interface, and per-product implementations.

## Non-goals

- Building our own analytics backend.
- Standardizing analytics vendors across host products (not our fight).
- Dashboards (later — likely built on top of the existing analytics tool).

## Solution sketch

Define an `Analytics` interface with a `track(event, props)` method. Define the exhaustive list of events as a discriminated union (`TrainingEvent`). Provide a console adapter for dev and a stub for tests. Each product implements the interface once, wiring to its sink.

## MVP scope (Sprint 03)

- `interface Analytics { track(event: TrainingEvent, props: Record<string, unknown>): void }`.
- Event union: `tour_started` | `step_viewed` | `step_completed` | `tour_completed` | `tour_dismissed` | `tour_error`.
- Each event's payload typed: e.g., `step_viewed` includes `tourId`, `stepId`, `stepIndex`, `timestamp`.
- Console adapter (dev).
- No-op adapter (tests).
- One concrete adapter for the example app's sink.

## Full scope (Sprint 04+)

- User properties (segmentation seeds).
- Batch flushing / offline queueing.
- Sampling.

## Acceptance criteria

- [ ] All engine lifecycle events fire the expected `track` calls with the expected payloads.
- [ ] Event payloads are TypeScript-typed at the call site.
- [ ] Console adapter prints events in a readable format during dev.
- [ ] Swapping adapters requires zero engine changes.
- [ ] Adapter errors (network failure, sink down) do not crash the tour.

## Open questions

- Which sink does the example app actually use? → Confirm before Sprint 03.

## Risks

- Sink adapter throws → tour crashes. Mitigation: engine wraps every `track` call in try/catch and logs but doesn't propagate.
