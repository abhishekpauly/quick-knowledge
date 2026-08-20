# How to use

Three angles: curriculum authoring, product integration, end-user experience. Different audiences, different workflows.

## For the curriculum author (technical curriculum developer)

Your day-to-day workflow once integration is done.

**Author a new tour**
1. Copy `content/_template.tour.json` to `content/<product>/<short-id>.tour.json`.
2. Fill in the metadata: `id`, `title`, `difficulty` (`onboarding` / `basic` / `intermediate` / `advanced` / `common-task`), `estimatedMinutes`, `triggers`, `prerequisites`.
3. Write 5–8 steps. Each step has a target (`[data-tour="..."]` selector), placement, one-to-two-sentence body.
4. Run `npm run validate:content` — Zod catches schema mistakes at your desk, not in front of a user.
5. Run `npm run validate:selectors` — grep confirms every referenced `data-tour` attribute exists in the host product's code.
6. Preview at `http://localhost:5173` with `npm run dev`.
7. Open a PR. Reviewer: the SDK engineer.

**Author a new hint**
1. Add an entry to `content/<product>/hints.json`.
2. Body must be ≤ 280 characters (the schema enforces this).
3. Optional `learnMoreUrl` for the full doc.
4. Same validation + PR flow.

**Update existing copy**
- Edit the JSON. Open a PR. Ships with the next product release.
- No engineering ticket. No engineering time.

**Test a tour with real users**
- Follow `testing/five-user-test-protocol.md`. Recruit 5, run in one afternoon, iterate on copy.

**Time investment (once you're familiar):**
- New tour: ~1 hour per five-step tour.
- New hint: ~10 minutes.
- Copy tweak: ~5 minutes.
- Ongoing maintenance across ~20 tours: ~2 hours/week.

## For the product engineer (integrating the SDK)

One-time integration per product.

**Install**
```bash
npm install @uptiq/training-sdk @uptiq/training-sdk-react
```

**Add `data-tour` attributes** to any element a tour will point at. Naming convention: `<area>-<component>-<intent>` (e.g. `sidebar-projects-link`, `workflows-canvas-add-node-button`). See `docs/data-tour-conventions.md`.

**Wire the analytics adapter** — one implementation of the `Analytics` interface for your product's sink (PostHog, Amplitude, Mixpanel, GA4, custom). Recipes for all common sinks in `docs/analytics-adapters.md`.

**Construct the trainer** once at app root, mount the provider:
```tsx
<TourProvider trainer={trainer} theme={aiPlatformTheme}>
  <FirstRunTour tourId="ai-platform-onboarding" />
  <TrainingChecklist />
  <YourApp />
</TourProvider>
```

**Trigger tours from anywhere** with `useTour()` and read progress with `useTourProgress()`. Full guide with copy-pasteable code in `docs/how-to-integrate.md`.

**Time investment:**
- Initial integration: ~4 hours to first working tour.
- Ongoing: ~0 hours per week. Content is not the engineer's problem after integration.

## For the end user (of any UPTIQ product using the SDK)

No install, no setup. Just uses the app.

**First visit:** Onboarding tour appears automatically after a short delay. Six steps, about four minutes. Skippable at any point with the X button. Won't re-appear once completed or dismissed.

**Any time:** Open the checklist widget in the bottom-right corner. See all available tours grouped by difficulty. Green checkmark = completed. Grayed out = prerequisites not yet met. Click any unlocked tour to start it.

**Contextual help:** Hover any `?` icon next to a form field for a quick explanation. Click it to pin the explanation open until you click elsewhere.

**Skip anytime:** Every tour has an X in the corner. Every checklist item has a dismiss option. No forced onboarding — the SDK respects the user's time.

**Redo a tour:** Open the checklist. Click the completed tour. It re-runs from step 1. Useful when a user comes back after a while or when they want to show a colleague.

## The typical adoption timeline for a new product

Day 1: Integrate the SDK (~4 hours).
Day 1–3: Curriculum author writes the first onboarding tour + 1–2 workflow tours.
Day 4: Deploy to staging. Run 5-user test.
Day 5: Iterate on copy.
Day 6: Ship to production.
Day 7+: Watch analytics. Iterate on lowest-completion tours.

**Total time from decision to live: about one week per new product.**
