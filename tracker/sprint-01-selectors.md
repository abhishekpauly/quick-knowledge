# Sprint 01 · Proposed `data-tour` selectors for AI Platform

Before day 1 code, propose the selectors we'll need for the onboarding tour and the first workflow tour. This lets us batch a single PR against the AI Platform frontend rather than N PRs of one attribute each.

Each entry lists the ID, the element description, and (best guess) which component owns it. Verify against the actual codebase on day 1 — you may need to adjust names or split IDs.

## For the onboarding tour

| ID | Element | Likely component |
| --- | --- | --- |
| `app-root` | The outermost app container. Used for center-placement steps. | `<App>` root div |
| `sidebar-projects-link` | The "Projects" nav item in the left sidebar. | `<SidebarNav>` |
| `sidebar-workflows-link` | The "Workflows" nav item in the left sidebar. | `<SidebarNav>` |
| `main-workspace` | The main content area (right of sidebar, below header). | `<MainLayout>` |
| `create-project-button` | The primary CTA to create a new project. | `<ProjectList>` or `<ProjectsPage>` |
| `header-user-menu-trigger` | The user avatar in the top-right, opens the account menu. | `<AppHeader>` |

## For the "create your first workflow" tour

| ID | Element | Likely component |
| --- | --- | --- |
| `workflows-new-button` | The "+ New workflow" primary CTA on the workflows page. | `<WorkflowsPage>` |
| `workflows-canvas-add-node-button` | The "+" button on the workflow canvas that adds a node. | `<WorkflowCanvas>` |
| `workflows-canvas-run-button` | The "Run" button on the workflow canvas. | `<WorkflowCanvas>` header |

## PR checklist for the AI Platform frontend

Open a single PR titled: `chore: add data-tour attributes for training SDK`.

- [ ] Add `data-tour="app-root"` to the top-level app container.
- [ ] Add `data-tour="sidebar-projects-link"` to the Projects nav item.
- [ ] Add `data-tour="sidebar-workflows-link"` to the Workflows nav item.
- [ ] Add `data-tour="main-workspace"` to the main content container.
- [ ] Add `data-tour="create-project-button"` to the new-project CTA.
- [ ] Add `data-tour="header-user-menu-trigger"` to the avatar button.
- [ ] Add `data-tour="workflows-new-button"` to the workflows page primary CTA.
- [ ] Add `data-tour="workflows-canvas-add-node-button"` to the canvas add-node button.
- [ ] Add `data-tour="workflows-canvas-run-button"` to the canvas run button.

PR description should include:
- Why: enabling the in-app training SDK. Zero behavior change.
- Reviewer instruction: "One-line-per-file attribute additions. No logic changes. Safe to fast-track."
- Link back to `docs/data-tour-conventions.md`.

## Verification after merge

Run in the SDK repo:

```bash
npm run validate:selectors -- --content ./content --host ../ai-platform-frontend/src
```

All 9 IDs should be found. If any are missing, coordinate the addition before starting Sprint 02 (which depends on stable selectors).

## What if the elements don't exist yet?

Some workflow tour targets (e.g., `workflows-canvas-add-node-button`) only exist inside a rendered workflow canvas. That's fine — the runtime `data-tour` attribute goes on the element wherever it lives in the JSX. It doesn't have to be present at page load.

If the workflow canvas isn't built yet in AI Platform, drop that tour from Sprint 01 scope and pick a different basic workflow that's already implemented. Adjust `content/ai-platform/workflows-create-project.tour.json` accordingly.

## Naming convention reminder

`<area>-<component>-<intent>` — kebab-case, unique. See `docs/data-tour-conventions.md`.
