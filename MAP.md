# Project map

## Core documents

| File | Owns |
|---|---|
| `AGENTS.md` | Portable project behavior |
| `CLAUDE.md` | Claude import |
| `.cursor/rules/00-project-contract.mdc` | Cursor project pointer |
| `TASK.md` | Active goal, queue, blockers, completed evidence, next verifier |
| `STATUS.md` | Durable capability state |
| `LOG.md` | Append-only completed work |
| `BACKBURNER.md` | Parked work |
| `MAP.md` | This architecture and navigation map |
| `DESIGN.md` | Universal and project interface rules |
| `PRODUCT.md` | Optional product intent |
| `MEMORY.md` | Lean durable-reference index |
| `skills-manifest.json` | Canonical skill bindings |
| `data-manifest.yaml` | External-data authorities, adapters, and restore rules |
| `secret-manifest.json` | Value-free secret inventory and trust boundaries |

## Architecture

| Component | Purpose | Entry point | Owner |
|---|---|---|---|
| Express application | Serve the interface, JSON API, health route, and iCalendar feed | `server.js` / `npm start` | Project repository |
| Conference dataset | Provide the committed runtime source of truth | `data/conferences.js` | Generated from reviewed research inputs |
| Research inputs | Record sourced conference facts grouped by research cluster | `research/*.md` | Scheduled and manual research workflow |
| Data refresh | Merge, normalize, deduplicate, and sort research records | `node scripts/refresh-data.js` | Project repository |
| Browser verifier | Exercise the deployed or local user journeys | `node tests/verify-live.mjs [base-url]` | Project repository |
| Deployment | Run the Express handler as a Vercel serverless application | `vercel.json` | Vercel project |

## Important paths

| Path | Purpose | Generated | Committed |
|---|---|---|---|
| `server.js` | Express routes plus inline HTML, CSS, and browser JavaScript | no | yes |
| `data/conferences.js` | Normalized conference records used at runtime | yes | yes |
| `research/` | Human-reviewable research inputs | no | yes |
| `scripts/refresh-data.js` | Dataset regeneration command | no | yes |
| `tests/verify-live.mjs` | Playwright end-to-end verification | no | yes |
| `vercel.json` | Deployment routing | no | yes |

## Data flow

Committed `research/*.md` inputs flow through `scripts/refresh-data.js` into the committed `data/conferences.js` dataset. `server.js` reads that dataset and serves HTML, `/api/conferences`, `/cal.ics`, and `/health`. Browser-local notes, stars, filters, and status remain in `localStorage`; they are not synchronized through the repository.

## Integrations

| System | Direction | Credential name | Failure behavior |
|---|---|---|---|
| Vercel | out | none declared in repository | Deployment or live verification fails without changing committed source |
| GitHub scheduled research | in | platform-managed GitHub authorization | The committed dataset remains at its last reviewed version |
| Browser localStorage | both | none | Personal browser state is local to that browser profile |

## Ownership and concurrency

Use isolated Git worktrees for concurrent repository changes. The local server uses port 3010 by default. `data/conferences.js` is the shared generated artifact: only one refresh workflow should update it at a time. The deployed target is `conference-tracker-rho.vercel.app`.

## Update rule

Update this file when a component boundary, data flow, owner, integration, core document, or important path changes.
