# FEAT-001: Core tour engine

- **Status:** In progress
- **Priority:** P0
- **Sprint:** SPR-01, SPR-02
- **Owner:** Solo build
- **Depends on:** None
- **Related ADRs:** ADR-0001

## Problem

We need a runtime that displays tour steps as tooltips anchored to real DOM elements, handles the lifecycle (start / next / prev / skip / complete), fires events, and works across framework contexts.

## Non-goals

- Framework-specific integration (that's FEAT-004 React adapter).
- Content loading from JSON (that's FEAT-002).
- Analytics wiring (that's FEAT-005).
- Advanced targeting like wait-for-element (that's FEAT-008).

## Solution sketch

Wrap Shepherd.js in a `Trainer` class that exposes our public API. Consumers construct a `Trainer` with dependencies (content, analytics adapter, persistence adapter, theme) and call `trainer.start(tourId)`. Internally we translate our step format into Shepherd's step format, mount, and emit typed events.

## MVP scope (Sprint 01)

- `Trainer` class with `start(tourId)`, `stop()`, `next()`, `prev()`, `on(event, cb)`.
- Renders a Shepherd.js tour from a hardcoded step array.
- Supports `top` / `bottom` / `left` / `right` / `center` placement.
- Emits `tour_started`, `step_viewed`, `tour_completed`, `tour_dismissed` to a console adapter.
- One tour running against one AI Platform screen in QA.

## Full scope (Sprint 02+)

- Load steps from validated JSON content.
- `advanceOn` conditions (click, input, url, event).
- Prerequisites gating.
- Progress persistence via adapter.
- Themed via CSS variables.

## Acceptance criteria

- [ ] `new Trainer({ ... })` produces a working instance.
- [ ] `trainer.start("test-tour")` mounts a tooltip on the target element.
- [ ] Clicking "Next" advances the tour and emits `step_viewed`.
- [ ] Clicking "Skip" dismisses the tour and emits `tour_dismissed`.
- [ ] Reaching the last step and clicking "Done" emits `tour_completed`.
- [ ] The tooltip repositions correctly on window resize.
- [ ] Runs in Chrome, Firefox, Safari (latest). Edge cases (mobile) deferred.

## Open questions

- How do we handle a target element that doesn't exist yet on mount? → Punt to FEAT-008 (advanced targeting).
- Do we support multiple concurrent tours? → No for MVP. Only one active tour at a time.

## Risks

- Shepherd.js style overrides may conflict with host product CSS. Mitigation: scope our styles under a shadow-DOM-ish class prefix.
- Shepherd's step object shape may diverge from ours enough to make translation awkward. Mitigation: keep the wrapper thin; if it gets fat, that's a signal to fork.
