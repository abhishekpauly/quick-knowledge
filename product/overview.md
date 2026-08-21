# Overview

## What this software is

An in-house SDK that puts guided walkthroughs directly inside a product's UI. Instead of writing a help article and hoping users find it, we attach a "tour" to real buttons and screens — the tooltip says "click New Project," the user clicks it, the tour advances to the next step.

Think of it as the machinery behind the welcome tours you see in Notion, Linear, or Figma — but owned by the org, matching the org's brand, connected to the org's analytics, and reusable across every product we build. No per-user subscription bill from a third-party vendor.

The first customer is the example app. The SDK is designed from day one to slot into any other host product with minimal integration work.

## Technical shape (one paragraph)

Two npm packages: `@in-app-training/sdk` (the framework-agnostic engine, built on Shepherd.js) and `@in-app-training/react` (the React glue — provider, hooks, checklist widget, hint component). Vue can slot in later as a third package without changing the engine. Tour content is versioned JSON files that live in git; a Zod schema validates every file at build time and CI rejects bad content before it reaches users. A `data-tour` attribute contract on host-product elements survives frontend refactors; a CI script fails the build if any referenced attribute has been renamed or removed.

## Who it's for and what they get

**End users of host products.** Contextual help exactly when they need it, without leaving the app or hunting through docs. First-run tours orient new users; per-workflow walkthroughs teach specific tasks; `?` icons on form fields explain confusing options; a checklist widget in the corner lets them redo or discover more anytime. Skippable at every step — no forced onboarding.

**Curriculum owner (technical curriculum developer).** Authors training as versioned JSON files that read like structured documents. Edit copy, add a step, ship a new tour by opening a PR. No engineering ticket to change wording. Roughly one hour of authoring per five-step tour once you're familiar with the format. Content updates ship with the next product release.

**Product engineering teams.** Install two npm packages, add stable `data-tour` attributes to any element a tour needs to point at, wrap their app in `<TourProvider>`, wire an analytics adapter. Done in a few hours per product. After the initial integration, they get to opt out of training-content changes forever — those become PRs to the SDK's content folder, not to their product.

**Product managers.** Get measurable adoption and activation metrics on training via typed analytics events (`tour_started`, `step_viewed`, `step_completed`, `tour_completed`, `tour_dismissed`, `tour_error`). Every step's completion and drop-off is visible in whatever analytics tool the product already uses (Amplitude, PostHog, Mixpanel, GA4, custom).

**Leadership.** A shared infrastructure investment that pays back inside year one on the first product and returns pure upside on every additional product that adopts it — because we avoid $6–24k/year in SaaS licenses per product forever, without vendor lock-in, and own the code, the data, and the roadmap.

## What it is NOT

- Not a marketing tool for external-facing landing pages.
- Not a full LMS (learning management system) — it doesn't track certifications, quizzes, or long-form courses.
- Not a documentation site — those live in GitBook. This is training that happens *inside* the product, not text you read outside it.
- Not a customer support chat — no live agents, no messaging.
- Not a video player — tours are inline tooltips, not embedded video.

For all of those, use the right tool. The Training SDK does one thing well: guide users through host product UIs with contextual, in-product walkthroughs.
