# FEAT-004: React adapter

- **Status:** Backlog
- **Priority:** P0
- **Sprint:** SPR-03
- **Owner:** Solo build
- **Depends on:** FEAT-001, FEAT-002
- **Related ADRs:** ADR-0004

## Problem

AI Platform is React. We need an idiomatic way to mount the SDK in a React app and to trigger tours from any component without prop-drilling a `Trainer` instance.

## Non-goals

- Vue adapter (FEAT-011, deferred).
- SSR support (not needed for AI Platform).
- React Native (out of scope, likely forever).

## Solution sketch

Ship `@uptiq/training-sdk-react` package. `<TourProvider trainer={trainer}>` mounts once at the app root and puts the `Trainer` into React context. `useTour()` returns `{ start, stop, progress, isActive }`. Adapter is under 300 lines.

## MVP scope (Sprint 03)

- `<TourProvider trainer={trainer}>` component.
- `useTour()` hook returning `start(tourId)`, `stop()`, `isActive`, `currentStep`, `progress`.
- `useTourProgress(tourId)` hook for reactive completion state.
- Zero framework-specific tour rendering — Shepherd's DOM is used as-is; adapter only bridges the trainer.
- Works in React 17 and 18.

## Full scope (later)

- React Server Components support.
- `<TourTrigger tourId="...">` render-prop component for declarative triggers.
- Suspense integration for content loading from API.

## Acceptance criteria

- [ ] `<TourProvider>` throws a clear error if `trainer` prop is missing.
- [ ] `useTour()` throws a clear error if called outside a provider.
- [ ] Calling `start("tour-id")` from a child component mounts the tour.
- [ ] `isActive` is reactive — flips to `true` when a tour starts, `false` when it ends.
- [ ] Progress updates trigger re-renders.
- [ ] Works in a fresh Create-React-App and a fresh Vite React app.
- [ ] Bundle size under 5 KB min+gzip (excluding engine and Shepherd).

## Open questions

- Do we support conditional rendering of the provider (e.g., only wrap authenticated app)? → Yes. Trainer stays alive across provider mount/unmount cycles; no state loss.

## Risks

- React 19 breaking changes when it lands. Mitigation: peer-dep on React ≥17, test against betas.
