# Appcues — Banners

Source: https://docs.appcues.com/banners/what-are-banners · Fetched 2026-08-20

## Definition

Persistent full-width messages attached to the top of the user's screen. Non-intrusive announcements.

## Placement

- Top of page on matching URLs.
- Display modes: **inline** (pushes page content down) or **overlay** (floats above).
- Sticky option to keep visible while scrolling.
- Slide-in animation.

## Content

- Text (no hard character limit).
- Emoji support (via system keyboard).
- Embedded buttons + links to URLs or trigger-flow actions.
- Localization via manual, file upload, or AI auto-translate.

## Dismissibility

- Once dismissed, "stays dismissed permanently for that user" — no re-appearance.

## Use cases

- Maintenance / outage announcements.
- Feature promotions + limited-time offers.
- Targeted CTAs.
- Segmentation-driven messages (trial users, plan tiers).

## Lifecycle

- Visible until dismissed / unpublished / scheduled end time.
- Scheduling with auto publish + auto unpublish.

## Comparison against our SDK (v0.1.0-mvp)

- ○ No equivalent today. Planned for v0.5.
- Straightforward to build — new content type `banner` in the schema + a simple React component. Estimated ~1 sprint.
- Inline vs overlay: probably start with inline (pushes page content down) since overlay requires z-index games with the host's own fixed elements. Add overlay in a follow-up.
- Sticky: easy — CSS `position: sticky` on the banner container.
- Permanent dismissal per user: uses our existing persistence adapter. Trivial.
- Scheduling: overlaps with existing "trigger" support; extend to include start/end datetimes.
- Localization: comes for free from v0.2 schema v2.
- Top-only or top+bottom: worth clarifying in PRD. Appcues is top-only; Pendo/Userpilot support both. Small extension.
