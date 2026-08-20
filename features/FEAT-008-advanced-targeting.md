# FEAT-008: Advanced targeting (wait-for-element, retry, URL triggers)

- **Status:** Backlog
- **Priority:** P1
- **Sprint:** SPR-04
- **Owner:** Solo build
- **Depends on:** FEAT-001, FEAT-002

## Problem

Many target elements don't exist on mount — they render after a click, an API response, or a route change. Naive `document.querySelector` returns null and the tour dies.

## Solution sketch

Engine polls (or uses MutationObserver) for missing targets with a bounded retry (default 3 seconds). URL-triggered tours listen to `popstate` and framework-router events. Event-triggered tours subscribe to the analytics adapter's event stream.

## MVP scope

- MutationObserver-based wait-for-element with configurable timeout.
- URL trigger (regex pattern match on `location.pathname`).
- Event trigger (fires on analytics event name match).
- On timeout: emit `tour_error` and skip the step (don't hang the tour).

## Acceptance criteria

- [ ] Tour step whose target renders 500ms after start still lands correctly.
- [ ] Tour step whose target never renders times out after 3s and skips gracefully.
- [ ] URL-triggered tour starts automatically when route matches.
- [ ] Event-triggered tour starts when the named event fires.

## Risks

- MutationObserver on the whole document is expensive. Mitigation: scope to a container element if provided.
