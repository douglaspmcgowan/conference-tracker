---
provenance: promoted-from-command:v1
name: craft
description: "Route substantial product, feature, interface, identity, and written house-style design work to an implementable, testable package."
when_to_use: "Use after brainstorming establishes intent, for substantial product, feature, interface, identity, or written house-style design; visible-interface implementation belongs to impeccable and built-surface critique to design-review."
disable-model-invocation: true
---

# Craft

Use craft after brainstorming establishes intent, for substantial product, feature, interface, identity, or written house-style design before implementation. Choose a visual language from the shared registry; visible-interface work loads `impeccable`, and built-surface critique loads `design-review`.

## Authorities and routing

Follow `DESIGN.md`, `.agents/design/LIBRARIES.md`, and `.agents/design/languages/registry.md`; do not duplicate their guidance here.

- `brandkit` — Use for an explicitly required identity or house-style package; canonical route: `.agents/skills/brandkit/`.
- `gpt-taste` — Use for a GSAP-motion landing page; canonical route: `.agents/skills/gpt-taste/`.
- `industrial-brutalist-ui` — Use for a raw mechanical interface; canonical route: `.agents/skills/industrial-brutalist-ui/`.
- `minimalist-ui` — Use for a clean, restrained interface; canonical route: `.agents/skills/minimalist-ui/`.
- `stitch-design-taste` — Use for Google Stitch design work; canonical route: `.agents/skills/stitch-design-taste/`.
- `voice` — Use to rewrite existing prose in Douglas's voice; canonical route: `.agents/skills/voice/`.
- `tune` — Use to calibrate active-voice guides; canonical route: `.agents/skills/tune/`.

Creation route — When registry classification says `new`, generate the language with `.agents/skills/hue/`.

## Orient

Read the target's `AGENTS.md`, `INTENT.md` when present, `PRODUCT.md`, `MAP.md`, and `DESIGN.md`. Inspect the running product and real code before proposing a change.

Resolve the user, their primary job, success signal, constraints, and scope. Ask a single batch of only the unanswered questions when collaboration is requested; otherwise record conservative assumptions in project task state.

## Produce the design package

1. State the problem, target user, non-goals, and measurable outcomes.
2. For a new product, compare a small number of materially different interaction models. For a brownfield feature, map existing navigation, components, tokens, data flow, and regression boundaries before choosing the smallest conforming addition.
3. Specify the primary flow, loading, empty, error, and permission states; information hierarchy; responsive behavior; accessibility; and content requirements.
4. Write or refresh the technology-agnostic acceptance specification with `spec`; leave implementation planning to `writing-plans`.
5. Name the touch list, test strategy, and rollout/rollback boundary. Route interface implementation through `impeccable` and an existing built surface through `design-review`.

## Execute or hand off

With `--plan`, present the package and stop. With explicit implementation authority, execute the agreed plan in small verified slices, using the repository's task-state system, preserving existing behavior, and updating durable docs in the same work unit.

The design must give an implementer a clear primary flow, boundaries, and acceptance evidence without inventing architecture or claiming untested polish. Verify browser-visible work in the assembled app.
