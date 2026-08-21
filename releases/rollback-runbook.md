# Rollback runbook

## When to roll back

Any of the triggers in `deploy-checklist.md` "Rollback triggers" section, OR any judgment call that says "this is worse than before we shipped."

Prefer rolling back over hotfixing under pressure. Fix on trunk, re-ship deliberately.

## How to roll back

### Fast path — host product only

If the SDK is embedded in the example app's bundle:

1. Revert the example app PR that consumed the new SDK version.
2. Redeploy the example app to production.
3. Users get the previous SDK version on next page load (bounded by CDN cache).
4. Time to safety: ~10 minutes.

### Full path — SDK + host

If SDK code needs to be reverted at the package level (rare):

1. Yank the offending version from the internal npm registry (`npm unpublish` in the window if available, or deprecate).
2. Revert host product PR.
3. Redeploy host.
4. Communicate to any other consuming products (once we have them).

## After rollback

- [ ] Post short internal note: what happened, what we rolled back, what's next.
- [ ] File an incident in whatever the org uses (or `releases/incidents/YYYY-MM-DD-<slug>.md` if we don't have one).
- [ ] Investigate root cause. Fix on main.
- [ ] Add a test that would have caught this.
- [ ] Re-plan the re-ship.

## Prevention

- Every rollback earns a new automated test.
- If we roll back twice for the same class of bug, the CI / release checklist gets a new item.

## Who to contact

Solo build for now: it's you. Once there are more people, list them here.
