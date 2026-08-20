# FEAT-009: Checklist widget

- **Status:** Backlog
- **Priority:** P1
- **Sprint:** SPR-04
- **Owner:** Solo build
- **Depends on:** FEAT-001, FEAT-002, FEAT-004

## Problem

Users need to see what tours are available, which they've completed, and what to try next. A persistent corner widget solves this and is a well-known UX pattern.

## Solution sketch

React component in the adapter package. Reads content + progress. Renders a collapsed pill that expands to a list, grouped by difficulty. Clicking an item starts the tour.

## MVP scope

- Collapsed pill in bottom-right (configurable).
- Expanded list grouped by difficulty (onboarding / basic / intermediate / advanced / common tasks).
- Completion checkmarks.
- Locked items (prerequisites unmet) shown greyed out.
- Fully themeable.

## Acceptance criteria

- [ ] Widget shows all tours for the current product.
- [ ] Completed tours show a checkmark.
- [ ] Locked tours are visually distinct and can't be clicked.
- [ ] Clicking an unlocked tour starts it.
- [ ] Widget dismissible; state remembered per user.

## Risks

- Bottom-right corner conflicts with other in-app widgets (support chat, feedback). Mitigation: configurable position.
