# FEAT-013: Sandbox mode for advanced/risky workflows

- **Status:** Deferred
- **Priority:** P3
- **Sprint:** TBD

## Problem (future)

Advanced the example app workflows involve real cost (model training, deploys, spend). A tour that walks a user through "deploy a model" shouldn't actually deploy the model.

## Deferral rationale

Building a sandbox is hard. Storylane / Navattic / Arcade do this well as a paid service. Evaluate buy-vs-build when the need is concrete.

**Promotion trigger:** A specific advanced tour is blocked because we can't safely run it against real data.

## Options to evaluate at that time

- **Storylane / Navattic / Arcade** — SaaS clickable simulations. Fast, polished. Cost per user.
- **Iframe clone** — clone the DOM at tour start, intercept API calls, render responses from fixtures. Cheaper long-term, more custom work.
- **Read-only mode flag** — cheapest: host product exposes a `?tourMode=1` param that blocks writes. Requires product cooperation.
