# Deploy checklist

Run through this for every release. Every item is a checkbox because every item has been forgotten at least once in some past project somewhere.

## Pre-flight (day before)

- [ ] `CHANGELOG.md` `[Unreleased]` section reviewed. Every notable change listed.
- [ ] Version bumped in `package.json` per SemVer.
- [ ] Corresponding release plan doc exists (e.g., `releases/v0.1.0-mvp.md`).
- [ ] All P0/P1 acceptance criteria pass (`testing/acceptance-criteria.md`).
- [ ] All CI jobs green on main.
- [ ] Bundle size within budget (see `testing/test-strategy.md`).
- [ ] No new peer-dep warnings.
- [ ] Content schema version documented if it changed.

## Content

- [ ] `npm run validate:content` green.
- [ ] `npm run validate:selectors` green against the target host codebase revision.
- [ ] Every tour played through manually in QA — see `testing/acceptance-criteria.md`.

## Host product coordination

- [ ] the example app's frontend engineer notified — merge window agreed.
- [ ] All required `data-tour` attributes are already merged in the host codebase's production branch.
- [ ] Rollback plan clear on both sides.

## Analytics

- [ ] Real sink is receiving events in staging.
- [ ] Event names and payloads match schema.
- [ ] Dashboard (if any) is ready to observe post-launch metrics.

## Release

- [ ] Cut release branch: `release/vX.Y.Z`.
- [ ] Tag: `git tag vX.Y.Z`.
- [ ] Publish to internal npm registry.
- [ ] Update host product to consume the new version (PR).
- [ ] Merge host product PR.
- [ ] Deploy host product to staging → verify → production.

## Post-flight (day of + day after)

- [ ] Watch analytics for 24 hours: completion rate, drop-off, error events.
- [ ] Monitor Sentry / error tracker for `tour_error` spikes.
- [ ] Confirm no support tickets tagged "onboarding" or "tour" beyond baseline.
- [ ] Update `CHANGELOG.md`: move `[Unreleased]` items into `[vX.Y.Z] - YYYY-MM-DD`.
- [ ] Post short "we shipped" note internally.

## Rollback triggers

Roll back immediately if any of these:
- Onboarding completion rate drops below 20% in first hour.
- `tour_error` rate exceeds 5% of `tour_started`.
- Console error rate up 3x from baseline in the example app.
- Any P0 bug reported.

See `releases/rollback-runbook.md`.
