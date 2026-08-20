# FEAT-007: CSS-variable theming

- **Status:** Backlog
- **Priority:** P1
- **Sprint:** SPR-02
- **Owner:** Solo build
- **Depends on:** FEAT-001
- **Related ADRs:** ADR-0004

## Problem

Tooltips must match the host product's brand. Multiple products means multiple themes without forking styles.

## Solution sketch

Define a documented set of CSS variables (`--uptiq-training-*`) that the SDK reads. Ship default values that look neutral. Product wires a theme object (which sets these variables at the provider root) at wire-up.

## MVP scope

- Variables: primary, background, foreground, border, radius, shadow, font-family, font-size.
- Default theme (neutral).
- One AI Platform theme.
- Theme applied via provider — no global bleed.

## Acceptance criteria

- [ ] Tooltip visual matches AI Platform brand without engine changes.
- [ ] Swapping to the default theme changes the look immediately.
- [ ] No CSS bleed into host product styles.

## Risks

- Shepherd.js base styles fight our overrides. Mitigation: use higher specificity or CSS layers.
