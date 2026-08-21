# @in-app-training/example-app-content — sample content repo

**Status:** Sample / scaffold. When the real the example app content repo is created, extract this to its own git repo and publish separately.

## What this shows

The shape of a real product content repo (per direction: separate content repo per product; see `docs/content-repos.md`).

## Structure

- `tours/` — one JSON file per tour.
- `hints.json` — all hints for this product.
- `src/index.ts` — public exports; parses + validates at import time.
- `package.json` — `@in-app-training/example-app-content` publishable package.

## Local validation

From this folder:

```bash
npm run validate               # Zod schema check on every tour
npm run validate:selectors     # optional: point --host at the example app frontend to verify data-tour IDs
```

## How the host product uses it

```ts
import { Trainer, placeholderAnalytics, localStoragePersistence, exampleAppTheme } from '@in-app-training/sdk';
import { tours, hints } from '@in-app-training/example-app-content';

export const trainer = new Trainer({
  product: 'example-app',
  tours,
  analytics: placeholderAnalytics(), // swap for real sink — see docs/wiring-analytics-sink.md
  persistence: localStoragePersistence(),
  theme: exampleAppTheme,
});
```

## To extract to a real repo

- [ ] `git init` in this folder (or copy to a fresh location).
- [ ] Push to a new internal repo `in-app-training/example-app-training-content`.
- [ ] Configure CI to run `npm run ci` on every PR.
- [ ] Publish to the internal npm registry.
- [ ] Update the example app frontend to depend on `@in-app-training/example-app-content` instead of the SDK's sample content.
- [ ] Delete or repurpose `content/example-app/` in the SDK repo (or keep as a 1-tour demo fixture).
