# Appcues — competitive research notes

Raw factual notes extracted from Appcues' public documentation. Used to inform our own PRDs.

## Methodology

Per `docs/how-to-write-prds.md` (add when authoring workflow is codified) and the workflow described in `product/vs-appcues.md`:

- **Facts and concepts only.** No prose copy-pasted from Appcues docs. Terminology paraphrased in our own words.
- **Kept strictly separate from our PRDs.** These files are research inputs; our PRDs live in `features/FEAT-*.md` and reference the whole category (Appcues + Pendo + Userpilot + …), not one source.
- **Reference the source URL** at the top of every file. If a fact needs verification, follow the link back to the primary source.
- **Update on refresh.** Appcues ships features; when we revisit, we refetch and diff. Don't rely on notes that could be stale.

## Files

| Feature | Notes | Source URL |
| --- | --- | --- |
| Flows | [`flows.md`](./flows.md) | https://docs.appcues.com/flows/what-is-a-flow |
| Pins | [`pins.md`](./pins.md) | https://docs.appcues.com/pins/what-are-pins |
| Embeds | [`embeds.md`](./embeds.md) | https://docs.appcues.com/web-embeds/what-are-embeds |
| Checklists | [`checklists.md`](./checklists.md) | https://docs.appcues.com/checklists/what-are-checklists |
| Banners | [`banners.md`](./banners.md) | https://docs.appcues.com/banners/what-are-banners |
| Launchpads | [`launchpads.md`](./launchpads.md) | https://docs.appcues.com/launchpads/what-are-launchpads |
| NPS | [`nps.md`](./nps.md) | https://docs.appcues.com/nps/what-is-nps |
| Surveys & Forms | [`surveys-forms.md`](./surveys-forms.md) | https://docs.appcues.com/surveys-forms/forms-surveys |

## Consolidated analysis

The gap analysis and roadmap implications are consolidated in [`product/appcues-scope-pass.md`](../../../product/appcues-scope-pass.md). That's the doc that turns these raw notes into decisions.

## Add other competitors here

When we widen research to Pendo / Userpilot / Chameleon / Intercom, create sibling folders:

```
docs/competitive-research/
├── appcues/
├── pendo/
├── userpilot/
└── chameleon/
```

Same one-file-per-feature pattern.
