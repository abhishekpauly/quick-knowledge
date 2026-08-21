# In-App Training SDK

[![CI](https://github.com/abhishekpauly/quick-knowledge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/abhishekpauly/quick-knowledge/actions/workflows/ci.yml)

An in-house in-app product training system. First customer: **the example app**. Designed as a reusable SDK so other host products can adopt it without a rewrite.

**Owner:** Technical Curriculum Developer + Claude AI Engineer
**Status:** Sprint 19 shipped — `v1.0.0-api.2`. Three production adopters (example-app, Adopter A, Reports = Adopter C on the API path; Adopter B on the API path this sprint). `v1.0.0` stable tag lands end of Sprint 20. See [`ROADMAP.md`](ROADMAP.md) and [`docs/migration-v1.md`](docs/migration-v1.md) for the upgrade path from v0.5.
**Repository layout:** monorepo with npm workspaces.

---

## Packages

| Package | Location | Purpose |
| --- | --- | --- |
| `@in-app-training/sdk` | `packages/core/` | Framework-agnostic engine, content schema, adapters, theme. |
| `@in-app-training/react` | `packages/react/` | React adapter — `<TourProvider>`, `useTour`, `useTourProgress`, `<FirstRunTour>`. |
| `@in-app-training/vue` | `packages/vue/` | Vue 3 adapter — API-parity with React. Un-deferred once the example app's 50/50 React/Vue mix was confirmed. |
| `@in-app-training/api-server` | `packages/api-server/` | Framework-agnostic reference REST server for the v1.0 API (ADR-0007). In-memory + file-backed `ContentStore` implementations. Adopters wire their own HTTP framework. |
| `@in-app-training/api-client` | `packages/api-client/` | Typed fetch client for the same surface. 429 backoff, injectable `fetch`/`sleep` for tests. |

## Repo layout

```
in-app-training-sdk/
├── README.md, ROADMAP.md, CHANGELOG.md, CONTRIBUTING.md
├── package.json                 npm workspaces root
├── tsconfig.base.json           shared compiler options
├── tsconfig.json                references to workspace packages
├── vite.config.ts               demo dev server (packages/*/src via aliases)
├── packages/
│   ├── core/                    @in-app-training/sdk
│   │   ├── package.json, tsconfig.json, tsconfig.build.json, vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts         Public API
│   │   │   ├── engine/          Trainer, event types, public types
│   │   │   ├── schema/          Zod v1 schema, loader
│   │   │   ├── adapters/        Analytics + persistence interfaces + impls
│   │   │   └── theme/           CSS variables, default + the example app themes
│   │   └── tests/               Vitest suites (schema, persistence, trainer)
│   └── react/                   @in-app-training/react
│       ├── package.json, tsconfig.json, tsconfig.build.json, vitest.config.ts
│       ├── src/                 TrainerContext, TourProvider, hooks, FirstRunTour
│       └── tests/               React Testing Library
├── content/                     Tour JSON authored by curriculum team
│   ├── _template.tour.json
│   └── example-app/             Product-scoped folder
├── docs/
│   ├── architecture.md
│   ├── content-schema.md
│   ├── data-tour-conventions.md
│   ├── how-to-author-a-tour.md  For curriculum authors
│   ├── how-to-integrate.md      For host product teams
│   ├── analytics-adapters.md    Concrete recipes for PostHog / Amplitude / etc.
│   └── adrs/                    4 ADRs + template
├── features/                    15 feature specs + template
├── tracker/                     Backlog + sprint plans + selector proposal
├── testing/                     Test strategy + acceptance criteria
├── releases/                    Deploy checklist, rollback runbook, v0.1.0 plan
├── product/                     Stakeholder-facing docs (overview, use cases, ROI)
├── demo/                        Runnable demo (npm run dev)
└── scripts/                     validate-content.ts, validate-selectors.ts
```

## Start here

Pick your entry point based on why you're here:

- **Non-technical / stakeholder / evaluating adoption** → `product/README.md` (overview, use cases, ROI).
- **Adopting the SDK in a product (engineer)** → `docs/how-to-integrate.md`.
- **Writing tour content (curriculum author)** → `docs/how-to-author-a-tour.md`.
- **Building on the SDK / contributing** → `docs/architecture.md`, then `tracker/backlog.md` for current work.
- **Planning the roadmap** → `ROADMAP.md`.

## Common commands

From the repo root:

```bash
npm install                      # install all workspaces
npm run dev                      # live demo at localhost:5173
npm test                         # test all packages
npm run build                    # build all packages
npm run typecheck                # typecheck all packages
npm run lint
npm run format
npm run validate:content         # Zod-validate all tour JSON
npm run validate:selectors -- --content ./content --host ../example-app-frontend/src
npm run ci                       # typecheck + lint + test + validate:content
```

Per-package:

```bash
npm test --workspace @in-app-training/sdk
npm run build --workspace @in-app-training/react
```

## Definitions

- **Engine** — framework-agnostic TypeScript core, built on top of Shepherd.js.
- **Content** — tours authored as JSON, validated by a Zod schema.
- **Adapter** — thin per-framework binding. React and Vue both shipped.
- **`data-tour` contract** — every element a tour can target has a stable `data-tour="..."` attribute. Selectors are validated in CI.
- **Product** — a host product that installs this SDK. First is the example app.

## Versioning

Semantic versioning per package. Content schema versioned independently (`schemaVersion: "v1"` in every tour) so we can support v1 and v2 in parallel during migrations.

## Related

- Plan of record (living doc): see the "In-App Training" Claude project.
- Governance for cross-product feature requests: see `CONTRIBUTING.md`.
