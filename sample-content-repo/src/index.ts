/**
 * Public exports of the example app training content.
 *
 * Consumers (the example app frontend) import from here:
 *
 *   import { tours, hints } from '@in-app-training/example-app-content';
 *   const trainer = new Trainer({ tours, analytics, persistence });
 *
 * Content is parsed and validated at import time — any schema mistake fails
 * fast at boot rather than at first render.
 */
import { parseTour, parseHints, type Tour, type HintsFile } from '@in-app-training/sdk';
import onboardingRaw from '../tours/onboarding.tour.json' with { type: 'json' };
import workflowsRaw from '../tours/workflows-create-project.tour.json' with { type: 'json' };
import hintsRaw from '../hints.json' with { type: 'json' };

function mustTour(raw: unknown, name: string): Tour {
  const result = parseTour(raw);
  if (!result.ok || !result.tour) {
    throw new Error(`Content validation failed for ${name}: ${JSON.stringify(result.errors)}`);
  }
  return result.tour;
}

function mustHints(raw: unknown): HintsFile {
  const result = parseHints(raw);
  if (!result.ok || !result.file) {
    throw new Error(`Hints validation failed: ${JSON.stringify(result.errors)}`);
  }
  return result.file;
}

export const tours: Tour[] = [
  mustTour(onboardingRaw, 'onboarding'),
  mustTour(workflowsRaw, 'workflows-create-project'),
];

export const hints: HintsFile = mustHints(hintsRaw);
