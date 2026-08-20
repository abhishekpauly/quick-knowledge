# Use cases

Seven concrete scenarios the SDK enables today. All of these are supported by v0.1.0-mvp.

## 1. First-run onboarding

A four-minute walkthrough that runs the first time a user lands in the app. Auto-triggers via a `first-run` trigger; the persistence layer ensures it never repeats after completion or dismissal.

*Structure:* 5–7 steps. Welcome (center-placement), main nav orientation, workspace, one "aha" action, wrap-up.

*Why it matters:* New users who complete onboarding activate at meaningfully higher rates than those who don't. Even a 5–10% lift compounds into retention and revenue.

*Currently shipping:* `content/ai-platform/onboarding.tour.json`, 6 steps.

## 2. Workflow tutorials by difficulty

Basic → intermediate → advanced. Users unlock each level as they complete prerequisites (the SDK enforces this via the `prerequisites` field in every tour).

*Structure:*
- Basic: one workflow end-to-end (e.g., "create your first project").
- Intermediate: chain multiple concepts (e.g., "connect a data source, transform it, deploy the model").
- Advanced: opinionated patterns (e.g., "set up a scheduled retraining pipeline").

*Why it matters:* Users learn at their pace. Advanced content stays hidden until they're ready — no overwhelming beginners; no boring power users.

*Currently shipping:* `content/ai-platform/workflows-create-project.tour.json`. More authored in Sprint 04 based on user testing.

## 3. Common-task walkthroughs

Short, on-demand tours for tasks users need occasionally but not every day: "invite a teammate," "change your billing plan," "configure a webhook," "rotate an API key."

*Structure:* 3–5 steps. Usually launched from a help menu, the checklist widget, or a `?` link inside the relevant screen.

*Why it matters:* These are the walk-me-through questions that drive support tickets. Covered once here, they stop appearing in the queue.

## 4. Contextual hints on form fields

The `?` icons next to inputs that answer "what does this field actually do?" without cluttering the UI or making users open a doc.

*Structure:* One-to-two-sentence body (hard-capped at 280 characters — the SDK enforces this), optional "Learn more" link to the full doc.

*Why it matters:* Cheaper than a tour, more discoverable than a doc, and doesn't interrupt the user's flow.

*Currently shipping:* `content/ai-platform/hints.json` with three real hints (workflow node names, project region, model max tokens).

## 5. Feature-launch nudges

When any UPTIQ product ships a new feature, a targeted tour introduces it — but only to users who would benefit. Triggered by the URL of the new feature's page or by an analytics event that signals eligibility.

*Structure:* 2–4 steps. Highlights the entry point, explains the value, walks the user through their first use.

*Why it matters:* New features typically get discovered by a small fraction of users organically. A launch tour lifts feature adoption 3–5x. Every launch that lands better justifies the engineering that built it.

*How it's built:* Author a tour with `triggers: [{ "type": "url", "pattern": "/new-feature/*" }]`. Ship it with the feature. Remove it after N weeks once discovery has saturated.

## 6. Support ticket deflection

Systematic: identify the top 10 confusing screens or workflows from support tickets. Cover each with a hint or a mini-tour. Watch those tickets stop appearing.

*Process:*
1. Pull support tickets from the last quarter.
2. Categorize by "which screen/workflow was the user on."
3. Pick the top 10 by volume.
4. Author training content covering each.
5. Ship. Measure ticket volume against the baseline over the next 30 days.

*Why it matters:* Every deflected ticket is 15–30 minutes of support time saved. At UPTIQ's loaded support cost, this is measurable in dollars within weeks. See `roi.md` for the math.

## 7. Sales demo prep for enterprise deals

A specific `sales-demo` tour that account executives can trigger during a live walkthrough with a prospect. Consistent story every time; new AEs ramp faster; the demo doesn't depend on individual reps' memory of the current feature set.

*Structure:* Slightly different from user tours — often longer (10+ steps), covers the "art of the possible" rather than a specific task.

*Why it matters:* Sales enablement without a separate deck. Product and Sales stay in sync automatically because the tour lives in the same repo as the product.

*How it's built:* Same as any other tour, but tagged for internal-only visibility (segmentation feature — deferred to v0.2; today, use a URL trigger keyed to a specific `?demo=1` query param).

## Future use cases (deferred, when triggered)

- **Segmented content** — show different tours to enterprise admins vs. free-tier users. Deferred until a PM asks.
- **A/B testing** — split-test two versions of the same tour to see which drives better completion. Deferred until we have two viable variants for the same tour.
- **Sandbox mode** — walk users through risky advanced workflows (e.g., "deploy a model") in a cloned DOM so no real state changes. Deferred until a specific tour needs it.
- **Cross-device sync** — user completes onboarding on desktop, doesn't re-see it on mobile. Deferred until users complain.

## The pattern to notice

Every use case here is possible in v0.1.0-mvp. What's changing over time is the sophistication of the *content*, not the *engine*. The SDK is deliberately small — powerful primitives, few features — because that's what makes it easy to adopt in a new product without spending weeks on integration.

Curriculum quality is what drives the outcomes. The SDK removes the friction of shipping and updating training; it doesn't guarantee the training itself lands with users. That's why the 5-user usability test is baked into every release.
