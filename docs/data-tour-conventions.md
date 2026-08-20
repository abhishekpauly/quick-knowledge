# `data-tour` naming conventions

## The rule

Every element that any tour targets has a `data-tour="..."` attribute with a stable, unique ID. The SDK only accepts selectors of the form `[data-tour="..."]`.

## Naming format

```
<area>-<component>-<intent>
```

- All lowercase, kebab-case.
- No spaces, no camelCase, no underscores.
- Must be globally unique within a product.

### Examples

| ID | Element |
| --- | --- |
| `sidebar-projects-link` | The "Projects" nav item in the sidebar |
| `workflows-canvas-add-node-button` | The "+" button on the workflow canvas |
| `workflows-canvas-run-button` | The "Run" button on the workflow canvas |
| `settings-billing-plan-select` | The plan dropdown in Settings → Billing |
| `header-user-menu-trigger` | The avatar in the top-right header |
| `models-list-filter-input` | The filter box in the models list |

## Rules

1. **Never reuse an ID for a different element.** These IDs are effectively public API of the host product.
2. **Never rename an ID silently.** Grep the SDK's `content/` directory for references first. If any tour targets it, coordinate a rename across both repos.
3. **Never remove an ID without checking references.** Same reason.
4. **Add IDs proactively for major action buttons and nav items** even before a tour needs them. It's cheap, and it makes future tours faster to author.
5. **Do NOT add IDs to elements that don't need them.** Not every button gets one. Only elements a tour will point at.

## For SDK content authors

- If the element you need to target doesn't have a `data-tour` attribute yet, don't invent a CSS selector. Open a PR (or ping the product engineer) to add the attribute. Meanwhile, use the placeholder `TODO_MISSING_SELECTOR` in the tour JSON — the CI validator will fail on it and force the conversation.

## For product engineers

When you're refactoring:
- Renaming an element? Keep its `data-tour` ID.
- Deleting an element that has a `data-tour` ID? Grep the SDK's `content/` directory for that ID. If nothing references it, remove it. If something does, coordinate.
- Splitting an element in two? Decide which "half" inherits the ID; give the other half a new one.

## CI enforcement

`scripts/validate-selectors.ts` runs on every PR to both the SDK repo and the host product repo:

```
$ npm run validate:selectors

Checked 47 selectors referenced across 8 tours.
✓ 47 selectors found in host codebase
✗ 0 missing

OK
```

A missing selector fails the build. In the host product repo, this catches removed IDs before they hit staging. In the SDK repo, it catches typos in newly-authored tour content.
