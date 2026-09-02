---
name: solo-review
description: "Use when one primary perspective should review a focused codebase or CAD target, with an optional verified fix loop."
when_to_use: "Use for one exhaustive pass over a focused target, usually ending in fixes. Use panel-ultra-review for independent perspectives, cross-subsystem seams, or a pre-merge range needing isolated live checks; use --read-only when findings must be reviewed before edits."
disable-model-invocation: true
provenance: promoted-from-command:v1
---

# Solo Review

One primary perspective plus a bounded verification loop. Default mode is **apply**; `--read-only`
reports findings without editing.

For CAD or structural output, **never weaken a physical constraint, threshold, or acceptance rule to
obtain a pass**; escalate the judgment call.

## Procedure

1. **Resolve target and mode.** Identify artifacts, acceptance checks, ownership, Git state, and mode.
   On an ambiguous high-risk target, choose read-only and state why.
2. **Establish the review contract.** Define scope and a report schema: id, severity, evidence location,
   issue, impact, proposed fix, required verification. The discovery pass has read-only access and does
   not run commands that regenerate target artifacts.
3. **Discover openly**, with no top-N cap. Name the reviewed population and report present, absent, or
   could-not-tell; zero-of-zero cannot pass. For code: correctness, contracts, validation gaps, silent
   failures, security, stale state, fragile assumptions, and — for a load-bearing service — its
   observability, configuration, concurrency, and idempotency behavior. For CAD: actual geometry and
   acceptance evidence rather than proxy values.
4. **Challenge findings** with a separate read-only refutation pass where available. Retain only
   source-grounded findings; mark unsupported claims uncertain.
5. **Write `SOLO_REVIEW_<YYYY-MM-DD>.md`** with the evidence-backed findings and a concise top-risk
   summary. In read-only mode, stop here and report the path.
6. **Apply mode: cluster by fixing area.** Group findings one agent can own end to end, then give that
   owner the batch. The 2026-08-28 symptom-first failure produced 22 clusters for 59 of 140 findings—2.7
   per cluster—plus 42 singletons. Reproduce each issue when practical, add or identify a regression
   check, make the smallest authoritative change, and iterate until the proving command is green.
   Record `fixed`, `skipped`, or `wont_fix` with evidence or a concrete reason.
7. **Apply mode: final hardening.** Run a bounded simplification pass only on files changed in step 6,
   then repeat verification. Give suites at least 600 seconds and capture the reviewed process's exit
   code, never a pipeline tail's. No unrelated refactors, commits, or pushes.
8. **Finish the report.** Append dispositions and final verifier results. Report only evidence observed
   this pass.

## Safety

- Preserve unrelated work and obey the project's worktree, guard, and task-state rules.
- Do not bypass a safety block, kill unrelated processes, change production data, or claim a green result without the named verifier.
- A reviewer or fixer needing authority outside the target stops and records the blocker.

## Report

Mode, scope, evidence sources, findings found/refuted/fixed, skipped items and reasons, checks run,
remaining risk, and the review artifact path.
