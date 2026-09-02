---
name: hone
description: "Measure, isolate, and verify one performance improvement at a time; keep only gains proven against a baseline."
when_to_use: "Use for measured performance work: 'make it faster', 'profile and speed it up', 'where is the bottleneck', '/hone'. Covers application, build, CAD, solver and kernel-bound work. Route browser rendering and Web Vitals to impeccable, test quality to probe."
disable-model-invocation: true
provenance: promoted-from-command:v1
---

# /hone [target] [--mode plan|auto] [--max-iterations N] [--budget "<time/memory goal>"] [--read-only]

Performance work is an evidence loop: establish a representative baseline, identify one hot path,
change one authoritative owner, and keep the change only if repeated measurement proves the intended
gain without a regression.

**Plan** inspects, measures, and returns ranked candidates without editing or creating a worktree.
**Auto** runs the loop one candidate at a time, in an isolated worktree where the repository
supports one and otherwise only with the owner's approval. **Read-only** returns a tested diff and
measurements without applying them.

## Procedure

1. **Resolve the target and success metric.** Name the command or scenario, representative input,
   hardware and runtime constraints, and requested budget. Inspect existing benchmarks, profilers,
   performance notes and open work before adding a new harness.
2. **Establish a baseline.** Run the target at least three times under comparable conditions. Record
   raw observations, median, dispersion, command, revision, input and environment. Stop if the
   measurement is noisy enough that the requested gain cannot be distinguished.
3. **Classify the bottleneck before changing code,** from profiler or trace evidence: algorithmic
   complexity, I/O or network wait, allocation and GC, lock contention, database or query,
   build and toolchain, rendering, serialization, or CAD/solver/kernel. For CAD and kernel work,
   inspect operation ordering, tree shape, rebuild caching, tolerance, constraint convergence, and
   batched geometric queries.
4. **Run the wrong-tool gate.** Stop and recommend the narrower fix when a cache setting, query
   index, build configuration, better input, existing library, or product setting addresses the
   measured wait more safely than a code change. Never optimize an unmeasured complaint.
5. **Rank candidates.** Each names the measured cause, expected effect, affected files, risk,
   rollback, and focused behavioral check. Take the lowest-risk candidate on the measured hot path;
   never batch unrelated optimizations.
6. **Trial one change in isolation.** Preserve the starting revision and target state, make the
   smallest change, run focused functional tests, then rerun the exact baseline scenario under the
   same conditions. Clean up temporary processes and worktrees either way.
7. **Verify a keep.** A candidate counts only when repeated measurements show a material gain over
   the baseline, target tests pass, and no stated resource, correctness or maintainability guard
   regresses. Discard an inconclusive or negative trial and record why.
8. **Apply deliberately.** In auto mode, apply a verified keep through the repository's normal
   ownership path, rerun the focused test and representative measurement on the intended branch, and
   leave unrelated work untouched. Do not commit unless separately authorized.

Route task state, evidence and adjacent findings through the project's authoritative owner. When
`.agents/work/state.json` exists the structured state is authoritative, the generated read-only views
`PROJECT.md`, `TRACKS.md`, `TASK.md`, `BACKBURNER.md` and `LOG.md` are never hand-edited, and the
`work-scope` skill owns its tools; otherwise use the legacy task files.

## Safety and stop conditions

- Never claim an improvement from a single run, a profiler screenshot, or a changed file.
- Never alter production configuration, production data, or performance budgets without authority.
- Never remove an existing benchmark or test to improve a score.
- Stop for missing representative input, an unstable baseline, an unisolated dirty target, or a gain
  smaller than measurement noise. Report the evidence and the smallest next experiment.

## Report

Target · baseline command and samples · bottleneck evidence · candidate tried · focused test result ·
post-change samples · median comparison · verdict of **kept**, **discarded**, or **inconclusive** ·
any environmental limitation and whether temporary resources were removed.
