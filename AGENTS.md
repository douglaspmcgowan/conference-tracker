# Project instructions

This repository contract travels with the project for Claude, Codex, Cursor, and cloud agents.

<!-- agent-harness:portable:v3:start -->
## Portable operating rules

- Answer questions before task narration. Keep routine updates concise.
- Never invent facts, paths, APIs, versions, source content, measurements, credential state, or passing results. Name the source checked.
- Verify inherited claims against repository, Git, runtime, or current primary evidence.
- Match commands and paths to the user's actual shell and device.
- Avoid the rhetorical "it is X, not Y" construction.
- Preserve unrelated changes. Inspect exact targets before destructive or broad operations and prefer recoverable changes.
- Before creating, replacing, renaming, or removing an artifact, search the repository and available shared harness for its existing owner, equivalents, consumers, wiring, tests, and documentation. Extend or consolidate the closest adequate owner. Record search evidence and the reason for a truly new owner in `TASK.md`.
- Extract every discrete obligation from a multi-step prompt into `TASK.md`. Add required agent-discovered work as nested checkboxes with provenance. Use parallel execution when eligible work is independent and file-disjoint.
- Read a named or clearly matching skill in full. Keep canonical workflows under `.agents\skills` and product adapters thin.
- Reproduce bugs before fixing them and add a regression test when practical. Exercise the assembled system under the condition that exposed the failure.
- For browser-visible changes, run the repository browser or end-to-end verifier.
- When a correction requests permanent prevention, use the `correct` skill and implement a durable, narrowly scoped artifact.
- Treat `MEMORY.md` as a lean index. Keep behavior in instructions, skills, hooks, permissions, tests, or verifiers.
- Before claiming non-trivial work complete, run the verification recorded in `TASK.md`, relevant tests, and an adversarial pass.
<!-- agent-harness:portable:v3:end -->

## Project identity

- Name: `conference-tracker`
- Purpose: Track research-conference deadlines, requirements, locations, personal notes, and submission status through a deployed Express application.
- Default branch: `main`

## Start and resume

1. Read this file, `TASK.md`, `STATUS.md`, and recent `LOG.md`.
2. Run `git status --short --branch` and inspect worktrees before editing.
3. Read `MAP.md` for architecture, data, ownership, integrations, or important paths.
4. Read `DESIGN.md` for interface work and `PRODUCT.md` when present.

## Commands

- Setup: `npm ci`
- Test: `node tests/verify-live.mjs http://localhost:3010` after starting the local server
- Lint: `node --check server.js` and `node --check scripts/refresh-data.js`
- Build: `N/A — the Express application has no build step`
- End-to-end: `node tests/verify-live.mjs`

Record the actual command or observable proof under `TASK.md` → `Verification`.

## Project-specific rules

- Treat `data/conferences.js` as generated output; edit the research inputs and run `node scripts/refresh-data.js`.
- Preserve the single-file Express application architecture unless a scoped task explicitly changes it.
- Browser-visible changes require the Playwright verifier against the affected local or deployed surface.

## Project files

- `TASK.md`: current goal, actionable queue, blockers, completed evidence, and next verifier.
- `STATUS.md`: durable capability state.
- `LOG.md`: append-only completed-work record.
- `BACKBURNER.md`: parked ideas.
- `MAP.md`: architecture, paths, data flow, integrations, and ownership.
- `DESIGN.md`: universal interface rules plus project-specific design rules.
- `PRODUCT.md`: optional product intent for an app or product repository.
- `MEMORY.md`: lean links to durable references.
- `skills-manifest.json`: canonical baseline and project skill bindings.
- `data-manifest.yaml`: external-data authorities, adapters, restore rules, and verifiers.
- `secret-manifest.json`: value-free secret names, providers, trust boundaries, and consumers.

## Product adapters

- Claude loads `CLAUDE.md`, which imports this file.
- Codex loads this file.
- Cursor loads `.cursor\rules\00-project-contract.mdc`, which points here.

When the local shared harness exists, also follow `~/.agents/AGENTS.md`. Repository rules supply the portable fallback for cloud sessions.
