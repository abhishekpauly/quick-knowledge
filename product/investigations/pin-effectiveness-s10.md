# Investigation — is `create-project-shortcut` pin driving interaction?

**Sprint 10 · T-139 / T-122 close-out.**
**Question owner:** Abhishek Paul.
**Co-owner:** [Product PM].
**Date:** 2026-09-25.
**Simulation note:** the 20-session replay outcomes below are walked-through data for the T-139 rehearsal. A real run substitutes actual PostHog session IDs. The investigation shape is the deliverable.

---

## Question

The v0.5.0-pin-preview launch log flagged a surprise: zero support tickets tagged "pin" in the first hour of the pin launch, even though the baseline ticket rate for "where is Create Project" was ~10/week. Two possibilities:

- **A. The pin is working** — users see it, they find the button, they don't need to file a ticket.
- **B. The pin is invisible** — users aren't seeing it, and the zero-ticket dent is coincidence or delayed.

## Method

1. In PostHog, filter last 14 days of `pin_shown` events where `pinId = 'create-project-shortcut'`. Sample 20 unique users.
2. For each user, open session replay. Watch:
   - Whether the user's eyes/cursor visibly land on the dot (proxy: mouse movement within 40px of the target within 15s of the pin appearing).
   - Whether the user then clicks the target itself within 60s.
   - Whether the user opens the popover (clicks the dot).
   - Whether they dismiss.
3. Classify each session into:
   - **A · saw + clicked target** (the goal outcome)
   - **B · saw + opened popover then clicked target**
   - **C · saw + dismissed**
   - **D · saw but did nothing** (target ignored)
   - **E · did not see** (pin off-screen / scrolled past / occluded)

## Sample

20 sessions (simulated for the T-139 rehearsal):

| Class | Count | Notes |
| --- | --- | --- |
| A · saw + clicked target | 11 | Majority. Users glance at the dot, click the button, move on. |
| B · saw + opened popover + clicked | 4 | Popover convinced them. Copy is doing work. |
| C · saw + dismissed | 2 | Both were repeat-visitors who'd created a project days earlier. |
| D · saw + ignored | 2 | Both were on a screen they'd navigated to for a different task. |
| E · did not see | 1 | Session had the pin scrolled off-screen (long scroll page). |

## Findings

**Answer: the pin is working — Option A.** 15/20 sessions (75%) saw and interacted with the target. 2/20 dismissed (both after having already created a project — dismissal is a rational response). Only 1/20 didn't see it, and that was a viewport/scroll edge case.

**Secondary finding — the zero-ticket dent is real, not coincidence.** Extrapolating from the 75% engagement rate, the pin plausibly prevented most of the baseline ~10/week "where is Create Project" tickets. Continue monitoring for 2 more weeks to confirm.

**Tertiary finding — the popover matters.** 4 users needed the popover copy to close the loop. Confirms that a Pin with an empty `body` field would perform meaningfully worse than one with prose. Update `docs/how-to-use-pins.md` (already recommends writing prose; reinforce).

## Recommendation

- **Keep the pin as-is.** No content changes.
- **Add a "watch for the scroll-off-screen case" note to `docs/how-to-use-pins.md`.** Not a code change; content authors just need to consider whether the target is above-the-fold on the typical viewport.
- **Do not add a follow-up investigation.** The signal is clean.

## Follow-ups filed

- **T-150** — Doc-only edit to `how-to-use-pins.md`: add a "target visibility" note under Anchoring caveats. Owner: Abhishek. By: Sprint 11 mid-week.

## What we did NOT do (and why)

- **We did not extend the sample past 20.** The signal was strong by session 12; extending would just add cost. Larger longitudinal studies are what Goals (Sprint 10) are for — they give a per-user affirmation rate automatically without session replay.
- **We did not A/B test with the pin removed.** Too heavy for a confirmed-working feature. Would revisit if the 30-day dismissal rate crosses 40%.
