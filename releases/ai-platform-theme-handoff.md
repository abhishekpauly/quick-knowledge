# Design hand-off — AI Platform theme tokens

**Task:** T-063 (Sprint 07). Replace the placeholder values in `aiPlatformTheme` (see `packages/core/src/theme/default.ts`) with real AI Platform brand tokens before staging deploy.

**Owner:** Curriculum author (Abhishek Paul), with design.
**When:** Any time in Sprint 07; must land before T-065 staging deploy.
**Effort:** ~1 hour once design provides values.

## What the SDK needs from design

Exactly these tokens. Every one is a CSS-writable string (color, length, or CSS shorthand). Defaults exist, so if a token is not provided we fall back to the neutral placeholder — but every field below should be filled with the real brand value before we ship.

| Token | Type | Example | Notes |
| --- | --- | --- | --- |
| `primary` | color | `#2563eb` | Primary action colour. Used on the "Next" / "Done" buttons and the progress dot. Must have ≥ 4.5:1 contrast against `background` for AA. |
| `background` | color | `#ffffff` | Tooltip and checklist background. Should be the "surface" / "card" colour in the design system. |
| `foreground` | color | `#111827` | Tooltip body text. Must have ≥ 4.5:1 contrast against `background`. |
| `border` | color | `#e5e7eb` | 1px tooltip border. Should match the design system's subtle-divider colour. |
| `radius` | length | `8px` | Tooltip corner radius. Match the design system's card/tooltip radius. |
| `shadow` | box-shadow | `0 10px 25px rgba(0,0,0,0.1)` | Elevation. If the design system has a named token like `shadow-md`, use its exact value. |
| `fontFamily` | font-family | `"Inter", system-ui, sans-serif` | Should exactly match AI Platform's body font stack. |
| `fontSize` | length | `14px` | Body text size. Not a heading size — tooltips are small. |

## What we do NOT need (but design might ask)

- **Dark mode.** Not v0.1. Tooltip will honour whatever colours are passed; if AI Platform switches themes at runtime, the host product re-calls `applyTheme(darkTheme)` and it works. We just need one theme to launch.
- **Hover / focus states for buttons.** Handled by Shepherd's default component CSS; not currently token-driven. If design has strong opinions here, file a v0.2 ticket.
- **Motion / easing tokens.** Same — v0.2 territory.
- **A separate checklist theme.** The checklist uses the same tokens as the tooltip.

## How the tokens land in the product

They become CSS custom properties on the host root element: `--uptiq-training-primary`, `--uptiq-training-background`, etc. Written by `applyTheme()` in `packages/core/src/theme/default.ts`. Any component that wants to use them just reads `var(--uptiq-training-primary)`.

## Where the values go

Edit the `aiPlatformTheme` object in `packages/core/src/theme/default.ts`. Then verify:

```bash
cd packages/core && npm test
```

## Accessibility checklist (do NOT skip)

Before merging:

- [ ] `foreground` on `background`: contrast ≥ 4.5:1 (WebAIM contrast checker).
- [ ] "Next" button label on `primary`: contrast ≥ 4.5:1.
- [ ] `border` visible against `background` (contrast ≥ 3:1) — otherwise the tooltip disappears on scroll shadows.
- [ ] Test with browser zoom at 200% — nothing clips.
- [ ] Test with `prefers-reduced-motion: reduce` — no motion regressions (Shepherd honours this by default).

## Sample response format for design

Design can reply inline with:

```
primary:      #<hex>
background:   #<hex>
foreground:   #<hex>
border:       #<hex>
radius:       <Npx>
shadow:       <full CSS box-shadow value>
fontFamily:   <full CSS font-family stack>
fontSize:     <Npx>
```

Paste that into a reply and the change is a 60-second edit.
