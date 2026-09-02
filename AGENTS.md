# Project instructions

This repository contract travels with the project for Claude, Codex, Cursor, and cloud agents.

<!-- agent-harness:portable:v4:start -->
<!-- agent-harness:portable:content 290c4a868c90a12e -->
**CONCISE, CONCISE. USE LESS WORDS. USE MINIMAL WORDS. IF I NEED MORE EXPLANATION, I'LL ASK.**

## Portable operating rules

**Every sentence is paid for on every future read. Write less.** Say a thing once, in the document that owns it, then stop. Cut whatever changes no reader's action — preamble, restating the request, a closing summary, a bullet list repeating the paragraph above it. Never cut a prohibition, a measured number, a path, a version pin, a named owner, or the failure a rule prevents; relocate those to their owner instead.

Use subagents immediately for every independent, file-disjoint workstream and keep destructive or dependent final gates serial. `.agents/CLUSTERING.md` owns unit selection and `.agents/DISPATCH-CHECKLIST.md` owns dispatch requirements.

Agents may create local commits for in-scope work without asking, and may push and merge freely **on a branch they own** — an `agent/*` or `cloud/*` branch they created — including merging the default branch into it to stay current. Pushing the default branch, merging into it, force-updating, discarding, deleting a worktree, or removing a task workspace still requires the user's explicit authorization for that action. Finish on your own branch and open a pull request; `.agents/DISPATCH-CHECKLIST.md` owns the reasoning and the measurement.

- **Answer questions and updates directly, justify challenged actions, and admit and diagnose errors.**
- **Runtime requires one visible message per turn. Silent is the smallest possible message: the artifact markdown link returned by `Resolve-CommunicationMode.ps1 -Mode silent`, and nothing else. Put substance in the artifact.**
- **WHEN I TELL YOU STUFF, TRACK IT — in `INTENT.md` or in task state.** Everything the user asks for is tracked automatically in the `task` skill or Work Scope state, so it can be recalled later.
- **Every question the user asks gets an answer in the turn it was asked, in chat, at the top.** Not in a file, not "see the status document", not deferred to the next turn because work was still running. If the answer is not yet known, that is the answer — say what is known, what is not, and what would settle it. ANSWER IMMEDIATELY, DO NOT WAIT.
- **Every request the user made and you finished gets named as finished, in that turn's final message, with any files worth opening (or that the user asked for).** One line each: what he asked for, that it is done, and the clickable repository-relative path — or the vault path, URL, or command when the result does not live in the repository. A finished request the user has to ask about twice was not delivered. This is a completion report, not a diff summary: list the things he asked for, not the files you touched. When a request is only partly done, say which part and what remains.
- **WHEN I ASK FOR A WORK UPDATE, UPDATE ME ON ALL OPEN, CLOSED AND PENDING WORK.**
- **Hard ceiling: 40 words per message, fewer whenever fewer will do.** Not a target. Does not bind a reply the user asked for.
- **NO WALLS OF TEXT. When giving a report, avoid long bouts about technical details.** Report like an employee updating a CEO: what has happened, the next steps, what they need to do, anything they absolutely need to know, and any unavoidable jargon defined in place. Detail belongs in the artifact that owns it, not in chat.
- **DON'T MAKE RANDOM BRIEFS OR OUTPUT FILES THAT AREN'T NECESSARY OR THAT NO ONE WILL READ.** Only when the user asks, or for a small update to a status file.
- **A unit counts only when its commit is reachable from the default branch and its pull request is closed.** A branch, a report, a simulation, a probe and a handoff all count as zero. Land one before starting the next.
- **A delegated agent's status is not its result, and a status label is never evidence.** Finished, succeeded, READY and green all say the agent stopped, not that it produced anything. Before counting delegated work, dispatching more on top of it, or reporting it to the user, verify the artifact itself: the branch exists on the remote, the diff is non-empty, the pull request is open. `.agents/DISPATCH-CHECKLIST.md` → **Before claiming anything** owns the measurement behind this rule.
- **Before logging a decision, try to make it from stated intent.** A blocker reaches the user only when their intent genuinely does not determine the answer.
- **A subagent thinks as much as its problem needs and emits nothing while working.** Every brief says so: no plan, no preamble, no progress commentary — only the final structured result.
- **Delegate to Codex. Spawn a Claude subagent only when the user asks for one.** When a review is needed, run one xhigh review pass, never a fleet.
- Answer questions first. Emit no text between tool calls EXCEPT these four, which always earn one: a completed task, a status update after a long stretch, a decision the user must make, and a direct answer to a question. The first three wait for the turn's final message. **An answer does not.** A question — including one sent mid-turn — is answered in the very next message you emit, before the work it interrupted resumes. **None of this brevity applies to thinking: think as much as the problem needs. These rules govern chat output, never how much you reason.** Tool calls of your own are for orchestration only — verify, check, steer — never production, which routes to subagents whose every brief demands zero narration. Durable reader-facing results follow `.agents/VAULT-PROTOCOL.md` → **7. Briefs**.
- Protocol routing: `.agents/ORCHESTRATION-PROTOCOL.md` owns session orchestration and conductor mode; `.agents/MAP.md` locates owners; `.agents/CLUSTERING.md` owns the unit of work and `.agents/DISPATCH-CHECKLIST.md` governs delegation; `.agents/DOCKET-PROTOCOL.md`, `.agents/VAULT-PROTOCOL.md`, and `.agents/WORKTREE-PROTOCOL.md` own their named surfaces; `.agents/SKILL-PORTABILITY-CONTRACT.md` owns cross-product skill reach.
- A decision, ruling, or blocker needing the user's judgment is recorded the moment it is found: as an open block in the active vault's `05 Decisions\<Project> - Open Decisions.md` when a vault is reachable, and in authoritative task state either way. Chat is not a queue, and the vault document is the record. `.agents/VAULT-PROTOCOL.md` → **8. Decisions — authored in the vault, answered in the vault** owns the block format, the stable id, and the sync; the ruling then goes to the owning project's `LOG.md` in the same work unit.
- Never invent facts, paths, APIs, versions, measurements, source content, credential state, or passing results. Verify inherited claims against repository, Git, runtime, or current primary evidence.
- Preserve unrelated changes, keep work within the request, and treat a plan request as plan-only. Inspect exact targets before destructive work, archive by default, and delete only with explicit direction. Preserve active application process trees and confirm before a whole-app restart. Never read, display, log, export, or commit credential values.
- Before creating, replacing, renaming, or removing an artifact, search the repository and available shared harness for its owner, equivalents, consumers, wiring, tests, and documentation. Extend the closest adequate owner, make the touch list, and record the result in authoritative task state.
- Resolve `~` and `$HOME` at runtime. Use the repository's tracked `.agents/` material when a fresh machine or cloud container has no `~/.agents`; do not vendor another copy. In the shared harness (`~/.agents/`, or `.agents/` in the harness repository): `INDEX.md` is the canonical skills catalogue, `WORKTREE-PROTOCOL.md` owns isolated worktrees, `VAULT-PROTOCOL.md` owns vault work, briefs, and decisions, `DOCKET-PROTOCOL.md` owns the Docket surface, which Douglas ruled dormant and which no work routes to, and `CLOUD-PROTOCOL.md` owns one Codex Cloud task from preflight through host verification. `.agents/manifests/capability-router.json` gives each delegation CLI its exact invocation; read it directly when no session hook surfaced it, and confirm the binary before dispatching, because its `present` flags describe whichever device generated the file. In that router, `agy` means Antigravity, Google's coding agent platform.
- Read a named or matching skill in full. Use `brainstorming` for creative or underspecified work, `test-driven-development` for implementation, `systematic-debugging` for bugs, and `requesting-code-review` plus `verification-before-completion` before completion. Route independent, file-disjoint work through `dispatching-parallel-agents`; use the `correct` skill for the narrowest verifiable safeguard after a recurring correction. Reproduce a reported failure and add a regression test when practical before fixing it. Never edit a third-party skill's body or frontmatter to add a local rule — that is what a projection-only overlay is for.
- Use one build loop: product or feature work starts from current specification; personal systems and one-off work use project intent plus observable acceptance. Materialize work, verify it, then re-read the resulting project state against the original intent; when they diverge, re-enter the loop at the earliest stale stage.

## Start and task state

1. Read this file, current task state, recent `LOG.md`, and `INTENT.md` when present.
2. Run `git status --short --branch`, inspect worktrees, then read `MAP.md` — including **Search surfaces** when looking for information — and `DESIGN.md` when relevant.

A project's remote is its truth. Pull before editing and treat work as unfinished while `git status` is dirty or `git log origin/main..HEAD` is non-empty.

3. Read the grouped whole open set before choosing work: `Get-WorkLanes.ps1` and `Add-ProjectIntake.ps1 -List` or generated `BACKBURNER.md` when enrolled, otherwise the `agent-harness:intake:v1` block. Reject with a reason and delete nothing to shrink a count.

If the exact project path `.agents/work/state.json` exists, Work Scope is enrolled and that structured file is authoritative. Load and follow the `work-scope` skill, including its guard, ownership, evidence, and handoff rules. Resolve those tools from `.agents/tools/` in the harness copy that skill loaded from, not from the skill package. Run `Test-WorkState.ps1`, `Get-WorkResume.ps1`, and `Reconcile-WorkState.ps1` before changing task state. `PROJECT.md`, `TRACKS.md`, `TASK.md`, `BACKBURNER.md`, and `LOG.md` are generated read-only views — never hand-edit a generated projection or view, change its canonical owner and rerun that owner's generator. Route work through `Test-WorkScopeGuard.ps1`, `Update-WorkState.ps1`, `Invoke-WorkScopeEvidence.ps1`, `Capture-WorkDiscovery.ps1`, and `New-WorkHandoff.ps1`; invalid state fails closed.

When `.agents/work/state.json` is absent, use the legacy task owners documented in `MAP.md`. File cross-project findings with `Add-ProjectIntake.ps1`; the target owns repair unless it blocks assigned work or Douglas redirects it.

**File a harness defect immediately, before the next tool call; never work around it; see `.agents/DISPATCH-CHECKLIST.md` for filing routes.**

## Safety and boundaries

- Do not infer authority for pushes, merges, force updates, deletions, credential use, spending, or publishing. On unattended work, record reversible assumptions and batch approvals rather than stopping safe work.
- Before vault work, read `VAULT-PROTOCOL.md` and the active vault's `IA.md`. Exclude vault-root `AI Reference\`, `40_Reference\AI Reference.md`, vault-root `26_Sensitive\`, `31_Business\Other People Reference.md`, and `Actual Documents\Identity` under the Google Drive root from reads, searches, globs, edits, links, mirrors, and delegated work. Only with Douglas's explicit authorization may a file move one way into `26_Sensitive\`; never read, open, list, enumerate, glob, grep, preview, diff, hash, link, mirror, back up, commit, copy, export, rename, restore, extract, or move anything out, and report only the source and destination folder.
- For interface work, follow `impeccable`, `DESIGN.md`, and `.agents/design/LIBRARIES.md`; use browser verification for visible changes. Update affected owners, run relevant and repository checks, finish with `git diff --check`, and list only files worth opening.

## What is managed here, and what is yours

Everything above the closing marker is generated from `.agents/templates/AGENTS.md` in the harness repository: change a portable rule there and re-render with `Manage-Harness.ps1 -Action EnsureProject`, never by editing this file. There is no size ceiling on this contract, by Douglas's ruling recorded in `INTENT.md`; `Test-ContractBudget.ps1` gates its shape — history and dated claims belong in their owning document, not here — its presence, the session's total loaded bytes, and the skill-package count, and measures everything else without gating it. Everything below the marker is project-owned: identity, real commands, local boundaries, and product adapters.
<!-- agent-harness:portable:v4:end -->

## Project identity

- Name: `conference-tracker`
- Purpose: Track research-conference deadlines, requirements, locations, personal notes, and submission status through a deployed Express application.
- Default branch: `main`

## Commands

- Setup: `npm ci`
- Test: `node tests/verify-live.mjs http://localhost:3010` after starting the local server
- Lint: `node --check server.js` and `node --check scripts/refresh-data.js`
- Build: `N/A — the Express application has no build step`
- End-to-end: `node tests/verify-live.mjs`

Record the actual command or observable proof in authoritative task state: Work Scope evidence when enrolled, or legacy `TASK.md` → `Verification` otherwise.

## Project-specific rules

- Treat `data/conferences.js` as generated output; edit the research inputs and run `node scripts/refresh-data.js`.
- Preserve the single-file Express application architecture unless a scoped task explicitly changes it.
- Browser-visible changes require the Playwright verifier against the affected local or deployed surface.

## Product adapters

- Claude loads `CLAUDE.md`, which imports this file.
- Codex loads this file.
- Cursor loads `.cursor\rules\00-project-contract.mdc`, which points here.

When the local shared harness exists, also follow `~/.agents/AGENTS.md`. Repository rules supply the portable fallback for cloud sessions.
