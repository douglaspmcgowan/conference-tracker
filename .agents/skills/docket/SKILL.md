---
name: docket
when_to_use: "Use when Douglas invokes /docket, or when a mass review or mass-decision batch is ready to leave this session for outside review or sync -- not for a brief, a single decision, or routine internal task-state updates. A brief or single decision publishes to the vault directly; see VAULT-PROTOCOL.md."
description: Route a mass review or mass-decision batch through the configured Docket review surface. A brief or single decision never routes here -- it publishes to the vault.
disable-model-invocation: true
provenance: promoted-from-command:v1
---

# /docket [review|decision|sync] [what to send]

`review` and `decision` are for a **mass batch** only — many discrete, near-identical items to
triage or answer on a phone. A single brief or a single decision never takes this route; see
**Route** step 3 below.

`~/.agents/DOCKET-PROTOCOL.md` is the authority for Docket’s data model, source-of-truth rules, sensitivity handling, card schemas, mirror placement, CLI location, and verification. Read its current version before creating, syncing, or reporting a Docket item.

## Work Scope routing

When the exact project path `.agents/work/state.json` exists, Work Scope is authoritative and its
generated project, track, task, queue, and log views are read-only. Load and follow the `work-scope` skill, including its guard, ownership, evidence, and handoff rules. Resolve tools from the package containing that loaded skill. Validate and resume with `Test-WorkState.ps1`, `Get-WorkResume.ps1`, and `Reconcile-WorkState.ps1`; use `Update-WorkState.ps1` for active-cell work, `Capture-WorkDiscovery.ps1` for adjacent or deferred work, and `New-WorkHandoff.ps1` for independent outcomes. A present but invalid state fails closed; use legacy task routing only when that state file is absent.

A blocking decision inside the active capability becomes a structured task through `Update-WorkState.ps1`, with acceptance criteria requiring the stable Docket decision record.
Add dependent work with `-Dependencies <decision-task-id>`.
A decision outside the active cell becomes a `prerequisite` or `adjacent` item through `Capture-WorkDiscovery.ps1`.

## Route

1. Classify the request: a mass review batch, a mass-decision batch, a sync, a single decision, or a brief. Only the first three route through Docket.
2. Follow the protocol’s sensitivity gate and use its supported CLI or sync command. Do not revive retired wrappers, local-server assumptions, hard-coded paths, scheduled tasks, or credential mechanics from this skill.
3. For a single decision, write the open-decision record in `05 Decisions\` and stop — Douglas reads and answers it in Obsidian; per Douglas's 2026-08-24 ruling, it never becomes a Docket card.
4. For a brief, write the authored vault note only — VAULT-PROTOCOL.md's **Brief and decision quality** section owns the required form. Do not create a Docket card or mirror record for it; that push was retired by the same ruling.
5. Capture the returned identifier and run the protocol’s named verification before reporting success.

If the supported CLI, protocol, or required authority is unavailable, stop with the missing capability. Do not hand-roll HTTP calls, copy credentials, or create an alternate Docket client.
