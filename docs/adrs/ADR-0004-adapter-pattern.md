# ADR-0004: Adapter pattern for framework, analytics, persistence, and theme

- **Status:** Accepted
- **Date:** 2026-08-20
- **Deciders:** Curriculum + Engineering (solo)

## Context

The SDK will be installed in multiple UPTIQ products. Those products will differ along four dimensions we can predict:

- **Framework** — React today, likely Vue for at least one product.
- **Analytics sink** — each product wires to its own (Amplitude, Mixpanel, PostHog, internal).
- **Persistence** — some products want localStorage; enterprise ones will want backend sync for cross-device.
- **Theme** — each product has its own brand tokens.

We do not want per-product forks. We want one engine and one content format that swap behavior at these four seams.

## Decision

Four pluggable adapter interfaces, each implemented per host product:

1. **Framework adapter** — `<TourProvider>` + hooks/composables. Thin wrapper (~200 lines each).
2. **Analytics adapter** — `interface Analytics { track(event: TrainingEvent, props: Record<string, unknown>): void }`.
3. **Persistence adapter** — `interface Persistence { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> }`.
4. **Theme** — CSS variables object, applied at provider level.

The engine's constructor takes these as dependencies. Products swap them at wire-up time.

## Alternatives considered

- **Direct integration per product.** Fastest for product #1. Rejected — becomes a per-product fork the moment product #2 wants something different.
- **Configuration-only (no code adapters).** Doesn't cover cases like "route persistence writes through our custom API." Rejected.
- **Plugin system with runtime discovery.** Overkill for four seams. Rejected.

## Consequences

### Positive
- Products can adopt without waiting for SDK changes.
- Analytics and persistence needs vary widely; adapters absorb that variation cleanly.
- Testing is easier — we test the engine against mock adapters, and each adapter against its own contract.
- Framework support can grow (Vue, Svelte, …) without touching the engine.

### Negative
- Adapters are code, and code has to be maintained per product.
- Naive product teams might reach into the engine directly rather than through their adapter. Discipline needed.

### Neutral
- The public API is the adapters' surface, not the engine's. Engine internals can change without breaking products, as long as adapter contracts hold.

## Revisit triggers

- We discover a fifth seam that varies per product often enough to deserve its own adapter.
- A product's needs can't be met through any adapter — that's a signal the engine's boundaries are wrong.
