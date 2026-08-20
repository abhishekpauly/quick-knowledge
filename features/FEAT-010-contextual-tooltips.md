# FEAT-010: Contextual `?` tooltips

- **Status:** Backlog
- **Priority:** P2
- **Sprint:** SPR-04
- **Owner:** Solo build
- **Depends on:** FEAT-001, FEAT-004

## Problem

Not every training moment is a full tour. Sometimes a user just needs "what does this field do?" — a hover tooltip on a `?` icon next to a form field.

## Solution sketch

Small React component `<TrainingHint contentId="workflows-canvas-node-name-hint">?</TrainingHint>`. Hint content lives in the same content system as tours (new file type: `content/<product>/hints.json`).

## MVP scope

- `<TrainingHint>` component in the React adapter.
- Content-loader support for `hints.json` files.
- Hover to show, click to pin.
- Themed like tooltips.

## Acceptance criteria

- [ ] Placing `<TrainingHint>` renders a `?` icon.
- [ ] Hovering shows the hint text.
- [ ] Clicking pins it open until dismissed.
- [ ] Hint content is authorable in JSON alongside tours.

## Risks

- Feature creep — hints become mini-docs. Mitigation: enforce a short character limit and link out for anything longer.
