# Wiring the Goals sink

Goals (v0.5) let a tour declare "this was worthwhile if the host analytics saw event X within N minutes." The SDK never queries your analytics directly — you implement one function and pass it in.

Design context: [`../product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) `## Feature 2 — Goals`.

## The one function you implement

```ts
interface GoalsSink {
  /**
   * Returns true if `event` has been observed for the current user with
   * properties that are a superset of `match`, at or after `sinceIso`.
   *
   * Called by the trainer at a 60-second cadence after `tour_started`,
   * plus once at window expiry. Must resolve within ~5s; a slower query
   * is a signal to cache upstream, not to make the trainer patient.
   */
  hasEventOccurred(
    event: string,
    match: Record<string, unknown>,
    sinceIso: string,
  ): Promise<boolean>;
}
```

Pass it via `TrainerConfig`:

```ts
new Trainer({
  product: 'example-app',
  tours,
  analytics: /* your analytics adapter */,
  persistence: localStoragePersistence(),
  goals: myGoalsSink, // ← this doc's subject
});
```

Omit `goals` entirely if no tour declares a `goal` — the trainer skips the check-loop for tours without one.

## Contract

- **Query the host's own analytics.** Not the SDK's `TrainingEvent` stream — the SDK already knows about those. The point of Goals is to correlate with the host's product-level conversions (`exampleapp.project_created`, `dashboard.saved`, etc.).
- **Sync must be a Promise.** The trainer awaits; a synchronous return is fine as `Promise.resolve(...)`.
- **Property match is subset semantics.** `match = { source: 'onboarding' }` matches any event whose properties include `source: 'onboarding'`; extra properties on the event are ignored.
- **`sinceIso` is inclusive.** Events fired at exactly `tour_started` count.
- **User scope is implicit.** The function is called client-side, so "the current user" is whoever is signed in wherever your sink knows about it. Cross-user leakage would be a sink-side bug.
- **Never throws.** A network error should resolve `false` (goal not yet met, we'll try again next tick).

## Recipes

### PostHog

PostHog exposes a synchronous local cache of the current user's events via `posthog.getSessionRecording()` — but for goals we want a durable query, so use the HogQL query API from `posthog-node` (or `fetch` if you don't want the extra dep).

```ts
// src/goals-sink.ts (in the HOST product)
import type { GoalsSink } from '@in-app-training/sdk';
import posthog from 'posthog-js';

const POSTHOG_API_HOST = import.meta.env.VITE_POSTHOG_API_HOST; // e.g. https://us.i.posthog.com
const PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const PERSONAL_API_KEY = import.meta.env.VITE_POSTHOG_READ_KEY; // read-only key

export const goals: GoalsSink = {
  async hasEventOccurred(event, match, sinceIso) {
    const distinctId = posthog.get_distinct_id();
    if (!distinctId) return false;

    const propsFilter = Object.entries(match)
      .map(([k, v]) => `properties.${k} = ${JSON.stringify(v)}`)
      .join(' AND ');
    const where = [
      `event = ${JSON.stringify(event)}`,
      `person_id = ${JSON.stringify(distinctId)}`,
      `timestamp >= toDateTime(${JSON.stringify(sinceIso)})`,
      propsFilter,
    ]
      .filter(Boolean)
      .join(' AND ');

    try {
      const res = await fetch(`${POSTHOG_API_HOST}/api/projects/${PROJECT_ID}/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PERSONAL_API_KEY}`,
        },
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query: `SELECT count() FROM events WHERE ${where} LIMIT 1`,
          },
        }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as { results?: [[number]] };
      const count = json.results?.[0]?.[0] ?? 0;
      return count > 0;
    } catch {
      return false;
    }
  },
};
```

**Notes:**
- A **read-only personal API key** is required (Project Settings → API Keys). Don't ship a read/write key.
- `person_id` correlation assumes the user has been `identify()`-d in PostHog. If you're seeing goals never fire, this is the first thing to check.
- For B2B products with a fixed user cohort, consider caching the last "goal fired" state in localStorage keyed by user + tour so a page reload doesn't re-poll.

### Amplitude

Amplitude's Query API is the direct fit. Requires an org-scoped API key + secret; run through your backend if you don't want the secret in the browser.

```ts
// src/goals-sink.ts
import type { GoalsSink } from '@in-app-training/sdk';
import * as amplitude from '@amplitude/analytics-browser';

// A tiny backend proxy avoids exposing the Amplitude secret in the browser.
// Signature: POST /api/goals-check {event, match, sinceIso, userId} → {occurred: boolean}
const PROXY_URL = '/api/goals-check';

export const goals: GoalsSink = {
  async hasEventOccurred(event, match, sinceIso) {
    const userId = amplitude.getUserId();
    if (!userId) return false;
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, match, sinceIso, userId }),
      });
      if (!res.ok) return false;
      const { occurred } = (await res.json()) as { occurred: boolean };
      return occurred;
    } catch {
      return false;
    }
  },
};
```

**Backend proxy sketch (Node/Express):**

```ts
app.post('/api/goals-check', async (req, res) => {
  const { event, match, sinceIso, userId } = req.body;
  const url =
    `https://amplitude.com/api/2/events/segmentation` +
    `?e=${encodeURIComponent(JSON.stringify({ event_type: event }))}` +
    `&start=${sinceIso.slice(0, 10).replace(/-/g, '')}` +
    `&segmentDefinitions=${encodeURIComponent(
      JSON.stringify([{ prop: 'user_id', op: 'is', values: [userId] }]),
    )}`;
  const auth = Buffer.from(`${AMP_KEY}:${AMP_SECRET}`).toString('base64');
  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) return res.json({ occurred: false });
  const data = await r.json();
  const total = data?.data?.series?.[0]?.reduce((a: number, b: number) => a + b, 0) ?? 0;
  res.json({ occurred: total > 0 });
});
```

**Notes:**
- Amplitude's segmentation API returns daily-bucketed counts — good enough for goals with `windowMinutes ≥ 60`. For shorter windows use the Query API's real-time endpoint if your plan includes it.
- Property matching happens in the backend proxy — extend it to filter `data.props` if `match` has more than a user filter.

### In-house / warehouse-backed

If your host product owns its own event pipeline (Kafka → warehouse, or a REST log), the shape is identical:

```ts
export const goals: GoalsSink = {
  async hasEventOccurred(event, match, sinceIso) {
    const currentUserId = getCurrentUserIdFromSession(); // your session helper
    if (!currentUserId) return false;
    try {
      const rows = await runQuery(`
        SELECT 1 FROM product_events
        WHERE name = $1
          AND user_id = $2
          AND ts >= $3
          AND props @> $4::jsonb
        LIMIT 1
      `, [event, currentUserId, sinceIso, JSON.stringify(match)]);
      return rows.length > 0;
    } catch {
      return false;
    }
  },
};
```

Query the read replica, not the primary. Cache the "goal met" result per `(userId, tourId)` in redis with a TTL of `windowMinutes` so a heavily-toured user doesn't hammer the DB.

## Testing your sink

Two-line contract test — drop into any Vitest suite in the host product:

```ts
import { goals } from './goals-sink';

it('returns false when the event has not occurred', async () => {
  const seen = await goals.hasEventOccurred('never.fires', {}, new Date().toISOString());
  expect(seen).toBe(false);
});
```

For the "yes it does fire" side, use a test-scoped user id and emit the event yourself before calling `hasEventOccurred` with a `sinceIso` from before the emit. This exercises the round-trip against your real sink in a scoped-write test project.

## When to build a proxy

Ship the sink direct-from-browser (like the PostHog recipe above) when:

- Your sink accepts read-only tokens.
- Users are pre-authenticated in a way the sink recognises (identified user id).
- CORS is configured on the sink for your product's domain.

Build a backend proxy (like the Amplitude recipe) when:

- The sink only accepts long-lived secrets.
- You need cross-user aggregates (unlikely for goals, but keep the option open).
- Compliance rules block direct client → analytics-vendor traffic.

## Failure modes and what to do

- **Sink returns 429 (rate limit).** Log once, resolve `false` — the trainer will retry on the next 60s tick. If you're seeing sustained rate limits, cache the result upstream.
- **Sink returns 401/403.** The key rotated. Update the env var and redeploy. The trainer's per-tour goal check will resume on the next tick.
- **The goal never fires but you know the event did.** Three usual suspects: (1) `sinceIso` uses a different timezone than the sink stores, (2) property `match` includes a key the sink normalised (snake_case vs camelCase), (3) the user hasn't been `identify()`-d in the sink so `person_id` / `user_id` is anonymous.
- **The goal fires immediately (before any user action).** Your `sinceIso` handling is too permissive — check the sink's clock and confirm `>= sinceIso` isn't accidentally `>= 1970-01-01`.

## Also see

- [`analytics-adapters.md`](analytics-adapters.md) — the pattern for the `Analytics` adapter (event-emission side).
- [`wiring-analytics-sink.md`](wiring-analytics-sink.md) — the emit-side counterpart of this doc.
- [`event-dictionary.md`](event-dictionary.md) — auto-generated list of `TrainingEvent`s the trainer emits, including the goal-related `tour_goal_reached` and `tour_goal_missed` events.
- [`../product/v0.5-kickoff.md`](../product/v0.5-kickoff.md) — the design doc that motivates this file.
