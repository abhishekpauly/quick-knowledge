# Acceptance criteria & manual smoke test

Run this before every release. ~30 minutes.

## Environment

- Fresh browser profile (no localStorage).
- QA / staging environment of AI Platform.
- One test user account.

## Suite

### 1. Onboarding tour — first-run trigger
- [ ] Sign in as a fresh user.
- [ ] Onboarding tour auto-starts within 2 seconds of landing on the dashboard.
- [ ] All 6 steps advance correctly.
- [ ] Clicking Skip mid-tour dismisses cleanly. No console errors.
- [ ] Sign out. Sign back in. Onboarding tour does NOT re-trigger. (Persistence works.)

### 2. Onboarding tour — completion
- [ ] Reset localStorage. Sign in.
- [ ] Complete all onboarding steps end-to-end.
- [ ] Final "you're ready" step shows.
- [ ] Analytics shows: `tour_started`, 6× `step_viewed`, `tour_completed` — in order, with correct `tourId`.

### 3. Workflow tour — manual trigger
- [ ] Click the checklist widget (bottom-right).
- [ ] Expand it. See onboarding checked, workflow tours listed.
- [ ] Click "Create your first workflow".
- [ ] Tour starts.
- [ ] All 4 steps advance.
- [ ] Completion checkmark appears in the widget.

### 4. Intermediate workflow tour — advanceOn triggers
- [ ] Start the intermediate tour.
- [ ] A step whose `advanceOn` is `click` — verify: only advances after the click, not on Next button.
- [ ] A step whose `advanceOn` is `url` — verify: navigation to the matching URL advances the tour.

### 5. Common task tour
- [ ] Start the "how to X" common-task tour from the widget.
- [ ] Verify it completes.

### 6. Theming
- [ ] Tooltip colors match AI Platform brand.
- [ ] Font matches app font.
- [ ] No visual clashes with app CSS.

### 7. Advanced targeting — lazy render
- [ ] Trigger a tour whose second step targets an element rendered after a route change.
- [ ] Verify: tour waits (up to 3s) for the element and then attaches.
- [ ] Simulate the target never appearing: verify tour skips the step and emits `tour_error` after timeout.

### 8. Contextual hints
- [ ] Find a `<TrainingHint>` `?` icon in the app.
- [ ] Hover: hint appears.
- [ ] Click: hint pins open.
- [ ] Click elsewhere: hint dismisses.

### 9. Analytics wiring
- [ ] Open the analytics debug panel / adapter's live view.
- [ ] Verify every event from the tests above landed with the expected payload shape.
- [ ] No missing fields, no extra fields, no wrong types.

### 10. Cross-browser
- [ ] Repeat test 1 in Chrome, Firefox, Safari (latest).
- [ ] Note any browser-specific issues; file them as bugs unless blocking.

## Pass criteria

- All checkboxes ticked.
- Zero console errors during any tour.
- No visual regressions vs. last release (compare screenshots).

## What to do if it fails

- Any P0 (tour completely broken): block the release. Fix, re-test.
- Any P1 (edge case, one browser only, one specific tour): file a bug. Decide on ship/hold with the SDK engineer.
- Any P2 (cosmetic, non-blocking): file a bug. Ship.
