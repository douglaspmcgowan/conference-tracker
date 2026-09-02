---
provenance: "douglas-core"
name: deep-search
description: "Multi-step cited web research for open questions needing 3+ sources. Not compare-options (named candidates) or vault-ingest (writes to vault)."
---

Reach for this skill before designing a mechanism when research will shape what gets built.

# /deep-search

## Phase 1 — Clarify (skip if the query is already unambiguous)

Ask 1–3 targeted questions: scope, recency requirements, depth, and what a good answer looks like. **Do not browse until the user confirms or says "just go."**

Research then runs in three stages, each informed by what the previous one actually found rather than a pre-planned query list.

## Stage 1 — Orient (3–5 queries, one parallel message)

Get the lay of the land: the main angles, camps, and open debates.

- At least one query is contrarian or skeptical ("why X doesn't work", "criticisms of X", "X downsides").
- At least one targets community or practitioner sources: `site:reddit.com`, `site:news.ycombinator.com`, or a known practitioner blog.
- After reading, write a brief **orientation note** — not the final answer: the 3–5 most interesting threads, what is already clear, what is still murky.
- **If the output is a file or report, write the stub file NOW** with section headers. A stream-idle timeout during later stages otherwise erases everything; an early stub survives it.

## Stage 2 — Directed deep dives (typically 5–10 queries, in parallel)

Go deep on the threads Stage 1 showed to be valuable. Scale the fan-out to complexity — a narrow question may need 4–5 queries, a broad comparison 8–10. Don't repeat covered ground or chase dead ends.

**Prioritize human-authored sources over vendor docs and SEO content:**

- `site:reddit.com` plus topic, especially r/ClaudeAI, r/LocalLLaMA, and topic-specific subreddits
- `site:news.ycombinator.com` plus topic
- Practitioner blogs: Simon Willison (simonwillison.net), Ethan Mollick (oneusefulthing.org), Latent Space, Every.to, Dan Shipper, Jesse Vincent (blog.fsck.com), Addy Osmani, Anthropic and OpenAI engineering blogs
- X/Twitter posts from credible practitioners, and YouTube breakdowns from technical practitioners rather than ad-driven review channels

For subjective questions — reviews, comparisons, "which is better", "what do people prefer" — human-written posts and comments from credible people are PRIMARY sources, not supporting evidence. A thoughtful Reddit comment from an experienced user often carries more truth than a vendor landing page. Weight accordingly.

WebFetch the 5–8 most promising URLs in parallel, preferring primary sources, peer-reviewed papers, .gov/.edu, first-party engineering blogs, credible practitioner posts, and high-signal Reddit/HN threads. Skip SEO listicles, AI-generated summary sites, and content farms.

After reading, update the synthesis — confirmed by ≥2 sources, single-source only, still open — and re-write the stub file.

## Stage 3 — Gap-fill and triangulate (optional)

Run it only when (a) a key claim has one source, (b) a sub-question is still unanswered, or (c) two sources contradict each other and it matters. Issue 2–6 targeted queries aimed at exactly the gaps, never broad re-coverage. Finalize the synthesis and re-write the report file.

## Synthesize with inline citations

- Attach a URL to EACH factual claim inline — `[per source](url)` — never a bibliography at the end.
- Flag single-source claims explicitly: "single source, unverified: …".
- Flag contradictions explicitly; never pick a winner silently.
- For subjective questions, quote human practitioners verbatim where possible.
- Close with a "Sources" list grouped by primary / practitioner / community.

## Execution model

**Inline** when total web calls are ≤12 across all stages and Stage 3 is not needed — that fits one API stream window. **Dispatch to the product's subagent mechanism** when calls exceed 12, Stage 3 adds significant fetches, or the primary context must stay free; encode all three stages in the brief and require incremental durable writes. Continue inline when the product has no subagent mechanism. A sub-agent that times out cannot be resumed — work not written to disk is lost.

## Gotchas

- WebSearch is US-only and runs inside a single API call.
- Long active runs (~15+ min of continuous tool use) can hit API stream-idle timeouts; the session dies without flushing output. Mitigate with smaller fan-outs, background dispatch, and writing the report file after each stage.
- WebFetch is public URLs only — Google Docs, private GitHub, and Confluence fail. Use the `gh` CLI for GitHub.
- Results are cached 15 min per URL; re-fetches inside that window are free.
- Cross-host redirects are NOT auto-followed; re-fetch the new URL.
- When the user asks about a product or feature, always search before claiming it does not exist.
