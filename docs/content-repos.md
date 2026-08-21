# Content repositories

Per direction, tour content lives in a **separate repo per product** — not bundled with the SDK.

The SDK is a runtime. Content is authored, versioned, and published independently. This separates the concerns:

- **SDK repo (this repo)** — engine, adapters, schema, sample tours for testing.
- **Product content repo (one per adopting product)** — that product's tour and hint JSON, published as an internal npm package.

## Anatomy of a product content repo

```
example-app-training-content/
├── package.json                (name: @in-app-training/example-app-content)
├── README.md
├── tours/
│   ├── onboarding.tour.json
│   ├── workflows-create-project.tour.json
│   └── ...
├── hints.json
├── src/
│   └── index.ts                (exports parsed tours + hints for consumer import)
├── scripts/
│   └── validate.ts             (runs SDK's validators against local content)
└── .github/workflows/ci.yml   (validate on PR)
```

### `package.json`

```json
{
  "name": "@in-app-training/example-app-content",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "validate": "tsx ../in-app-training-sdk/scripts/validate-content.ts tours",
    "validate:selectors": "tsx ../in-app-training-sdk/scripts/validate-selectors.ts --content tours --host ../example-app-frontend/src",
    "ci": "npm run validate && npm run validate:selectors"
  },
  "dependencies": {
    "@in-app-training/sdk": "*"
  }
}
```

### `src/index.ts`

```ts
import { parseTour, parseHints, type Tour, type HintsFile } from '@in-app-training/sdk';
import onboardingRaw from '../tours/onboarding.tour.json' with { type: 'json' };
import workflowsRaw from '../tours/workflows-create-project.tour.json' with { type: 'json' };
import hintsRaw from '../hints.json' with { type: 'json' };

// Parse at import time so consumers get typed data and any schema mistake fails
// at load, not at first tour render.
function must<T>(result: { ok: boolean; tour?: T; file?: T; errors?: unknown }): T {
  const value = (result.tour ?? result.file) as T | undefined;
  if (!result.ok || value === undefined) {
    throw new Error(`Content validation failed: ${JSON.stringify(result.errors)}`);
  }
  return value;
}

export const tours: Tour[] = [must(parseTour(onboardingRaw)), must(parseTour(workflowsRaw))];
export const hints: HintsFile = must(parseHints(hintsRaw));
```

### Host product integration

```ts
// In the example app's frontend
import { Trainer } from '@in-app-training/sdk';
import { tours, hints } from '@in-app-training/example-app-content';
import { analytics } from './analytics-adapter';

export const trainer = new Trainer({
  product: 'example-app',
  tours,
  analytics,
  persistence: localStoragePersistence(),
  theme: exampleAppTheme,
});
```

## Why separate repos?

- **Curriculum team owns their repo.** No PR review conflicts with SDK engineers over tour copy.
- **Content ships on the product's release cadence, not the SDK's.** A copy tweak doesn't require an SDK release.
- **Different products have different content lifecycles.** the example app ships weekly; a slower product might ship monthly. Coupling to one SDK release cadence hurts both.
- **Access control differs.** SDK repo may need broader access (engineering + curriculum). Content repos can be scoped to curriculum team only.

## Naming convention

- SDK: `@in-app-training/sdk`, `@in-app-training/react`, `@in-app-training/vue`.
- Content repos: `@in-app-training/<product>-training-content` (e.g. `@in-app-training/example-app-content`).

## Governance

- Every content repo pins a specific SDK version in its `package.json`.
- Breaking schema changes bump the SDK's MAJOR version and require content repos to update — but they can update on their own timeline.
- Content-repo CI runs the SDK's own `validate-content` and `validate-selectors` scripts against the linked host codebase.
- Content-repo PRs get reviewed by the curriculum owner (or a peer curriculum author when there are more than one).

## Sample content

The `content/example-app/` folder in this SDK repo is **sample content** — kept for the demo (`npm run dev`) and for tests. It is NOT the source of truth. The real the example app content will live in `@in-app-training/example-app-content` once that repo is created.

Do NOT keep two copies in sync. When the real content repo exists, either:

- Delete `content/example-app/` and switch the demo to import from the content repo, OR
- Keep `content/example-app/` as a minimal 1-tour demo fixture only, clearly labeled as such.

## Creating a new content repo (checklist)

- [ ] `npm init @in-app-training/<product>-training-content`.
- [ ] Add `@in-app-training/sdk` as a dependency.
- [ ] Copy `content/_template.tour.json` as a starting point.
- [ ] Copy `content/example-app/hints.json` structure for hints.
- [ ] Add `scripts/validate.ts` that shells out to the SDK's validators.
- [ ] Add CI running `npm run validate` on every PR.
- [ ] Add a README with links back to `docs/how-to-author-a-tour.md` and this doc.
- [ ] Publish to the internal npm registry.
- [ ] Host product installs it and imports `tours` + `hints`.
