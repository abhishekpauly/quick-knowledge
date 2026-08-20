# ADR-0001: Build the engine on top of Shepherd.js

- **Status:** Accepted
- **Date:** 2026-08-20
- **Deciders:** Curriculum + Engineering (solo)

## Context

We need a tour engine that handles tooltip positioning, DOM targeting, scroll/overflow edge cases, and lifecycle. Building this from scratch is possible but boring, and every popular UI library ends up using Floating UI for positioning anyway. We also want to focus our engineering time on the pieces that make this reusable across products (content schema, adapters, `data-tour` contract, CI), not on tooltip plumbing.

## Decision

Build the engine on top of Shepherd.js as its foundation. Shepherd.js is MIT-licensed, framework-agnostic, actively maintained, and already uses Floating UI. We wrap it with our own content loader, adapter interfaces, analytics event emission, `data-tour` enforcement, and theming layer.

## Alternatives considered

- **Build from scratch.** Full ownership, no upstream dependency. Rejected — the tooltip lifecycle bugs are known and expensive; Shepherd.js has already found them.
- **Driver.js.** Simpler and smaller than Shepherd.js. Rejected — less flexible, weaker plugin surface, smaller ecosystem.
- **Intro.js.** Popular but licensed AGPL for commercial use unless you buy a license. Rejected on licensing.
- **Reactour.** React-only. Rejected — we need framework-agnostic.
- **Fork Shepherd.js.** Rejected for MVP — no reason to diverge yet. Reconsider if we outgrow it.

## Consequences

### Positive
- Days-not-weeks to a working tour engine.
- Tooltip positioning, scroll behavior, and accessibility get inherited (mostly) for free.
- Shepherd.js's step-lifecycle events map cleanly onto our analytics event schema.

### Negative
- Upstream dependency risk. If Shepherd.js stalls, we may need to fork.
- Shepherd.js's built-in styling has to be overridden to fit our theme system.
- Our public API is downstream of Shepherd's — breaking changes upstream become breaking changes for us if we expose them.

### Neutral
- Our engine wraps Shepherd's API rather than exposing it directly. Consumers of our SDK never see Shepherd types — they see our types. This gives us room to swap the base later if we need to.

## Revisit triggers

- Shepherd.js is unmaintained for 12+ months.
- Our custom needs (branching, sandbox, complex advance conditions) require patching Shepherd more than 3 times.
- Bundle size becomes a blocker.
