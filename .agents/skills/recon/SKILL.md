---
name: recon
description: "Map a field, mirror what Douglas already does, and hand him a Have/Partial/Gap comparison plus forward paths."
when_to_use: "Use to recon a tool, strategy, workflow, or practice before adopting it. deep-search only researches; compare-options only weighs named finalists; modernize checks one codebase against the harness. recon ends at a decision, not a deliverable."
disable-model-invocation: true
provenance: promoted-from-command:v1
---

# /recon [topic] [--auto | --babysit | --capability-report]

Use `--capability-report` when the requested result is a technical capability's definition, boundaries, maturity, readiness, standards and dependencies, constraints, risks, gaps, and implementation path rather than a comparison against Douglas's current setup. Define the audience, decision, scope, and evidence standard; verify links and citations; distinguish evidence from inference and source-age limits. Skip the Mirror and mode-choice phases, then report readiness gates, recommended experiments, and remaining uncertainty through the same durable brief route below.

Reconnaissance before adoption: map the field, hold it against what Douglas already does, and hand him
(or take) the next move. It is the front half of a build and ends at a decision, not a deliverable,
unless run in auto mode.

**Mode.** `--auto` or `--babysit`; **default babysit.** With no flag, infer from phrasing — "just do it",
"you decide", "set it up" means auto; "surface to me", "walk me through" means babysit. When genuinely
unclear, default to babysit and say so.

The four moves: **Landscape** (research the field) → **Mirror** (read what he actually does) →
**Compare** (Have/Partial/Gap) → **Paths** (forward options; in babysit the choice is his, in auto it is
yours).

## Phase 0 — Frame

One or two lines: what he is adopting or improving, why now, and the mode. Ambiguous topic in babysit →
ask <=3 questions in one message. In auto → pick the most useful reading, state the assumption, proceed.

## Phase 1 — Landscape

Run or invoke `deep-search`: fan out queries, deepen iteratively. **Prefer human practitioner sources** —
Reddit/HN, Simon Willison, Every.to, Mollick, Latent Space, vendor engineering blogs, the actual tool
docs. Cross-verify factual claims with >=2 sources; mark **[single-source]** otherwise; hedge uncited
numbers as "roughly". Web-check anything that may have changed since the knowledge cutoff.

Identify **6-12 distinct approaches**. For each: **Name** · **What it is** (2-3 sentences) · **Best at** ·
**Limitation or cost** · **Who uses it / tooling** · **Sources** (1-3 URLs).

Dispatch research subagents through `dispatching-parallel-agents` for a wide sweep rather than
serializing it.

**Sensitive or classified topics stay local — no open web.** Tooling and personal topics allow web.

## Phase 2 — Mirror: read his setup, never guess

Before comparing, read his actual setup for this topic and summarize it honestly, **citing files**:

1. `~/.agents/INDEX.md`, canonical `~/.agents/skills`, and project skill roots
2. `~/.agents/hooks/` (repository fallback: `.agents/hooks`, source `.agents/task-hooks/hooks`), `settings.json`, `CLAUDE.md` / `CLAUDE-*.md`
3. `~/.agents/feedback/FEEDBACK-LOG.md` and the project's `MEMORY.md` when present
4. The relevant Obsidian vault folders
5. For a code topic: the repo's `AGENTS.md`, `README`, Work Scope state or legacy `TASK.md`/`LOG.md`

Every claim ties to a file. **Never fabricate his current practice** — if you cannot find it, say so.

## Phase 3 — Compare

One row per strategy, reusing the `compare-options` table:

| Strategy | Best at | Uniquely offers | Can't do / weakest | You already have it? |
|----------|---------|-----------------|--------------------|----------------------|

The last column is the point: **Have / Partial / Gap**, plus the file or skill that proves it. Be honest
about Partials — that is usually where the leverage is.

## Phase 4 — Mode gate

**Babysit (default).** Present in order: what it is → landscape → comparison table → a **dive-deep
shortlist** of 3-5 highest-leverage Gaps and Partials, one line each with the reason. Then **STOP and ask
which to pursue. Build nothing.**

Alongside the shortlist, offer an options-comparison pass before committing: "want me to run
`compare-options` on the top N before we pick?" If yes, run it on those candidates and return to the
steering question. recon maps the field, compare-options weighs the finalists, the pick stays his.

Render a self-contained HTML comparison only when it materially improves the decision: one card per
option with key metadata, a small diagram, and a when-to-use line, plus a top search/filter, verified to
load with no console errors. The comparison table is the durable evidence.

**Auto.** Pick the **1-3 highest-leverage moves yourself**, stating the selection criterion (for example
"biggest gap x lowest cost x touches an active workstream"). Produce a concrete plan, build it, loop to a
verifiable end, and report once at completion. "Build it" means whatever the chosen move actually is — a
hook tweak, a memory file, a config change, a habit — scoped to that move only. **recon never assumes the
move is "build a new skill"**; most recon topics are not.

If the chosen move *is* building a new capability (the topic itself was "find or build me a tool that
does X"), hand off to `skill-creator` for design and `writing-skills` for implementation and validation.
recon's role stops at naming the move.

## Phase 5 — Paths forward (both modes)

End with **2-4 concrete paths**, each as: the move · the 5-minute first test that validates it · the cost
or risk · which active workstream it touches.

## Operating constraints

- **Read before comparing.** Cite the file or URL behind every claim about a strategy or about his setup.
- Use "reportedly" or "roughly" for single-source or uncited numbers.
- **Babysit builds nothing. Auto makes surgical changes only**, each traced to the chosen move.
- **Platform filter: Douglas is on Windows.** A tool that is not usable on Windows is not a real option —
  drop it or flag it "not Windows-usable". Verify platform support before recommending.
- **Deprecated filter:** anything deprecated, sunsetting, or superseded stays out of the options and the
  main comparison. One-line aside — "deprecated, skipped (use X instead)" — and move on.
- When the recon is substantial and durable, write the brief to the vault `Outputs` owner and create its
  Authored vault brief at the placement defined by `VAULT-PROTOCOL.md`.

## Output contract

Frame and mode · landscape with sources · mirror with every claim cited · comparison table with
Have/Partial/Gap · babysit shortlist plus the steering question, or auto's chosen moves and what was
built · paths forward.
