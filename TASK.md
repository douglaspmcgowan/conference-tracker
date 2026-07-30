# Task

## Goal

Adopt and verify the portable harness-v3 project contract without changing application behavior.

## Active

<!-- Move the item currently being worked here. -->

## Queue

<!-- Add required work extracted from the request here. -->

## Blocked

<!-- Record externally blocked work here. -->

## Needs decision

<!-- Record items requiring a user decision here. -->

## Completed

- [x] Add the portable Claude, Codex, Cursor, task-state, manifest, hook, and skill-projection files | evidence: `SyncProject` completed on isolated branch `codex/harness-v3-onboarding`.
- [x] Replace generated project metadata placeholders with repository-backed identity, commands, architecture, and durable status | evidence: `README.md`, `package.json`, application paths, and manifests inspected.
- [x] Verify harness adoption without application regressions | evidence: `VerifyProject`, `git diff --check`, both Node syntax checks, and the deployed Playwright verifier passed; Gitleaks found no leaks.

## Verification

- Next: independent review, then commit and publish the isolated onboarding branch.

<!--
Markers use a space for queued work, a tilde for active work, x for complete,
an exclamation mark for blocked work, and a question mark for decisions.
Required delegated work may be nested under its parent with agent provenance.
Optional discoveries belong in BACKBURNER.md.
Parallel mode applies to three or more independent, file-disjoint items.
-->
