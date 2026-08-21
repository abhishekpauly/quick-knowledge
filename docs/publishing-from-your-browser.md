# Publishing content from your browser

**Sprint 20 · T-292.** Written for PMs after Adopter B's PM shipped a pin change directly without touching a redeploy pipeline.

You do not need to open a text editor or wait on engineering to change the copy of a tour step, add a pin, or fix a typo. If your product is on the API path (Reports, Adopter B — check with your integration lead), you can publish in two minutes.

## What you can change

- **Tour step title, body, or button label.** Copy edits.
- **Pin title, body, or `learnMoreUrl`.** Point at a different KB article; reword the pin.
- **Pin visibility windows** (`showUntil`).
- **Add or remove a pin** — the JSON envelope is documented in [`docs/how-to-use-pins.md`](how-to-use-pins.md).
- **Change a goal's `windowMinutes`** (see the goal-window fix Adopter A shipped in Sprint 14 T-210).

## What you should NOT change without an engineer

- **`data-tour` selectors** on steps or pins. Those are wired to the frontend; changing one without the matching frontend change silently breaks the step.
- **`schemaVersion`**. If you think you need to bump it, that is a conversation with engineering, not a browser edit.
- **`triggers` type or shape** (`first-run` / `url` / `event`). Changing a trigger changes when the tour fires — safer to ask.

## How to publish (two minutes)

1. Open the content editor in your admin console (`/admin/training`; ask your integration lead for the exact URL).
2. Pick the bundle you want to change (product name in the top-left).
3. Edit the JSON in the right-hand panel. The editor validates as you type — a red underline means you have a syntax error or a missing field.
4. Click **Save & publish**. The editor calls `POST /training/v1/content/<product>` under the hood.
5. Wait up to five minutes. Every browser refreshes its content bundle on that cadence; users see your change without a page reload.

If you want the change live immediately (a critical typo, a broken pin), your integration lead can trigger a manual refresh by calling `source.refreshNow()` from a browser console — not something you need to know how to do, but useful to know it exists.

## What if something breaks

- **Retool dashboard panel 5** (`content bundle errors`) shows any validation failures within a minute. If your change causes a spike there, the Slack alert (`#sdk-alerts`) will ping automatically.
- **Every bundle is versioned.** If your change looks wrong to a user, the previous bundle is still in `GET /training/v1/content/<product>/history` — engineering can roll back in one API call.
- **You cannot delete a user's data through this editor.** GDPR delete goes through a separate scope (`users:forget`), not `content:write`.

## Who has publish access

Any account with a `content:write` token from your auth service. In practice, the PM for each product plus one or two other named editors. Ask your integration lead to grant access.

Read access (view what's live, browse history) is separate — anyone with `content:read` can view without publishing.

## What the SDK team sees

Every publish is logged with the bearer-token subject (the person who published) and a timestamp on the server side. You can audit your own history in the editor; the SDK team sees the aggregate in the cross-product dashboard.
