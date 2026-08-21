# FEAT-006: LocalStorage persistence adapter

- **Status:** Backlog
- **Priority:** P1
- **Sprint:** SPR-02
- **Owner:** Solo build
- **Depends on:** FEAT-001
- **Related ADRs:** ADR-0004

## Problem

We need to remember which tours a user has completed so we don't re-trigger onboarding on every mount. For MVP, per-browser is fine.

## Solution sketch

`Persistence` interface with `get(key)` and `set(key, value)`. Default impl uses `localStorage` with a namespaced key prefix. Async API from the start so a backend adapter is a drop-in later.

## MVP scope

- `localStoragePersistence()` factory.
- Async `get` / `set`.
- Namespaced keys: `in-app-training:<product>:<tourId>:<field>`.
- Graceful degradation if localStorage is unavailable (private mode) — falls back to in-memory.

## Acceptance criteria

- [ ] Completing a tour writes a completion record to localStorage.
- [ ] Re-mounting reads that record and does not re-trigger first-run tours.
- [ ] Works when localStorage is blocked (falls back to in-memory, logs a warning).
- [ ] Keys are namespaced by product so multiple host products on the same origin don't collide.

## Risks

- Users clear localStorage → tour reappears. Acceptable for MVP.
