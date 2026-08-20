# Content repositories

Per direction, tour content lives in a **separate repo per product** — not bundled with the SDK.

The SDK is a runtime. Content is authored, versioned, and published independently. This separates the concerns:

- **SDK repo (this repo)** — engine, adapters, schema, sample tours for testing.
- **Product content repo (one per adopting product)** — that product's tour and hint JSON, published as an internal npm package.

## Anatomy of a product content repo

```
ai-platform-training-content/
├── package.json                (name: @uptiq/ai-platform-training-content)
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
  "name": "@uptiq/ai-platform-training-content",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "validate": "tsx ../in-app-training-sdk/scripts/validate-content.ts tours",
    "validate:selectors": "tsx ../in-app-training-sdk/scripts/validate-selectors.ts --content tours --host ../ai-platform-frontend/src",
    "ci": "npm run validate && npm run validate:selectors"
  },
  "dependencies": {
    "@uptiq/training-sdk": "*"
  }
}
```

### `src/index.ts`

```ts
import { parseTour, parseHints, type Tour, type HintsFile } from '@uptiq/training-sdk';
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
// In AI Platform's frontend
import { Trainer } from '@uptiq/training-sdk';
import { tours, hints } from '@uptiq/ai-platform-training-content';
import { analytics } from './analytics-adapter';

export const trainer = new Trainer({
  product: 'ai-platform',
  tours,
  analytics,
  persistence: localStoragePersistence(),
  theme: aiPlatformTheme,
});
```

## Why separate repos?

- **Curriculum team owns their repo.** No PR review conflicts with SDK engineers over tour copy.
- **Content ships on the product's release cadence, not the SDK's.** A copy tweak doesn't require an SDK release.
- **Different products have different content lifecycles.** AI Platform ships weekly; a slower product might ship monthly. Coupling to one SDK release cadence hurts both.
- **Access control differs.** SDK repo may need broader access (engineering + curriculum). Content repos can be scoped to curriculum team only.

## Naming convention

- SDK: `@uptiq/training-sdk`, `@uptiq/training-sdk-react`, `@uptiq/training-sdk-vue`.
- Content repos: `@uptiq/<product>-training-content` (e.g. `@uptiq/ai-platform-training-content`).

## Governance

- Every content repo pins a specific SDK version in its `package.json`.
- Breaking schema changes bump the SDK's MAJOR version and require content repos to update — but they can update on their own timeline.
- Content-repo CI runs the SDK's own `validate-content` and `validate-selectors` scripts against the linked host codebase.
- Content-repo PRs get reviewed by the curriculum owner (or a peer curriculum author when there are more than one).

## Sample content

The `content/ai-platform/` folder in this SDK repo is **sample content** — kept for the demo (`npm run dev`) and for tests. It is NOT the source of truth. The real AI Platform content will live in `@uptiq/ai-platform-training-content` once that repo is created.

Do NOT keep two copies in sync. When the real content repo exists, either:

- Delete `content/ai-platform/` and switch the demo to import from the content repo, OR
- Keep `content/ai-platform/` as a minimal 1-tour demo fixture only, clearly labeled as such.

## Creating a new content repo (checklist)

- [ ] `npm init @uptiq/<product>-training-content`.
- [ ] Add `@uptiq/training-sdk` as a dependency.
- [ ] Copy `content/_template.tour.json` as a starting point.
- [ ] Copy `content/ai-platform/hints.json` structure for hints.
- [ ] Add `scripts/validate.ts` that shells out to the SDK's validators.
- [ ] Add CI running `npm run validate` on every PR.
- [ ] Add a README with links back to `docs/how-to-author-a-tour.md` and this doc.
- [ ] Publish to the internal npm registry.
- [ ] Host product installs it and imports `tours` + `hints`.
