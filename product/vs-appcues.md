# vs. Appcues — feature comparison and strategic position

## Why this doc exists

Appcues is the market-leading in-app product-training platform. When we tell people what we're building, the first two questions are always: "Isn't this just Appcues?" and "Why not buy Appcues?"

This doc answers both. Read it before pitching the SDK to leadership or another product team. Read it before evaluating whether a feature request is core to our mission or scope creep from someone thinking of Appcues.

## The bottom line

Yes, technically we can build something similar to Appcues. There's no proprietary magic in their product. But **matching Appcues fully is a 12–18 month project for a small team** (~3–5 engineers + designer + PM), and Appcues has ~150 employees for a reason — most of their headcount isn't building the tour engine, it's building and maintaining everything around it.

**Our decision:** Don't try to be Appcues. Be a focused in-app training SDK that covers the 60–70% of Appcues that matters for UPTIQ, and offload the rest to tools we already own.

That decision is what makes this project ship in a quarter instead of a year, and stays maintainable by one person plus AI assistance instead of a team.

## Feature parity — where we stand today

Rough map. **✓** = shipped in v0.1.0-mvp. **◐** = partial. **○** = not built. **N/A** = deliberately not building (see non-goals below).

| Appcues capability | Status | Notes |
| --- | --- | --- |
| **Flows** (multi-step tours) | ✓ | `Trainer` + JSON schema + Shepherd base |
| Tooltip step pattern (anchored) | ✓ | Top / bottom / left / right / center |
| Slideout step pattern | ◐ | Shepherd supports; we haven't exposed |
| Modal step pattern | ✓ | Via center placement |
| Hotspot / Beacon step pattern | ○ | Small future feature |
| **Checklists** | ✓ | `TrainingChecklist` widget |
| **Tooltips / Hints** (persistent `?` icons) | ✓ | `TrainingHint` + `HintsProvider` |
| **Themes** (reusable style set) | ✓ | CSS variables |
| **Pins** (persistent anchored content) | ○ | v0.5 |
| **Banners** (top-of-page persistent) | ○ | v0.5 |
| **Launchpad** (resource-center widget) | ○ | v0.5 |
| **Embeds** (inline in-product content blocks) | ○ | v1.0 |
| **NPS surveys** | ○ | v0.5 |
| **Surveys / Forms** with response collection | ○ | v0.5 (basic) → v1.0 (full) |
| **Page / URL targeting** | ✓ | URL triggers, glob patterns |
| **Event targeting / triggering** | ✓ | Fires on named analytics events |
| **Audience / Property targeting** | ○ | v0.2 — property-based segmentation |
| **Segments** (reusable audience defs) | ○ | v0.5 |
| **Anonymous users** | ◐ | Per-browser via localStorage; no user identity yet |
| **Prerequisites gating** | ✓ | Enforced by Trainer |
| **Frequency limits** | ○ | v0.2 |
| **Flow priority / ordering** | ○ | v0.2 |
| **Localization** (multi-language) | ○ | v0.2 (schema v2 support) |
| **Permalinks** (shareable trigger links) | ○ | v0.2 |
| **Goals** (post-flow conversion tracking) | ○ | v0.5 |
| **A/B testing / Control experiments** | ○ | v1.0 |
| **Event analytics** (adapter → sink) | ✓ | Typed events → PostHog / Amplitude / Mixpanel / GA4 / custom |
| **Analytics Studio** (dashboards in-SDK) | N/A → sprint 18+ | Offload to your existing analytics tool until Sprint 18 |
| **Funnels, Saved Charts, User Profiles UI** | N/A → sprint 18+ | Same |
| **Webhooks** (outbound HTTP on events) | ○ | v0.5 |
| **Public REST API** (user CRUD, GDPR delete) | ○ | v1.0 |
| **Debugger / Diagnostics tool** | ◐ | We emit `tour_error`; no dedicated UI |
| **Visual no-code Studio / Builder** | **N/A** | Deliberate — JSON via PR is faster for our author |
| **Team management / SSO** | ○ | Only when we build an admin surface |
| **Integration Hub** (Salesforce, HubSpot, etc.) | ○ | Extend adapter model as needed |
| **Mobile SDKs** (iOS / Android / RN / Flutter) | **N/A** | UPTIQ products are web; no plans to change |
| **Multi-channel Workflows** (email + push + in-app) | **N/A** | Offload to HubSpot / Braze / Iterable |
| **Email delivery infrastructure** | **N/A** | Offload |
| **Push notification infrastructure** | **N/A** | Offload |
| **Click-to-Track** (no-code event creation) | ○ | Requires a Studio UI — not building |
| **iFrames support** | ○ | Add if a real UPTIQ product needs it |

**Estimated coverage today:** ~25% of Appcues by feature count. But because we've deliberately scoped out ~35% of their surface as non-goals, our **effective coverage of what matters is closer to 40%**, headed to ~65–70% by v1.0.

## The four things we explicitly won't build

Decided in review of the Appcues surface area — these stay off the roadmap unless a real UPTIQ trigger forces the conversation.

### 1. Mobile SDKs (iOS, Android, React Native, Flutter)

- **Appcues has:** Native SDKs for all four with dedicated targeting, screen views, session tracking, deep links, mobile push.
- **Why we don't need them:** UPTIQ products are web. If a mobile UPTIQ product launches, revisit — but building mobile SDKs speculatively is roughly a third of Appcues' engineering scope for zero current value.
- **Cost avoided:** ~4–6 months of engineering effort per platform, times four platforms, plus ongoing maintenance for each.
- **Trigger to revisit:** A UPTIQ product commits to shipping a native mobile app that needs in-app training.

### 2. Visual no-code Studio / Builder

- **Appcues has:** A full web app where PMs and marketers drag and drop steps onto a live product screenshot, style them visually, publish without code.
- **Why we don't need it (immediately):** Our curriculum author is technical. JSON-in-git with a PR review is faster to iterate than a WYSIWYG, doesn't require learning a proprietary UI, and gives us diffable version history. The Studio is what makes Appcues expensive per MAU and what generates most of their ongoing maintenance burden.
- **Cost avoided:** ~3–6 months build + a permanent ~1 engineer of maintenance for the UI itself.
- **Trigger to revisit:** Author velocity drops below 1 tour/hour, OR a non-technical curriculum author joins the team, OR another UPTIQ product's non-technical PM wants to author their own content without engineering help.

### 3. Multi-channel Workflow engine (email + push + in-app orchestration)

- **Appcues has:** A workflow builder that chains in-app messages, emails, mobile push, and delays into automation sequences (basically marketing automation inside their tour tool).
- **Why we don't need it:** This is Braze / Iterable / HubSpot territory. UPTIQ almost certainly already has one of these tools. Rebuilding it inside a training SDK is scope creep that competes with existing infrastructure.
- **Cost avoided:** ~6+ months of engineering plus email + push delivery infrastructure.
- **Trigger to revisit:** Never, realistically. If cross-channel orchestration is needed, integrate the training SDK with the marketing automation tool via webhooks (v0.5).

### 4. Analytics Studio (in-SDK dashboards, Funnels, Saved Charts, User Profiles UI)

- **Appcues has:** A full analytics module inside their product with funnels, saved charts, event explorers, user profile pages.
- **Why we don't need it (until Sprint 18–20):** Every UPTIQ product already emits events to a real analytics tool. Our adapter model means Amplitude / PostHog / Mixpanel dashboards already work today. Rebuilding these dashboards inside our SDK duplicates infrastructure we already pay for.
- **Cost avoided:** ~4–6 months of engineering, plus the ongoing task of "keeping our dashboards on par with real analytics tools" — a fight we would lose.
- **Trigger to revisit at Sprint 18–20:** If cross-product training metrics need a single unified view that no product-specific dashboard can provide, build a lightweight one. Do NOT rebuild Amplitude. Aggregate only.

## Where we go beyond Appcues (or match with less friction)

Not every axis is a gap — a few we're actually better on:

- **Framework agnosticism at the core.** Appcues is fundamentally a script tag with runtime magic. Our engine is a real TypeScript SDK with typed events, typed content, and typed adapters. Deep integration with a specific product (kicking off real workflows, reading real state) is easier for us.
- **Cost.** We pay ourselves once; Appcues charges per MAU per product, forever.
- **Ownership.** We own the code, the data, the roadmap, and the compliance posture. No third-party script reading the DOM of pages that handle customer AI workloads.
- **Content authoring speed for a technical author.** Git PR is faster than a WYSIWYG when the author knows git. This inverts for non-technical authors — which is why the Studio is the biggest trigger to reconsider.
- **Extensibility.** New event types, new adapter interfaces, new content-schema fields — we add them in an afternoon. Feature requests to Appcues take quarters.

## Where Appcues legitimately wins (today)

Naming it honestly:

- **Non-technical authoring.** Their Studio is genuinely better for PMs and marketers than our JSON.
- **Breadth.** They have 20+ features we don't. If UPTIQ needs any of them today, buying is faster than building.
- **Mobile.** If UPTIQ ever ships a mobile product with in-app training needs, Appcues is a working answer immediately.
- **Battle-tested at scale.** Their engine has been debugged against thousands of products. Ours has been tested against one.
- **Marketing surface.** They have brand recognition; a PM at UPTIQ might reach for them by reflex. Our SDK has to be actively championed.

We don't need to be better at any of these to be the right choice — we just need to be *good enough* at the ~60–70% that matters, at a fraction of the total cost of ownership.

## Recommended path

See `product/roadmap-to-parity.md` for the tiered plan (v0.2 → v0.5 → v1.0) that gets us to "Appcues-for-UPTIQ" over ~12 months without touching any of the four non-goals above.

## Related docs

- [`overview.md`](./overview.md) — what this SDK is (audience-neutral).
- [`use-cases.md`](./use-cases.md) — seven concrete scenarios v0.1.0 supports.
- [`roi.md`](./roi.md) — the financial case, including cross-product license avoidance.
- [`roadmap-to-parity.md`](./roadmap-to-parity.md) — the tiered path from v0.1 to Appcues-for-UPTIQ.
- Root `ROADMAP.md` — sprint-level roadmap.
