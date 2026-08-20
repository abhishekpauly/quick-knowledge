# Content schema (v1)

Tours are authored as JSON files under `content/<product>/<tour-id>.tour.json`. Every file conforms to the v1 schema below. The Zod source of truth lives at `src/schema/v1.ts` (added in Sprint 02).

## File shape

```json
{
  "schemaVersion": "v1",
  "id": "ai-platform-onboarding",
  "product": "ai-platform",
  "title": "Welcome to the AI Platform",
  "description": "Five-minute tour of the essentials.",
  "difficulty": "onboarding",
  "estimatedMinutes": 5,
  "triggers": [
    { "type": "first-run" }
  ],
  "prerequisites": [],
  "steps": [
    {
      "id": "welcome",
      "target": "[data-tour=\"app-root\"]",
      "placement": "center",
      "title": "Welcome",
      "body": "This is a five-minute walkthrough of the essentials.",
      "media": null,
      "actions": {
        "primary": { "label": "Start", "action": "next" },
        "secondary": { "label": "Skip", "action": "dismiss" }
      },
      "advanceOn": null
    },
    {
      "id": "sidebar-projects",
      "target": "[data-tour=\"sidebar-projects\"]",
      "placement": "right",
      "title": "Projects live here",
      "body": "Every AI workload starts as a project. Click to see your projects.",
      "advanceOn": { "type": "click", "target": "[data-tour=\"sidebar-projects\"]" }
    }
  ]
}
```

## Field reference

### Root fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaVersion` | `"v1"` | yes | Enables parallel-version support during migrations. |
| `id` | string | yes | Globally unique. Kebab-case. Format: `<product>-<intent>`. |
| `product` | string | yes | Which product this tour belongs to. Used for filtering and analytics. |
| `title` | string | yes | Displayed to users. |
| `description` | string | no | Longer summary shown in menus / checklists. |
| `difficulty` | enum | yes | `"onboarding"` \| `"basic"` \| `"intermediate"` \| `"advanced"` \| `"common-task"` |
| `estimatedMinutes` | number | no | Shown to user before starting. Sets expectations. |
| `triggers` | array | yes | See "Triggers" below. Can be empty (manual-only). |
| `prerequisites` | array of tour IDs | no | Tour won't offer itself until prereqs are completed. |
| `steps` | array | yes | Non-empty. See "Step fields" below. |

### Step fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Unique within the tour. Used in analytics. |
| `target` | selector string | yes | MUST match `^\[data-tour="[^"]+"\]$`. Enforced by schema and runtime. |
| `placement` | enum | yes | `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"center"` |
| `title` | string | no | Shown in tooltip header. |
| `body` | string | yes | Markdown supported. Kept short — one to two sentences. |
| `media` | object \| null | no | `{ type: "image" \| "video", src: "...", alt: "..." }` |
| `actions` | object | no | Overrides default next/skip. Rare. |
| `advanceOn` | object \| null | no | Auto-advance condition. See below. |

### `advanceOn` types

- `{ type: "click", target: "[data-tour=\"...\"]" }` — advance when the user clicks the element.
- `{ type: "input", target: "[data-tour=\"...\"]" }` — advance when the input receives non-empty value.
- `{ type: "url", pattern: "/workflows/*" }` — advance when URL matches.
- `{ type: "event", name: "workflow_created" }` — advance when an analytics event fires.
- `null` — user must click Next.

### Triggers

- `{ type: "first-run" }` — starts on first mount if user has never completed this tour.
- `{ type: "manual" }` — only starts when app calls `trainer.start(tourId)`. Default.
- `{ type: "url", pattern: "/workflows/new" }` — starts when URL matches.
- `{ type: "event", name: "sign_up_completed" }` — starts when an analytics event fires.

## Validation

- Schema check: `npm run validate:content` (Zod).
- Selector check: `npm run validate:selectors` (grep host codebase for every referenced `data-tour` ID).
- Both run in CI. Both block merge on failure.

## Versioning

- Breaking changes → new schema version (`v2`, `v3`, …). Engine supports the last two versions.
- Non-breaking additions → new optional fields in the current version. No version bump needed.
- Every tour file declares `schemaVersion`. The loader picks the right validator.

## Not yet in v1 (proposed for v2)

- Localization: `title.en`, `title.es`, etc.
- Branching steps: `nextStepId` based on user response.
- Sandbox mode: `sandbox: true` clones DOM into iframe for advanced tours.

These land in `v2` when we have a real use case.
