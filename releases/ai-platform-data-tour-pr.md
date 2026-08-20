# PR description template — data-tour attributes for AI Platform frontend

Paste-ready. Fill the bracketed sections and open the PR against the AI Platform frontend repo.

---

## Title

`chore: add data-tour attributes for in-app training SDK`

## Description

### Why

Enabling the in-house in-app training SDK (`@uptiq/training-sdk`). This PR adds `data-tour="..."` HTML attributes to 9 elements the initial onboarding and workflow tours will point at. **Zero behavior change** — attributes only.

### What changes

Adds a `data-tour` attribute to each of the following elements. See [tracker/sprint-01-selectors.md](https://github.com/abhishekpauly/quick-knowledge/blob/main/tracker/sprint-01-selectors.md) for the canonical list and reasoning.

| ID | File / Component | Element |
| --- | --- | --- |
| `app-root` | `[TBD]` | Top-level app container. Used for center-placement steps. |
| `sidebar-projects-link` | `[TBD]` | The "Projects" nav item in the sidebar. |
| `sidebar-workflows-link` | `[TBD]` | The "Workflows" nav item in the sidebar. |
| `main-workspace` | `[TBD]` | The main content area. |
| `create-project-button` | `[TBD]` | The primary CTA to create a new project. |
| `header-user-menu-trigger` | `[TBD]` | The avatar in the top-right header. |
| `workflows-new-button` | `[TBD]` | The "+ New workflow" primary CTA. |
| `workflows-canvas-add-node-button` | `[TBD]` | The "+" button on the workflow canvas. |
| `workflows-canvas-run-button` | `[TBD]` | The "Run" button on the workflow canvas. |

### How to review

- Each change is a one-line-per-file attribute addition.
- No logic changes. No prop changes. No CSS changes.
- Safe to fast-track.

### Contract this creates

Once merged, these `data-tour` IDs are **effectively public API** of the AI Platform frontend. Downstream tour content depends on them. Don't rename or remove without checking the training SDK's `content/` folder for references (`grep -r "workflows-canvas-add-node-button" ../in-app-training-sdk/content/`). The training SDK will add a CI check that fails builds on missing references — this catches accidents before they hit staging.

### Naming convention

`<area>-<component>-<intent>` — kebab-case, unique across the app. See [docs/data-tour-conventions.md](https://github.com/abhishekpauly/quick-knowledge/blob/main/docs/data-tour-conventions.md).

### Post-merge

After this PR lands and is deployed to staging, the training SDK team will:

1. Run `npm run validate:selectors -- --host <path-to-this-repo>/src` from the training SDK repo to confirm every ID is found.
2. Deploy the SDK to the same environment.
3. Trigger the onboarding tour manually to smoke-test placement.

### Rollback

If any attribute causes a regression (extremely unlikely — they're plain HTML attributes), the fix is a one-line revert per affected element. No SDK-side coordination needed for rollback.

### Links

- Training SDK repo (public working copy): https://github.com/abhishekpauly/quick-knowledge `[replace with UPTIQ internal repo URL when it exists]`
- Content the SDK will use: `[TBD — link to @uptiq/ai-platform-training-content once created]`
- Naming convention docs: [docs/data-tour-conventions.md](https://github.com/abhishekpauly/quick-knowledge/blob/main/docs/data-tour-conventions.md)
- ADR-0002 (why this contract exists): [docs/adrs/ADR-0002-data-tour-contract.md](https://github.com/abhishekpauly/quick-knowledge/blob/main/docs/adrs/ADR-0002-data-tour-contract.md)

### Reviewer requested

- One senior frontend engineer for fast-track approval.
- Curriculum author (informational — so they know when it merges).

/cc `[whoever owns the frontend — fill before opening PR]` **@abhishekpauly** (curriculum author)
