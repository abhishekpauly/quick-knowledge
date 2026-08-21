# ROI

The five drivers, the cost math, the honest limitations, and how to validate these numbers against real the example app data before pitching leadership.

## The five ROI drivers

Ordered by how quickly they pay back.

### 1. Support ticket deflection

Industry benchmarks show that well-designed in-app training deflects **20–40%** of tier-1 support tickets — the "how do I X" and "where is Y" category.

**Rough math for the example app:**
- Assume 200 onboarding / how-to tickets per month (validate against real data — see the section below).
- Each ticket costs support ~20 minutes at a loaded rate of ~$50/hour = ~$16.67/ticket.
- Deflecting 30%: 60 tickets/mo × $16.67 = **~$1,000/month saved on the example app alone**.
- Annualized: **~$12,000/year**.

**Time to see it:** Starts within a week of shipping. Compounds as coverage grows.

### 2. Activation lift

Users who complete an onboarding tour activate — reach their first meaningful outcome in the product — at meaningfully higher rates than those who don't. Industry ranges are **2–5x** for well-designed onboarding, but even a modest 5–10 percentage-point lift compounds into retention and revenue.

**Rough math:**
- If the example app's current trial-to-paid conversion is X%, a 5-point lift adds 5% × trial volume × ACV in incremental annual recurring revenue.
- For a product with 100 trials/month and $2,000 ACV, that's 5 additional customers/month = **$120k/year in incremental ARR**.

Numbers here vary wildly by product. Get real conversion + ACV baselines to validate.

### 3. Cross-product license avoidance — the biggest strategic driver

SaaS alternatives (Appcues, Pendo, Userpilot, WalkMe) cost roughly **$500–$2,000 per month per product** at typical MAU tiers.

**Math:**
- Every host product that adopts this SDK avoids one SaaS license: **$6–24k/year per product, forever**.
- Three products: **$18–72k/year avoided**, permanently.
- Five products in three years: **$90–360k avoided**.
- Plus zero vendor lock-in, full ownership of code, data, and roadmap.

**Time to see it:** Starts the day the first "second product" would have signed a SaaS contract.

### 4. Feature launch effectiveness

New features typically get discovered by a small fraction of users organically. A launch tour targeted at users who would benefit lifts feature adoption **3–5x**.

**Why this matters financially:** Every feature that lands better justifies the engineering that built it. If the example app ships ~1 major feature/month at ~2 engineer-months of cost each (~$40k), lifting adoption from 10% to 40% is a direct return on that engineering investment. Hard to price precisely, but it's the second-largest strategic driver after cross-product amortization.

### 5. Reduced content maintenance friction

Because tour content is JSON edited by PR — not code — updates don't consume engineering bandwidth. A copy tweak that used to be an engineering ticket and a 1–2 week wait is now a same-day change.

**Rough math:** If the curriculum team makes ~4 content updates per month, and each one previously took 30 minutes of engineering time (~$50/hour loaded), that's ~$400/year saved. Small in isolation, but the real benefit is throughput — the curriculum team stops waiting on engineering and can iterate on messaging as fast as they want.

## Cost side

**One-time build:** ~3 weeks of work (v0.1.0-mvp). At ~$100/hour loaded, roughly **$12,000**.

**Ongoing maintenance:** ~10–20% of one engineer, mostly to keep `data-tour` selectors current and to add new tours. At full loaded cost of a senior engineer, roughly **$20k–$40k/year**.

**Per-product integration:** ~4 hours per new host product. Roughly **$400** in engineering time. Negligible.

## Break-even analysis

**the example app alone:**
- Year 1 cost: $12k build + $30k maintenance = **$42k**.
- Year 1 return (conservative, support-deflection only): **$12k** (30% deflection assumption).
- Year 1 return (with 5-point activation lift on a modest product): **$132k**.
- **Break-even inside year one on conservative assumptions. 3x return on modest assumptions.**

**With one additional product adopting:**
- Add $400 integration + one avoided SaaS license.
- Avoided license (mid-range): **$12k/year**.
- **Pays for its own maintenance and then some.**

**With three products adopting:**
- Cross-product license avoidance alone: **$36k/year**.
- Plus support deflection + activation lift on all three.
- **Fully self-funding infrastructure.**

## Honest limitations you should name to leadership

- **The numbers above are ranges, not measurements.** They use industry benchmarks. Validate against real the example app ticket volume and activation baselines before quoting them (see next section).
- **Success depends on the curriculum being good.** The SDK removes the friction of shipping and updating training; it doesn't guarantee the training itself lands with users. That's why the 5-user test protocol is baked into every release. If the curriculum is bad, the ROI numbers above don't apply.
- **v0.1.0-mvp is React only.** Vue products can't adopt until the Vue adapter is built — waiting on a Vue product to commit before we build it.
- **Content ships with the next product release** — no hot-updates. If we need instant content pushes, that's a v0.5 feature (content served from an API).
- **The support-deflection number depends on training covering the actual top-ticket topics.** Don't assume 30% deflection on day one; earn it by targeting the training at what real users struggle with.
- **We haven't run the 5-user test yet.** All the completion-rate targets in the release plan are targets, not measurements. Real numbers come 7 days after ship.

## How to validate these numbers against real the example app data

Before pitching this to leadership, replace the ranges above with actual numbers. About two hours of work.

**1. Pull real support ticket data (30 min)**
- Ask support ops for the last 3 months of tickets.
- Filter by tags: "onboarding," "how-to," "getting-started," "where-is."
- Divide by 3 to get monthly average. This is the ticket volume that could be deflected.

**2. Compute real support cost (15 min)**
- Ask ops for average handling time per ticket.
- Multiply by loaded support agent cost.
- Result: real dollar cost per ticket.

**3. Get activation baseline (30 min)**
- Ask analytics for current trial-to-paid conversion rate on the example app.
- Ask for current 7-day and 30-day retention on new signups.
- These are the baselines the SDK will (hopefully) lift.

**4. Get ACV (15 min)**
- Ask finance or revenue ops for current average contract value.
- Combined with conversion rate, this gives incremental ARR per activation point.

**5. List other host products likely to adopt in the next 12 months (30 min)**
- Talk to product leadership. Which products are on React? Which have onboarding pain? Which have PMs asking about this kind of tool?
- Every "yes" adds $6–24k/year to the ROI calc.

**Once you have those five inputs**, the ROI section here becomes a concrete pitch with the org-specific numbers instead of industry ranges. Leadership will believe your numbers when they're your numbers, not benchmarks.

## What to ask for

If pitching leadership for continued investment:

- **Green light on v0.1.0-mvp shipping** (already built; needs env access + compliance sign-off).
- **~$30k/year of engineering time** for ongoing maintenance (~15% of one senior engineer).
- **Buy-in from one other host product team** to adopt as customer #2 in the next quarter — proves the cross-product model and turns on the biggest ROI driver.
- **~7 hours of user-research time** to run the 5-user test protocol on each major release.

That's the whole ask. Everything else is upside.
