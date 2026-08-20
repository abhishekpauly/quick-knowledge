# Sprint 05 · Days 22–26 · v0.2 kickoff — targeting + polish

**Goal:** Ship the foundational schema + engine additions that unlock the rest of v0.2 and v0.5. Everything here is small; the value is in the aggregate.

**Definition of done:**
- Property-based audience targeting: tour has `audience`, trainer takes `userAttributes`, filter works end-to-end.
- Localization: user-facing fields accept `string | { [locale]: string }`. Backward compatible with all Sprint 4 content.
- Personalization: `{{user.firstName}}` interpolates from `userAttributes` in title/body/description.
- Image/GIF rendering: step `media` field renders inline in tooltip.
- Checklist: pill shows reactive `completed/total` count; widget auto-hides while a tour is active.
- All tests green. `npm run validate:content` still passes on existing tours.

**Not this sprint:** frequency limits, flow priority, permalinks, slideout, hotspot, redirect (Sprint 6).

---

## Task list

See `backlog.md` T-040 through T-047.

| ID | Task | Est | Feature |
| --- | --- | --- | --- |
| T-040 | Property-based audience targeting | 3d | v0.2 (net-new) |
| T-041 | Localization (schema-additive; string or `{locale: string}`) | 3d | v0.2 (net-new) |
| T-042 | Personalization templating `{{user.firstName}}` | 2d | v0.2 (Appcues-pass addition) |
| T-043 | Image/GIF rendering in step body | 1d | v0.2 (Appcues-pass addition) |
| T-044 | Auto-suppress checklist under active tour | 0.25d | v0.2 (Appcues-pass addition) |
| T-045 | Reactive checklist pill count (`useAllTourProgress`) | 0.5d | v0.2 (Appcues-pass addition) |
| T-046 | Tests for all of the above | 1.5d | — |
| T-047 | Docs + CHANGELOG + roadmap tick-off | 0.5d | — |

Total ~12 days serial → fits ~5 days with AI-assisted parallel work on the small items.

## Sequencing

- **Day 22:** T-040 (property targeting) — foundational. Everything else can be independent.
- **Day 23:** T-041 (localization) — schema change, best done before content sprawls. Parallel-safe with T-042/T-043 since they're separate files.
- **Day 24:** T-042 + T-043 (personalization + media).
- **Day 25:** T-044 + T-045 (checklist polish).
- **Day 26:** T-046 + T-047 (tests, docs, wrap).

## Success signals

- A tour with `audience: ["plan:enterprise"]` correctly appears for enterprise users only and hides from free users.
- A tour with `title: { en: "Welcome", es: "Bienvenido" }` shows the right string when `locale: "es"` is set.
- A tour with `title: "Hi {{user.firstName}}"` shows the user's real name.
- A tour with `media: { type: "image", src: "...", alt: "..." }` renders the image inside the tooltip.
- Checklist pill shows `3/5` and updates as tours complete.
- Checklist hides mid-tour and reappears after.

## Risks

- **Backward compatibility of localization schema.** Mitigation: keep plain strings valid alongside localized objects. Tests confirm every existing tour still validates.
- **Personalization XSS.** Mitigation: HTML-escape all interpolated values. Never trust user attributes as raw HTML.
- **Reactive checklist count via multiple useTourProgress calls.** Rules-of-hooks issue if tour list changes. Mitigation: use a single `useAllTourProgress` hook that subscribes at the widget level, not per-item.
- **Image rendering interacts with Shepherd internal DOM.** Mitigation: prepend as raw HTML in `text` field with a `training-media` class; render conservatively.

## Retro questions

- Which of these features got real use in the demo? Anything nobody touched?
- Did localization schema feel natural or awkward? Any signals for what schema v2 should look like?
- Personalization is a tiny feature that PMs will ask about a lot. Was it worth doing early?
