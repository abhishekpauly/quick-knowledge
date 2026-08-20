# @uptiq/ai-platform-training-content — sample content repo

**Status:** Sample / scaffold. When the real AI Platform content repo is created, extract this to its own git repo and publish separately.

## What this shows

The shape of a real product content repo (per direction: separate content repo per product; see `docs/content-repos.md`).

## Structure

- `tours/` — one JSON file per tour.
- `hints.json` — all hints for this product.
- `src/index.ts` — public exports; parses + validates at import time.
- `package.json` — `@uptiq/ai-platform-training-content` publishable package.

## Local validation

From this folder:

```bash
npm run validate               # Zod schema check on every tour
npm run validate:selectors     # optional: point --host at AI Platform frontend to verify data-tour IDs
```

## How the host product uses it

```ts
import { Trainer, placeholderAnalytics, localStoragePersistence, aiPlatformTheme } from '@uptiq/training-sdk';
import { tours, hints } from '@uptiq/ai-platform-training-content';

export const trainer = new Trainer({
  product: 'ai-platform',
  tours,
  analytics: placeholderAnalytics(), // swap for real sink — see docs/wiring-analytics-sink.md
  persistence: localStoragePersistence(),
  theme: aiPlatformTheme,
});
```

## To extract to a real repo

- [ ] `git init` in this folder (or copy to a fresh location).
- [ ] Push to a new internal repo `uptiq/ai-platform-training-content`.
- [ ] Configure CI to run `npm run ci` on every PR.
- [ ] Publish to the internal npm registry.
- [ ] Update AI Platform frontend to depend on `@uptiq/ai-platform-training-content` instead of the SDK's sample content.
- [ ] Delete or repurpose `content/ai-platform/` in the SDK repo (or keep as a 1-tour demo fixture).
