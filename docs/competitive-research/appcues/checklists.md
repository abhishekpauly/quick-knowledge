# Appcues — Checklists

Source: https://docs.appcues.com/checklists/what-are-checklists · Fetched 2026-08-20

## Definition

Persistent self-serve task lists that appear as a floating beacon in the app. Users engage at their own pace; progress updates in real-time as items complete.

## Three-component structure

- **Beacon** — floating button, bottom-left or bottom-right, displays remaining item count. Can auto-expand on first visit or stay collapsed.
- **Item list** — opens when user clicks the beacon. Sequential or free-form completion.
- **Congratulations screen** — customizable message, image, success color on full completion.

## Item types

- Launch a Flow.
- Navigate to a page.

## Completion detection

- Event fired.
- User property matches.
- User clicks something (delegated).

## Persistence

- Tracked per user ID.
- Each user has independent progress.
- **Account-wide completion** available via special configuration — any team member's action ticks the item for everyone on that account.
- State persists across app navigation.

## Positioning

- Bottom-left or bottom-right ONLY.

## Visibility rules

- Auto-suppressed when a Modal or Slideout is showing. Beacon disappears then reappears to prevent attention competition.

## Use cases

- New-user onboarding.
- Feature adoption.
- Re-engagement campaigns.
- Account setup workflows.

## Comparison against our SDK (v0.1.0-mvp)

- ✓ `<TrainingChecklist>` covers the core: floating beacon, expandable panel, item list from tours, per-difficulty grouping, per-user completion via localStorage.
- Congratulations screen: ○ — new backlog candidate. Small, easy to add. Fires when all items complete.
- Item types beyond "launch a tour": ◐ — we support tour-launch and passively handle nav-then-completion via prerequisites. Explicit "navigate to page" item type would surface as a new content type; new backlog candidate.
- Auto-completion via event / property / click: ◐ — we complete when the linked tour completes. External event-based item completion (e.g. "invite a teammate" ticks off when the API fires) is a new backlog candidate.
- Positioning options: ✓ — all four corners (better than Appcues' two).
- Account-wide completion (team member ticks it for everyone): ○ — depends on persistence backend. Requires backend sync (v0.5+). Real interest signal from AI Platform's enterprise story.
- Auto-suppression during modal/slideout: ○ — new backlog candidate. Simple check: if `trainer.getActiveTourId()` is set, hide the pill.
- Sequential vs free-form ordering: ◐ — we display in order but don't enforce sequentiality. Simple prop to add.
