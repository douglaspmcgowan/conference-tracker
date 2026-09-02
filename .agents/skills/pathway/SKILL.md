---
provenance: promoted-from-command:v1
name: pathway
description: "Run a named, ordered chain of existing skills from the pathway registry against one target."
when_to_use: "Use only when the user names an existing chain in the pathway registry and a target. Not for inventing a sequence: review routes a single review, and dispatching-parallel-agents runs independent work."
disable-model-invocation: true
---

# Pathway

Pathway orchestrates existing skills; it never duplicates their workflows.

1. Read the chain registry at `~/.agents/skill-pathways.json`; in a repository-owned harness use its
   `.agents/skill-pathways.json`. Resolve the requested chain and target; list valid chains if either is
   missing.
2. Read any recorded run state through the repository's current task-state mechanism. When
   `.agents/work/state.json` exists the structured state is authoritative, the generated read-only views
   `PROJECT.md`, `TRACKS.md`, `TASK.md`, `BACKBURNER.md` and `LOG.md` are never hand-edited, and the
   `work-scope` skill owns its tools; otherwise use the legacy task files. If the exact chain and target
   are already complete, report that evidence and stop.
3. Run steps in declared order. Give each step the target, prior outcomes, scope boundary, and its own
   verification responsibility. Parallelize only steps proven file- and state-disjoint.
4. Record outcomes through the active task-state owner. **Do not create a second cache or pointer file
   beside it, and do not create a pathway-specific hook or a product-specific hook copy** — the lifecycle
   hook source is `.agents/task-hooks/hooks/task-state-dispatch.js` and it already surfaces canonical
   task state.
5. Stop on a safety, authorization, or blocking decision; continue independent safe work where possible.

Report the chain, target, completed/skipped/blocked steps, evidence, and the exact resume point.
