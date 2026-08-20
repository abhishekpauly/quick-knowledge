# 5-user usability test protocol

Nielsen: five users catch ~85% of usability issues. We're not running formal HCI research; we're catching the obvious pre-launch. This protocol is designed to fit in one afternoon per round and produce a concrete rewrite list by the end of it.

## Goals

- Find copy that doesn't land.
- Find steps users skip past without reading.
- Find targets that aren't obvious.
- Find missing steps (users get stuck between step N and N+1).
- Find surprising tour behavior (tooltip in the wrong spot, tour re-triggers when it shouldn't).

Non-goals: aesthetic preferences, feature requests, deep discussion of the product itself.

## Recruit

Five users. Diverse across:
- Two who have never used the AI Platform.
- Two who have used it briefly (few days).
- One power user.

If we're pre-launch and the product isn't public, internal folks from other teams count — anyone who hasn't seen the platform's onboarding before.

DO NOT recruit anyone who worked on the tour content or the SDK. They can't unsee it.

Compensation: gift card or coffee. Even internal, respect the time.

## Setup per session

- 30 minutes calendar hold.
- Zoom / Meet with screen share and recording enabled (with consent).
- Fresh browser profile (no localStorage, no cookies).
- Staging environment link ready to paste.
- Note-taking doc open in a second tab.

## Script

Read verbatim to keep the sessions comparable.

> **Intro (2 min):**
> "Thanks for helping. I'm going to give you access to a new product called AI Platform. I want to see how you get started with it. I'll ask you to think out loud — say what you're seeing, what you're expecting to happen, what confuses you. There's no wrong answer, and none of this is a test of you — it's a test of the product. I'll be quiet mostly; if I'm silent, keep going. If you get stuck, that's the most useful thing that can happen. If you have questions, save them for the end. OK?"
>
> "One more thing: there's going to be a walkthrough. Treat it like you'd treat any product walkthrough you encountered in real life — read it, skip it, ignore it, whatever feels natural. Ready?"

Paste the staging URL. Screen-share on. Recording on. Stopwatch on.

**Task 1 — Onboarding tour (5–7 min):**
> "You've just signed up. Get yourself oriented."

Watch. Take notes. Don't help. Don't answer questions during the task — write them down for the end.

**Task 2 — Create a workflow (5–7 min):**
> "Now try to create a workflow."

If they discover the checklist widget on their own, note that. If they don't, that's a signal.

**Task 3 — Free exploration (3 min):**
> "Poke around. Try to break it or find something interesting."

Not a test of the tours specifically, but reveals whether the trainings made them feel oriented.

**Debrief (5 min):**
- "What was clearest?"
- "What was most confusing?"
- "Did you notice the tour / walkthrough? What did you think of it?"
- "Would you have preferred no walkthrough?"
- "Anything you expected to see and didn't?"

## Note template

Copy for each session:

```
User: [initials + role, e.g. "MK, marketing"]
Familiarity: [none / brief / power]
Date:

Task 1 — Onboarding
  Time to complete: ___
  Skipped tour? Y/N (and when)
  Steps read carefully: [list]
  Steps skipped past: [list]
  Points of confusion (verbatim):
    - "..."
    - "..."
  Points of delight:
    - "..."

Task 2 — Create a workflow
  Time to complete: ___
  Discovered checklist widget? Y/N (when: __)
  Started the workflow tour? Y/N (via: __)
  Steps read: [list]
  Steps skipped: [list]
  Got stuck at: [step id / description]
  Confusion (verbatim):
    - "..."

Task 3 — Free exploration
  Notable moments:
    - ...

Debrief:
  Clearest thing: ___
  Most confusing: ___
  Tour reaction: ___
  Expected but missing: ___

Bugs observed: [list]
```

## Analysis

After all 5 sessions:

1. Count how many users hit each confusion point. 3+ = fix. 2 = evaluate. 1 = maybe.
2. List every verbatim confusion under the step it happened at.
3. Compute skip rate per step. High skip on a "critical" step = the copy or placement is wrong.
4. Time-to-complete vs. `estimatedMinutes`. > 1.5× = update the estimate or split the tour.

## Decision rubric (what changes vs. what ships)

**Change before shipping:**
- Any step 3+ users misread the same way.
- Any step 2+ users got stuck at with no clear path forward.
- Any bug reproducing in > 1 browser.
- Any tour where completion rate would clearly be < 60% based on what you saw.

**File for v0.2:**
- Cosmetic issues.
- Single-user confusions on non-critical steps.
- Feature requests ("I wish this tour also covered X").
- Preferences ("I prefer no auto-start").

**Ignore:**
- Product complaints unrelated to the tour.
- Aesthetic opinions with no correctness signal.

## Timeboxing

- Sessions: 5 × 30 min = 2.5 hours.
- Analysis: 1 hour.
- Content rewrite: 3 hours.
- Total: ~7 hours. Fits in a day.

Do NOT let this expand. If you find issues that need weeks of work, they belong in v0.2 planning, not in the ship blocker list.
