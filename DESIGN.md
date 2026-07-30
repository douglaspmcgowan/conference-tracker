# Project design rules

<!-- agent-harness:universal-design:v1:start -->
## Universal interface rules

- Never use IBM Plex Mono.
- Use a proportional body face for prose, navigation, labels, dates, names, and human-readable metadata.
- Reserve monospace for code, commands, identifiers, timestamps, and genuinely tabular numeric data.
- Define explicit body, display, and monospace roles. Use tabular numerals on the proportional face for aligned quantities.
- Establish hierarchy through size, weight, spacing, and placement before decoration.
- Give each screen a clear primary action or reading path. Use spacing and alignment to show relationships.
- Reuse existing tokens and components before adding variants.
- Cover relevant default, hover, focus, active, disabled, loading, empty, error, and success states.
- Use semantic structure and native controls, visible keyboard focus, logical tab order, accessible names, sufficient contrast, and non-color state cues.
- Support narrow, medium, and wide layouts, zoom, text resizing, touch targets, and reduced motion.
- Inspect the existing design system, screenshots, and implementation before proposing a new rule or component.
- Verify browser-visible work with browser or end-to-end tests across responsive, keyboard, loading, empty, and error behavior.
<!-- agent-harness:universal-design:v1:end -->

## Product-specific typography

- Body: the existing proportional interface face used for labels, prose, names, dates, and controls.
- Display: the existing masthead and section-display role defined in `server.js`.
- Monospace: code, machine-readable identifiers, and the existing `var(--mono)` treatment for timeline/table dates and genuinely tabular numeric metadata.

## Tokens and components

- Preserve the existing `--accent: #2D5BFF`, low-contrast hairlines, warm-dark palette, restrained grain, and four established timeline/card/table/map views.
- Reuse the existing filters, viewbar, status pills, countdown chips, modal, and responsive layouts before adding variants.

## Interaction and accessibility

- Preserve 120 ms hover-in and 240 ms hover-out timing, `:focus-visible` rings, reduced-motion support, touch targets, and mobile verification.
- Status and tier meaning must remain understandable without color alone.

## Exceptions

- Record a universal-rule exception only with the evidence and verifier that justify it.
