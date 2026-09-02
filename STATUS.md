# Status

## Working

- The Express application serves the timeline, cards, table, and map from one committed conference dataset.
- The JSON API, iCalendar feed, health route, browser-local personalization, and shareable filter state are documented in `README.md`.
- Research inputs regenerate `data/conferences.js` through `node scripts/refresh-data.js`.
- The Playwright verifier covers the deployed or local browser surface.
- Harness v3 project contracts, manifests, product adapters, and skill projections are present on this onboarding branch.

## Known limits

- Notes, stars, and submission status are browser-local and do not synchronize across devices.
- `data-manifest.yaml` declares no external project assets; all required runtime source and research data are committed to Git.
- `PROJECT_DATA_ROOT` is path configuration required by the portable manifest contract, not a credential and not currently consumed by the application.
- `npm ci` reports one low and two moderate dependency advisories; dependency remediation was outside this harness-only onboarding.
