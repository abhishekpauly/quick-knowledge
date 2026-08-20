# How to author a tour

This is the guide for the person writing training content. If you're an engineer building the SDK itself, read `architecture.md` instead.

## What a tour is

A short guided walkthrough — a series of tooltip steps anchored to real elements in the app. Each step has a target, a title, and a one-to-two-sentence body. Users can go forward, back, skip, or auto-advance based on their own actions.

Rule of thumb: if a tour is longer than 8 steps, split it into two. Users fall off.

## Before you start

- Know the difficulty level: `onboarding` · `basic` · `intermediate` · `advanced` · `common-task`.
- Know what the user should be able to do at the end. Write that down. Then work backward.
- Screen-record yourself doing the workflow. That's your first draft.

## The workflow

### 1. Copy the template

```bash
cp content/_template.tour.json content/ai-platform/<short-tour-id>.tour.json
```

Naming: kebab-case, `<product>-<intent>`. Examples: `ai-platform-onboarding`, `ai-platform-workflows-create-project`.

### 2. Fill the metadata

```json
{
  "schemaVersion": "v1",
  "id": "ai-platform-<what-this-teaches>",
  "product": "ai-platform",
  "title": "Human title the user sees",
  "description": "One line for the checklist widget.",
  "difficulty": "basic",
  "estimatedMinutes": 3,
  "triggers": [{ "type": "manual" }],
  "prerequisites": []
}
```

- **id** — globally unique, kebab-case. Never reused.
- **title** — what the user sees in the checklist. Keep it verb-first: "Create your first workflow," not "Workflows tutorial."
- **estimatedMinutes** — shown to the user before starting. Sets expectations. Round up. Real user tests almost always run longer than you expect.
- **triggers** — how the tour starts. `manual` (user clicks it), `first-run` (auto on first mount), `url` (auto on route match), `event` (auto on analytics event).
- **prerequisites** — other tour IDs that must be completed before this one is offered.
- **audience** *(Sprint 5+)* — array of `key:value` (or `!key:value`) atoms filtered against the user's attributes. Example: `["plan:enterprise", "!role:trial"]` shows the tour only to enterprise, non-trial users. Omit to show to everyone.

### Localized copy (Sprint 5+)

Any user-facing string — title, description, step title, step body, button labels — can be authored as a locale map instead of a plain string:

```json
"title": {
  "en": "Create your first workflow",
  "es": "Crea tu primer flujo",
  "fr": "Créez votre premier flux"
}
```

Plain strings still work — the SDK picks up the string as-is. The trainer resolves the right value based on `TrainerConfig.locale`: exact match first (`es-MX`), then language-only fallback (`es`), then first key.

### Personalization (Sprint 5+)

Any user-facing string can include `{{path.to.value}}` templates that interpolate from `TrainerConfig.userAttributes`:

```json
"title": "Welcome back, {{user.firstName}}!",
"body": "You're on the {{plan}} plan."
```

Values are HTML-escaped automatically — safe even if attributes come from user input. Unknown paths render as empty string with a dev-mode warning.

### 3. Write the steps

Each step is an object in the `steps` array:

```json
{
  "id": "kebab-case-step-id",
  "target": "[data-tour=\"stable-element-id\"]",
  "placement": "bottom",
  "title": "Optional short title",
  "body": "One to two sentences. **Markdown** works.",
  "advanceOn": null,
  "notes": "Author-only. Users never see this."
}
```

Rules:

- **`target` must be `[data-tour="..."]`.** The SDK rejects everything else at build time. If the element doesn't have a `data-tour` attribute yet, either add it (if you can) or ask the product engineer. Use `TODO_MISSING_SELECTOR` as a placeholder — CI will fail on it and force the conversation.
- **`body` is short.** One to two sentences. If you need more, split the step.
- **`title` is optional but usually helpful.** Verb-first when it's a step ("Create your first project"), descriptive when it's context ("Projects live here").
- **`placement`** picks which side of the target the tooltip appears. `top`, `bottom`, `left`, `right`, or `center` (center overlays the middle of the screen — good for welcome/completion steps).
- **`advanceOn`** makes the step advance automatically on a user action. Prefer this over Next buttons when the user should be _doing_ the thing, not just reading about it.

### 4. Advance-on: let the user drive

For "click this button" or "fill in this field" steps, use `advanceOn` so the tour follows the user's real action, not a Next button:

```json
{
  "id": "click-new-workflow",
  "target": "[data-tour=\"workflows-new-button\"]",
  "placement": "bottom",
  "body": "Click **New workflow** to get started.",
  "advanceOn": { "type": "click", "target": "[data-tour=\"workflows-new-button\"]" }
}
```

Supported types:

- `{ "type": "click", "target": "[data-tour=\"...\"]" }` — user clicks the element.
- `{ "type": "input", "target": "[data-tour=\"...\"]" }` — user types something.
- `{ "type": "url", "pattern": "/workflows/*" }` — the URL matches.
- `{ "type": "event", "name": "workflow_created" }` — an analytics event fires.

If none of those apply, use `"advanceOn": null` — the Next button is shown.

### 5. Validate

```bash
npm run validate:content
npm run validate:selectors
```

Fix any errors before opening a PR. Common ones:

- `steps.2.target: Selector must be [data-tour="kebab-case-id"]` — you used a CSS selector or wrong format.
- `steps.4.body: String must contain at least 1 character(s)` — empty body.
- `Selector "workflows-new-button" not found in host codebase` — the `data-tour` attribute doesn't exist yet. Talk to the product engineer.

### 6. Preview

```bash
npm run dev
```

Opens the demo at `http://localhost:5173`. Use "Start onboarding tour" in the corner controls to preview. For a new tour, temporarily add its ID to `demo/main.ts` — or wire it up in the AI Platform QA env for the real thing.

### 7. Test in QA

Preview in the demo is not enough. Real test:

- Deploy the tour to AI Platform QA.
- Walk through as a real user. Note anything awkward.
- Ask one other person to walk through. Watch them. Don't help. Note where they hesitate or misread.
- Rewrite anything that didn't land. Budget on this: expect ~30% of copy to change after the first watch.

### 8. Open a PR

- Title: `content: add <tour-id> tour`
- In the description, include: the target user, the difficulty, and a link to a screencast (or animated gif) of you walking through it.
- Reviewer: SDK engineer.

## Style guide for tour copy

- **Second person.** "You'll see a canvas" not "The user will see."
- **Short.** Two sentences max per step.
- **Concrete verbs.** "Click Run" not "Initiate execution."
- **No filler.** Cut "great," "awesome," "let's," "now."
- **One idea per step.** If the step teaches two things, split it.
- **Body first.** The user reads the body. Titles are scannable orientation.
- **Explicit next action when the user needs to do something.** "Click **New workflow**" — bold the interactable text.

## Common pitfalls

- **Too many steps.** More than 8 = boring. Split.
- **Targeting elements that render lazily.** If the target appears only after a click or route change, and you don't set `advanceOn` to expect that, the tour will die. Wait-for-element helps (Sprint 04) but the better fix is usually to redesign the tour to follow the user's flow.
- **Assuming the user reads titles.** They don't. Read only the body and assume that's all they see.
- **Reusing `data-tour` IDs.** Never. They're effectively public API of the host product.
- **Writing a "quick reference" tour.** That's not a tour, it's a doc. Point to docs instead.

## When something breaks in production

If a tour is failing (`tour_error` events spike, users complain, screencast shows a broken step):

1. Check the analytics event — which step? What error reason?
2. If `target-not-found`: the `data-tour` attribute has been removed or renamed. Check the host codebase. Restore or update the tour.
3. If `timeout`: the target renders too slowly. Either extend the timeout, or restructure the tour so the target is already present before the step.
4. Roll back to the previous SDK version if the issue is widespread — see `releases/rollback-runbook.md`.
