/**
 * Demo entry point.
 *
 * Wires the SDK up against the mock the example app layout in index.html.
 * Run with `npm run dev` — Vite serves it at http://localhost:5173.
 *
 * NOTE: This demo uses the vanilla engine directly. A React demo lives in
 * demo/react/ (Sprint 04) and exercises TourProvider, hooks, and the
 * TrainingChecklist widget.
 */
import {
  Trainer,
  consoleAnalytics,
  localStoragePersistence,
  applyTheme,
  exampleAppTheme,
  parseTour,
  parseHints,
} from '@in-app-training/sdk';

import onboardingRaw from '../content/example-app/onboarding.tour.json';
import workflowsRaw from '../content/example-app/workflows-create-project.tour.json';
import hintsRaw from '../content/example-app/hints.json';

// 1. Validate content at boot.
const onboarding = parseTour(onboardingRaw);
const workflows = parseTour(workflowsRaw);
const hints = parseHints(hintsRaw);
if (!onboarding.ok || !workflows.ok || !hints.ok) {
  console.error('Content validation failed', { onboarding, workflows, hints });
  throw new Error('Invalid content — check the console.');
}

// 2. Apply theme.
applyTheme(exampleAppTheme);

// 3. Construct trainer.
const trainer = new Trainer({
  product: 'example-app',
  tours: [onboarding.tour!, workflows.tour!],
  analytics: consoleAnalytics(),
  persistence: localStoragePersistence(),
  theme: exampleAppTheme,
});

// 4. Wire demo controls.
document.getElementById('start-onboarding')!.addEventListener('click', () => {
  void trainer.start('example-app-onboarding', 'manual');
});
document.getElementById('start-workflow')!.addEventListener('click', () => {
  void trainer.start('example-app-workflows-create-project', 'manual');
});
document.getElementById('clear-progress')!.addEventListener('click', () => {
  window.localStorage.clear();
  console.log('[demo] progress cleared. Reload to re-trigger first-run tours.');
});

// 5. Log for demo visibility.
trainer.on('tour_started', (e) => console.log('DEMO tour_started', e.payload));
trainer.on('tour_completed', (e) => console.log('DEMO tour_completed', e.payload));
trainer.on('tour_dismissed', (e) => console.log('DEMO tour_dismissed', e.payload));
trainer.on('tour_error', (e) => console.warn('DEMO tour_error', e.payload));

// 6. First-run auto-start (vanilla equivalent of <FirstRunTour>).
const progress = trainer.getProgress('example-app-onboarding');
if (progress.status === 'not-started') {
  setTimeout(() => {
    void trainer.start('example-app-onboarding', 'first-run');
  }, 300);
}

// 7. Log hints so the demo shows they're loaded even without the React widget.
console.log(`[demo] loaded ${hints.file!.hints.length} hints:`, hints.file!.hints.map((h) => h.id));
