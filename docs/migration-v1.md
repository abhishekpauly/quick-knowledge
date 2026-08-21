# Migrating from v0.5 to v1.0

**Sprint 19 · T-284.** Written in advance of the `v1.0.0` stable tag (end of Sprint 20). Everything shipped in the v1.0-api preview is additive — hosts on `v0.5.0` continue to run unchanged. This doc is for hosts choosing to opt in to the new capabilities.

## What v1.0 adds

- **Content served from the API** (`RemoteContentSource` + `@in-app-training/api-server` + `@in-app-training/api-client`). Publish content without a host redeploy.
- **`Trainer.replaceTours(newTours, { dismissActive? })`** — reactive tour-set swap. Wire it to `content_bundle_updated` for hot updates without a page reload.
- **`Trainer.forgetUser(userId?)`** — GDPR right-to-erasure (ADR-0005, shipped in Sprint 12).
- **`ConsentAdapter`** — consent-category-gated tour execution and analytics emission (ADR-0006, shipped in Sprint 12).
- **Persistent `ContentStore` reference** — `createFileContentStore({ root })` for adopters who want a boring server without picking a database on day one.

## What did NOT change

- **Content schema.** Every tour, pin, and hint that validated against `v1` at v0.5 still validates. The additive fields (`goal`, `consentCategory`, `preferredCorner`, etc.) are all optional.
- **`Trainer` constructor.** Same signature. All new engine features are opt-in via new methods or new `TrainerConfig` fields.
- **Analytics dictionary.** Existing 11 events unchanged. Two new events (`content_bundle_updated`, `content_bundle_update_failed`) are only emitted if you wire `RemoteContentSource`.
- **React and Vue adapter surface.** No renames, no removals.

## Upgrade recipes

### Recipe A — I don't want the API, just the new engine features

Nothing to do. `Trainer.replaceTours` and `Trainer.forgetUser` are new methods on the same class you already have. Import as before:

```ts
import { Trainer } from '@in-app-training/sdk';
```

### Recipe B — I want hot-updates from the API

1. Stand up a server. The reference implementation is 20 lines against Fastify / Express / native `http` — wire the framework-agnostic handlers from `@in-app-training/api-server`. Use `createFileContentStore` unless you already run a database you'd rather back it with.
2. Grant your host a bearer token with `content:read` scope from your existing auth service. **Do not invent a token store** — that's the "Never build IAM" line from the v1.0 kickoff.
3. Add `RemoteContentSource` to the host. Boot flow from ADR-0008: read cache → serve immediately → background fetch → atomic swap.
4. Wire the source's `on()` listener to `Trainer.replaceTours(source.snapshot()?.body ?? [])` when `content_bundle_updated` fires.
5. Optional: pass `{ dismissActive: true }` if you want interrupt-on-swap (the running tour dismisses instead of finishing on the old bundle).

Full example in `docs/wiring-content-api.md`.

### Recipe C — I want GDPR delete propagation

1. Call `trainer.forgetUser(userId)` from your account-deletion pipeline. Receipt returns synchronously.
2. If you also run the API server, expose the `users:forget` scope to your compliance service and wire `POST /users/:userId/forget` — see ADR-0005 for the receipt shape and the audit-log requirement.

### Recipe D — I want consent gating

1. Implement `ConsentAdapter` — the `read()` method returns the currently granted categories; the optional `subscribe()` re-runs the engine on change.
2. Pass it as `TrainerConfig.consent`. Tours with `consentCategory: 'analytics'` (etc.) are skipped when that category isn't granted; analytics events are similarly gated.

Full ADR + wiring notes at [`docs/adrs/ADR-0006-consent-gating-hook.md`](adrs/ADR-0006-consent-gating-hook.md).

## Compatibility matrix

| Host on… | Adopts v1.0 by… | Breaks? |
| --- | --- | --- |
| `v0.5.0` stable | Bumping the SDK version | No |
| `v0.5.0` + custom `Persistence` | Bumping the SDK version | No — `Persistence` interface unchanged |
| A pre-v0.1 fork | Migrate to `v0.5.0` first | Skip that path; v0.5 → v1.0 is smaller than pre-v0.1 → v1.0 |

## Deprecations

None planned in v1.0. The `-preview` API tags (`v1.0.0-api-preview`, `v1.0.0-api`, `v1.0.0-api.1`, `v1.0.0-api.2`) collapse into `v1.0.0` at the end of Sprint 20; no code change is required for adopters already on any `-api*` tag.

## Sprint 20 to-dos before `v1.0.0`

- `zod-to-openapi` refactor (T-290, descriptions-only scope) so the generated spec references the SDK schema by name rather than the current `type: object` placeholder.
- Retool dashboard panel 6 (consent-gated tour skips) plus the Slack alert on `content_bundle_update_failed > 10/hour` (T-291).
- CHANGELOG cleanup — collapse the four `-api*` preview headers into one `v1.0.0` header.
- Tag `v1.0.0` and drop the `-preview` suffix everywhere.
