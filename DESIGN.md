# Project design rules

<!-- agent-harness:universal-design:v1:start -->
## Universal interface rules

The authority is `~/.agents/DESIGN.md`, and it is fuller than this. What follows is
carried here rather than only linked because a cloud or container session has no
`~/.agents` to reach — so the rules that actually change what gets built have to survive
in the repository itself.

### Anti-default discipline

Quoted verbatim from the authority rather than paraphrased, because this is the section an
agent most needs and a paraphrase is a second copy that drifts.

The model's house style is recognizable, and reaching for it reads as machine-made. Never
default to: purple-blue gradients, a centered hero over a dark mesh background, three equal
feature cards, ubiquitous glassmorphism, or Inter with slate everywhere. The
beige-brass-espresso "premium consumer" palette is the same tell; rotate off it.

- Lock one accent color page-wide, and one gray family per project.
- Lock one corner-radius system per page. Mix radii only under a rule you can state.
- Keep one theme per page. Sections do not invert light and dark mid-scroll except as a single deliberate composition device.
- A section layout family appears at most once per page. At most two consecutive image-text zigzag splits.
- **No eyebrow labels and no kicker titles on any page, deck, or artifact.** An eyebrow or kicker is the small uppercase or letter-spaced label above a heading; the heading carries its own weight, so delete the label. Ruled 2026-09-30.
- **Never use the middle dot `·` (U+00B7, `&middot;`) or the bullet `•` as an inline divider.** Separate inline items with a semicolon, `|`, a comma, or a line break. The em-dash stays banned as a divider. Ruled 2026-09-30.
- Where a brief reads as an established design system, use that system's official package rather than approximating it. One system per project.
- The brief wins. Honor a pinned aesthetic even when it is not the choice you would make; redirecting a clear brief toward your own taste is failure, not judgment.

### Names that appear here only to be forbidden

The rules above and below name specific typefaces in order to ban them. A project that
scans its own source for banned font names will find those names *here* and report this
file as the violation — measured on `base-flight-finder`, 2026-08-07, whose typography
policy test failed against text whose whole purpose is to forbid the thing it names.

**If you write such a scan, exclude the region between the two `agent-harness:universal-design`
marker comments.** That region is generated and is replaced wholesale on every sync, so
nothing a project owns ever lives inside it. The names are also declared machine-readably
on the next line, so a scanner can subtract them without parsing prose. `Test-DesignBlockScanSafety.ps1`
fails the build if any of them appears outside the markers, which is what makes the
exclusion sufficient rather than merely conventional.

**Match on word boundaries, not substrings.** `Inter` is a prefix of interaction,
interface, internal and interval, so a bare substring scan reports a violation on ordinary
English. That is a second, independent cause of the same false positive, and it lives on
your side of the line rather than in this block — the check above hit it on its own first
run, against the heading "Interaction and accessibility" a few sections down.

<!-- agent-harness:design-prohibited-names: IBM Plex Mono, Inter, Fraunces, Instrument Serif -->

### Everything else

- Never use IBM Plex Mono.
- **Never set anything in a monospace typeface unless it is code.** Not numbers, not labels, not reference tags, not captions, not credits, not timestamps. Monospace outside a code block is a costume that says "technical" and reads as machine output. Numerals that need to line up get `font-variant-numeric: tabular-nums` on the normal face instead.
- **Never use the middle dot as a separator.** No `·`, and no bullet character standing in for it. Separate with an en dash, a slash, a comma, or plain whitespace with a rule. The middle dot reads as machine-assembled metadata everywhere it appears, which is why it is out on every surface, not just decks.
- **Never write a line that is only "The" plus a noun.** "The transfer function", "The result", "The problem" — a bare definite noun phrase standing alone is the most common shape in machine-written copy and carries no more information than the noun alone. A title may open with "The"; a label, a bullet or a caption may not be one.
- **Never title anything as a noun followed by a rhythmic tag.** "The argument, rung by rung", "The story, piece by piece", "Design, from the ground up". The tag adds cadence, not meaning, and it is the tell that a title was composed rather than named. Title the thing by what it is.
- **A reference shown to a reader must be identifiable without the source document.** A bare bracket number or a bare superscript means nothing to someone who does not have the bibliography open, which on a slide or a poster is everyone. Name the author and year, and put the numbering in a source line if the numbering itself matters.
- Default to a sans display face. Use serif only with an articulated reason; `Fraunces` and `Instrument Serif` are banned as defaults specifically because they are the common machine-made choice.
- Hero discipline: the hero fits the first viewport, the headline runs at most two lines, subtext stays under roughly twenty words, and no more than four text elements sit inside it. Trust marks and logo walls go below the hero, never in it.
- A grid has exactly as many cells as there is content for. Reshape the grid rather than pasting in a blank tile.
- Every animation names what it communicates — hierarchy, sequence, feedback, or state change. An animation that names nothing gets cut.
- Reread every visible string before shipping. Never invent a precise-sounding number.
- Use a proportional body face for prose, navigation, labels, dates, names, and human-readable metadata.
- Reserve monospace for code and commands only, and set it in a code block. Identifiers, timestamps and numeric columns take the proportional face.
- Define explicit body and display roles, and a monospace role only where the surface actually renders code. Use tabular numerals on the proportional face for aligned quantities.
- Establish hierarchy through size, weight, spacing, and placement before decoration.
- **Use all-caps titles, labels, and headings very, very sparingly, only when absolutely necessary.** Uppercase letters and `text-transform: uppercase` both count; the default is sentence case. Ruled 2026-09-30.
- Give each screen a clear primary action or reading path. Use spacing and alignment to show relationships.
- Reuse existing tokens and components before adding variants.
- Cover relevant default, hover, focus, active, disabled, loading, empty, error, and success states.
- Use semantic structure and native controls, visible keyboard focus, logical tab order, accessible names, sufficient contrast, and non-color state cues.
- Support narrow, medium, and wide layouts, zoom, text resizing, touch targets, and reduced motion.
- A design skill's silence on accessibility is not an exemption. Seven of the sixteen design-adjacent skill packages carry no accessibility content at all, so the two bullets above are the floor whichever skill is driving.
- A visual world is chosen, not accumulated. Template packs, style presets, and named aesthetics contradict each other by construction — `retro-windows` bans every rounded corner where `capsule` requires a 9999px radius. Commit to one, take its taste entire, and treat the others as unread. The rules here apply to all of them.
- Inspect the existing design system, screenshots, and implementation before proposing a new rule or component.
- Verify browser-visible work with browser or end-to-end tests across responsive, keyboard, loading, empty, and error behavior.

### Design libraries

Concrete things to reach for — animation packages and working skeletons, icon kits, typeface pools, design-system install commands and canonical documentation. Read the leaf you need; each one loads on its own.

- **Index** `~/.agents/design/LIBRARIES.md`
- **Precedence and routing** `~/.agents/design/precedence.md` — which source wins when the universal rules, `impeccable` and a pinned brief disagree, and whether this project's design detector hook is actually wired
- **Stack templates** `~/.agents/design/STACK-TEMPLATES.md` — seven app-kind templates naming an occupant for all 22 stack slots, and the per-slot deviation rules. The selection itself belongs to `~/.agents/skills/stack/SKILL.md`: six observable questions, the scaffold, and `architecture.md`'s import direction. Enter there before choosing a framework, styling method, primitive layer or component source, and read the result in this file's `## Stack selection`; `solo-review` stack mode measures a real repository against it
- **Motion** `~/.agents/design/animation/` — `libraries.md`, `sticky-stack.md`, `horizontal-pan.md`, `scroll-reveal.md`, `liquid-glass.md` (frosted glass), `forbidden.md`
- **Icons** `~/.agents/design/icons/libraries.md`
- **Type** `~/.agents/design/type/families.md`
- **Design systems** `~/.agents/design/systems/install.md` and `sources.md`
- **Design languages** `~/.agents/design/languages/registry.md` — read it before committing a visual world or generating a new design language, and register the world committed for this project there in the same work unit
- **Surface craft** `~/.agents/design/craft/` — `high-end.md` (surface construction), `from-reference.md` (building faithfully from a reference image), `from-code.md` (reading a design system out of a live product's own CSS), `device-mockups.md`
- **Fundamentals** `~/.agents/design/fundamentals.md` — the arithmetic under a decision: palette construction (60-30-10, one accent, warm neutrals, the colourblind-safe sets and the grayscale test), type-scale ratios with a worked scale and measure, and grid selection. Read it when the palette or scale is not already decided
- **Slides and posters** `~/.agents/design/slides-and-posters.md` — the only leaf addressing a non-web medium: deck frameworks, PowerPoint craft, HTML deck frameworks, and the academic poster including A0 sizing and the ≥24pt body floor
- **Pre-ship matrix** `~/.agents/design/preflight.md` — the mechanical finish check for landing, marketing and portfolio surfaces; not dashboards, not product UI
- **Dashboards and data-dense product UI** `~/.agents/design/dashboards.md` — the full system for the surface this tree used to leave uncovered: the three dashboard kinds and why building one while thinking of another causes most of the mistakes, information architecture and the three reading distances, density targets set against marketing spacing, typography and colour for data (sequential, diverging, categorical and semantic scales), chart selection ordered by the Cleveland-McGill perceptual ranking, chart and table craft, the six states every data region has, filters and URL state, interaction, real-time cadence, renderer choice by point count, the charting-library table, the anti-patterns, and a §18 pre-ship matrix that is the entry above's equivalent for this medium. This line used to say the tree did not own dashboards and pointed at the `/design-review` rubric, which critiques a running app rather than generating one; that gap closed on 2026-08-09
- **Mobile, touch and responsive** `~/.agents/design/mobile.md` — the medium, not a surface type: the three kinds of mobile thing and why a responsive site should not get a bottom tab bar, the viewport and its moving parts (`svh`/`lvh`/`dvh`, `viewport-fit=cover`, `env(safe-area-inset-*)` with the `max()` fallback that is the part people omit), the three touch-target floors — WCAG 2.2's 24px, Material's 48dp, Apple's 44pt — and which to design to, thumb reach and what it decides, mobile type including the 16px threshold below which iOS zooms a focused input, breakpoints and container queries, navigation patterns, forms with `inputmode`/`autocomplete`/`enterkeyhint` and the keyboard that covers your action bar, the gestures the OS has already reserved, the states that do not exist without a pointer, scrolling, the motion budget on a mid-tier device, images, offline, touch accessibility, the anti-patterns, a §18 pre-ship matrix, and §19 on the four checks emulation cannot answer. It does not restate `impeccable`'s `reference/adapt.md`, which owns converting an existing surface between contexts
- **Production readiness** `~/.agents/design/ADVISOR-PRODUCTION-READY.md` — what still stands between the design-space explorer and the Work Scope graph and real use
- **Design-space explorer** `~/.agents/design/design-space-explorer/README.md` — the reusable two-axis combination explorer, its intent, specification, design rules, and inspection record
- **Design-space manifests** `~/.agents/design/design-spaces/README.md` — the reusable schema for design-space axes, entries, palettes, templates, and generated-axis sources
- **Mission-control design studies** `~/.agents/design/mission-control/AESTHETIC-OPTIONS.md` and `REPRESENTATIONS.md` — visual-world and information-representation options for that surface

The full universal rules are `~/.agents/DESIGN.md`. Where a library entry and a rule disagree, the rule wins.

**This list is enumerated because it has to be.** A cloud or container session has no `~/.agents` to walk, so this block is the only routing it gets — which also means a leaf missing here is a leaf that session cannot reach at all. `craft/` and `preflight.md` were absent until 2026-08-07 and every project copy inherited the gap. `Test-DesignLibraryIndex.ps1` now fails the build when this list falls behind the tree.
<!-- agent-harness:universal-design:v1:end -->

## Design system: Stint

Decided 2026-10-04. Case: **replace**. The previous identity (warm paper and espresso ground, blue accent, grain, pill chips) is the beige-brass-espresso palette the universal rules name as a machine-made tell, and it was shared with another project. Its domain ideas survive: the stripe per field, the deadline calendar, the four views. Everything below supersedes the earlier typography, token and interaction sections of this file.

- **Direction:** Stint. A tracker that does not pretend: what is due, how far away, what it requires. Deadpan copy, no celebration, the data is the hero and the title is not.
- **Pulled from:** hue language Stint, `~/.agents/skills/hue/examples/stint/design-model.yaml` (reference renders `app-screen.html` beside it and `C:/Users/dougl/Projects/design-worlds/worlds/stint/spec.html`); registry row in `~/.agents/design/languages/registry.md`.
- **Departures from the source, each because a universal rule wins:** Stint's Inter becomes Onest; its JetBrains Mono for metrics becomes tabular numerals on Onest; its mesh hero and device mockup are dropped (this is a tool, not a landing page); its stock slate neutrals are re-tinted toward violet (hue 282); its Phosphor fallback becomes Tabler outline, whose sharp geometric stroke matches Stint's stated icon style.
- **Wrong if:** the tracker is embedded in a daylight university page. Then the light token set becomes the default and nothing else changes.
- **Stack:** unchanged. Express renders one HTML string from `server.ts`; CSS is `getCSS()`, client script is `getJS()`. No framework, no build step, no component package. The system is plain custom properties.

### Colour

Every colour is a custom property on `:root`. Dark is the default; light is the same names redefined under `@media (prefers-color-scheme: light)` and `[data-theme="light"]`; `[data-theme="dark"]` restates dark so an explicit choice beats the media query. No component carries a per-theme override.

| Token | Role | Dark | Light |
|---|---|---|---|
| `--ground` | page background, on `body` | `#0C0B14` | `#F4F3F9` |
| `--surface-1` | rows, cards, toolbar, inputs | `#15131F` | `#FCFBFF` |
| `--surface-2` | popover, tooltip, modal, hovered row | `#1E1C2C` | `#E9E7F2` |
| `--surface-3` | pressed and selected fills, calendar empty cell | `#2B2940` | `#DAD7E8` |
| `--line` | hairline between rows and regions | `#3A3756` | `#B4B0CC` |
| `--line-strong` | control borders (3:1 against every surface) | `#75729A` | `#7C7899` |
| `--text-1` | names, values, headings | `#F1F0F8` | `#12101C` |
| `--text-2` | secondary text, labels | `#B6B3CA` | `#4A4761` |
| `--text-3` | tertiary text, closed deadlines; never on `--surface-3` | `#918EAA` | `#625E7C` |
| `--accent` | stint violet as text, focus ring, active tab, today marker | `#9A90F2` | `#4B3CC0` |
| `--accent-solid` | filled primary button and selected chip, white text | `#6456E0` | `#6456E0` |

Status tokens are separate from the accent and never share its hue. Each is paired with a word or icon, never colour alone.

| Token | Meaning | Dark | Light |
|---|---|---|---|
| `--status-urgent` | deadline in 14 days or fewer; rejected | `#FF8370` | `#B3261E` |
| `--status-soon` | deadline in 15 to 45 days; drafting | `#E5B454` | `#7A5200` |
| `--status-ok` | accepted | `#62CB93` | `#1E6B45` |
| `--status-info` | interested, submitted | `#6FB6E8` | `#1F5F8F` |

A deadline further out than 45 days uses `--text-1`; a passed deadline uses `--text-3` and the word "closed". Tinted fills are derived, not new tokens: `color-mix(in oklab, <token> 16%, var(--surface-1))`.

Measured contrast (WCAG ratio, computed 2026-10-04): `--text-1` 16.21 dark and 18.25 light on `--surface-1`; `--text-2` 8.99 and 8.62; `--text-3` 5.81 and 5.97 on `--surface-1`, 5.29 and 5.04 on `--surface-2`, 4.45 and 4.36 on `--surface-3` (hence the ban there); `--accent` 6.68 and 7.53 on `--surface-1`; white on `--accent-solid` 5.32; every status token at least 5.85 dark and 4.63 light on all three surfaces; `--line-strong` at least 3.68 dark and 3.43 light.

Field colours (`--field-*`, 14 of them) are a categorical data scale, not interface colour. They appear only as a 4px stripe, an 8px dot, a calendar cell fill and a map marker, always beside the field's name. They are re-tuned to one lightness and chroma band per theme and kept at least 20 degrees of hue away from 282 so no field reads as the accent. Field tags are text on `--surface-2` with the dot; the filled coloured tag is retired.

### Type

- One family: **Onest** (SIL Open Font Licence), weights 400, 500, 600, loaded from Google Fonts: `https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap`, with the two preconnects already in the head. Fallback stack `system-ui, sans-serif`. `--mono` stays defined for the `code` element only; no screen renders code.
- Roles: display is Onest 600; body is Onest 400; labels and controls are Onest 500. Dates, counts and countdowns use `font-variant-numeric: tabular-nums`.
- Scale ratio 1.25 from a 16px body. Three tokens, three sizes on any screen:

| Token | Value | Use |
|---|---|---|
| `--fs-sm` | `0.8rem` (12.8px) | labels, metadata, table headers, chips |
| `--fs-base` | `1rem` (16px) | body, names, row countdowns, controls |
| `--fs-display` | `clamp(2rem, 1.6rem + 1.1vw, 2.441rem)` (32 to 39px) | page title, the next-deadline number, modal title |

  The display floor is 32px rather than the ratio's 31.25px so the largest heading is twice the body size.
- Line height 1.5 body, 1.3 labels, 1.1 display. Letter spacing 0 on body, `-0.02em` on display. Measure capped at `--measure: 65ch`.
- Sentence case everywhere. No uppercase, no italic emphasis, no eyebrow labels. The italic ampersand in the title is removed.

### Spacing, radii, elevation

- Spacing scale, base 4: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 64px. No other spacing value appears in the stylesheet. Inside a group use 1 to 3; between groups 4 to 5; between regions 6 to 8. Section padding is `clamp(var(--space-4), 4vw, var(--space-6))`.
- Radii, growing with the size of the thing: `--radius-1` 4px (tags, calendar cells, tier badge), `--radius-2` 6px (buttons, chips, inputs, select), `--radius-3` 8px (cards, popovers, tooltip), `--radius-4` 12px (modal). The field dot is the only circle. No pill radius: chips are 6px rectangles.
- Elevation, one treatment per level and never a hairline and a shadow together:

| Level | Surface | Treatment | Used by |
|---|---|---|---|
| `--elev-0` | `--ground` | none | page |
| `--elev-1` | `--surface-1` | 1px `--line` hairline, no shadow | rows, cards, toolbar, filter rail |
| `--elev-2` | `--surface-2` | `0 8px 24px rgb(0 0 0 / 0.32)` dark, `0 8px 24px rgb(18 16 28 / 0.12)` light | tooltip, popover, select list |
| `--elev-3` | `--surface-2` | `0 24px 64px rgb(0 0 0 / 0.48)` dark, `0 24px 64px rgb(18 16 28 / 0.20)` light, over `--scrim` | modal |

  `--scrim` is `rgb(6 5 12 / 0.64)` dark and `rgb(18 16 28 / 0.40)` light. No backdrop blur, no grain layer, no sheen gradients.
- Layers: `--z-sticky` 10, `--z-popover` 100, `--z-modal` 1000.

### Motion

Tokens: `--dur-in` 120ms, `--dur-move` 160ms, `--dur-out` 240ms; `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-in` `cubic-bezier(0.3, 0, 0.7, 1)`. No `linear`, no `ease-in-out`, no keyframe loops, nothing that pulses.

| Motion | Where | Tokens | What it communicates |
|---|---|---|---|
| Colour and border shift | every control on hover, focus, active | `--dur-in` in, `--dur-out` out, `--ease-out` | feedback: this responds to you |
| Row and card re-sort (position ease, FLIP) | cards and table after a filter, sort or search change | `--dur-move`, `--ease-out` | state change: where each venue went, so the list is not read again from the top |
| View crossfade | switching timeline, cards, table, map | `--dur-in`, `--ease-out`, opacity only | state change: same data, different arrangement |
| Modal rise | detail and suggest modals, opacity plus 8px translate | `--dur-move` in, `--dur-in` out | hierarchy: a layer above the list |
| Rail tick lift | year-rail tick when its row or cell is hovered or focused | `--dur-in` | relationship: this row is that point in the year |
| Star fill | star toggled | `--dur-in` | feedback: saved |

Under `prefers-reduced-motion: reduce` every duration token is redefined to `0ms` at `:root`; position eases and the modal translate do not run. The theme switch itself never animates.

### Icons

Tabler Icons, outline set, version 3.41.1 (MIT), as one inline `<symbol>` sprite in the page with paths copied verbatim from `https://cdn.jsdelivr.net/npm/@tabler/icons@3.41.1/icons/outline/<name>.svg`. Stroke 1.5, `currentColor`, drawn at 20px inside a 44px target. The webfont is not used: it loads the whole set for a dozen glyphs and blocks first paint. Icons in use: `sun`, `moon`, `star`, `star-filled` (from the filled set), `external-link`, `calendar-down`, `plus`, `search`, `x`, `check`, `chevron-down`, `arrows-sort`, `filter`. No hand-drawn paths, no Unicode arrows or glyphs standing in for icons (the CFP arrow and the table link arrow become `external-link`). The brand mark and map geometry are illustrations, not icons, and stay.

### Layout

One 12-column grid, `max-width: 80rem`, gutter `--space-5`, page margin `clamp(var(--space-4), 4vw, var(--space-6))`. Regions in reading order: app bar, deadline strip (next-deadline readout, counts, year rail), view bar, then filters beside or above the data.

| Width | Columns | Behaviour |
|---|---|---|
| 1440 | 12 | App bar one line. Filters are a sticky left rail on columns 1 to 3 (field, tier, window, sort, starred); data on columns 4 to 12. Search and the `.ics` and suggest actions sit in the view bar. The first data row is inside the first 900px on every view. Cards three across. |
| 768 | 8 | Filter rail becomes a `details` block above the data, summary "Filters" plus the count of active ones, closed by default. Cards two across. Table keeps all columns; the fit column is dropped before any horizontal scroll. |
| 375 | 4 | Margin `--space-4`. Title wraps to two lines at most. View tabs span the width as four equal 44px tabs. Search is full width on its own row. Filters stay in the `details` block. Cards one across. Table rows restack as two-line entries through `@container`, not a media query. Year rail shows six months. |

Cards, table rows and the deadline strip size themselves with `@container`. Every touch target is at least 44 by 44px with 8px between neighbours. No horizontal scroll and no clipped text at any of the three widths.

### Components and states

Every state is built from the tokens above. Focus on every focusable element is `outline: 2px solid var(--accent); outline-offset: 2px`, visible on all three surfaces. Disabled is 0.5 opacity with `cursor: not-allowed` and no hover response.

| Component | States |
|---|---|
| App bar: brand mark, title, theme toggle | toggle: default, hover, focus, active, pressed (dark or light, shown by icon and `aria-pressed`) |
| Deadline strip: next-deadline readout, counts | default; urgent, soon, far (status token plus the words); empty ("No open deadlines") |
| Year rail | default; tick hover and focus; tick urgent; empty month; reduced to six months at 375 |
| View tabs (timeline, cards, table, map) | default, hover, focus, active, selected (`--accent` underline 2px plus weight 600) |
| Action button (`.ics`, suggest) | default, hover, focus, active, disabled |
| Filter chip (field with dot, tier, window) | default, hover, focus, active, selected (`--accent-solid` fill, white text, check icon), disabled when the field has no venues in the current set |
| Sort select | default, hover, focus, open, disabled |
| Search input | default, hover, focus, filled (clear button appears), no results |
| Starred-only toggle | unchecked, checked, hover, focus, disabled when nothing is starred |
| Segmented control (calendar or Gantt; compact, comfortable, spacious) | default, hover, focus, selected |
| Calendar cell | empty, one deadline, several (count shown), today (accent ring), hover, focus, passed |
| Gantt bar and markers | default, hover, focus, passed, today line |
| Tooltip | hidden, shown; reachable by keyboard focus as well as hover |
| Conference card | default, hover, focus, starred, closed (deadline passed), with or without a user status |
| Table | header: default, hover, focus, sorted ascending, sorted descending. Row: default, hover, focus, starred, closed |
| Spec line (format, tier, type under a venue) | present values only; an absent value is omitted, never a dash |
| Countdown | urgent, soon, far, closed; always a number with its unit and the word, never colour alone |
| Tier badge | A*, A, B, industry, journal: text on `--surface-2`, weight 600, no colour coding |
| Field tag | dot plus name |
| Status pill (interested, drafting, submitted, accepted, rejected) | one per value, each a status token tint with the word; none |
| Star button | off, on, hover, focus |
| Map and markers | default, marker hover, focus, selected, cluster with count; empty ("No venues with a known city") |
| Detail modal: notes field, status select, links | opening, open, closing; notes saved (inline "Saved" text); focus trapped; Escape closes |
| Suggest modal | default, invalid (message names the missing field), submitting, error (names the failure and the retry), sent |
| Colophon | default; link hover and focus |
| Region states | loading: skeleton rows in `--surface-1` and `--surface-2`, no spinner. Empty: one sentence naming the filter to loosen and a "Clear filters" button. Error: what failed and a "Retry" button. Each visibly distinct from live data |

Controls that exist today and must all remain: theme toggle; four view tabs; `.ics`; suggest; 14 field chips; six tier chips; sort select; four window chips; search; starred only; calendar and Gantt switch; compact, comfortable and spacious density switch; per-row star; card and row click to open the modal; modal notes, status and close; CFP links; colophon link.

### Formats

- Date: short month, day, four-digit year, `Mar 4, 2026`, from `fmtDate`. A range shares month and year: `Oct 10–14, 2026`. The two-digit year after a venue name is retired; the year is written in full.
- Countdown: whole days with the unit attached, `14d`; future as `in 14d`, past as `closed Mar 4, 2026`. No struck-through "509d ago".
- Numbers: plain digits, no thousands separator below 10,000, tabular. Counts are followed by their noun: `131 venues`.
- Units: `d` for days is the only abbreviation. Dates are shown as recorded in the data, without time-zone conversion.

### Exceptions

- Field colours and status tokens sit outside the count of interface colours (eleven tokens above). They are data encodings and each is a token. Verifier: `npm run design` plus a grep of `getCSS()` for colour literals outside the `:root` blocks, which must find none.
- Gate: `npm run design` (`tests/design-compliance.mts`) checks all four views, both themes and 375, 768 and 1440px: no horizontal scroll, at most three sizes and three weights, one family, no uppercase, 44px targets, zero axe violations.
- Open: no `og:image` (needs a raster asset). Fonts come from Google's CDN rather than a self-hosted file.
- Record a universal-rule exception only with the evidence and verifier that justify it.

### Recommendations

In this build:

1. Replace the paper, espresso and blue tokens with the Stint tokens in both themes; remove the grain layer, backdrop blur, sheen gradients and the italic ampersand.
2. Onest in place of Hanken Grotesk; the colophon names the face actually loaded.
3. Spacing, radius, elevation, layer and motion tokens; no literal left in component rules.
4. Tabler outline sprite replaces hand-drawn icons and Unicode arrows.
5. Chips become 6px rectangles; the selected state gains a check icon so it is not colour alone.
6. New component, next-deadline readout: the days-remaining number at display size at the top of the page, with the venue and date beside it.
7. New component, year rail: twelve months from today, one tick per deadline in its field colour, urgent ticks in `--status-urgent`.
8. New component, spec line: format, tier and type as plain text under each venue in cards and table.
9. Layout: filters move to a sticky left rail at 1440 and a `details` block below it, so data is in the first viewport. Seen in the running app on 2026-10-04 at 1440 by 900: header and filters fill the viewport and only the top edge of the first card or the first two table rows shows.
10. Countdown column becomes the widest, heaviest element in a row; tabular, right-aligned.
11. Default sort lists open deadlines first and closed ones after, so the first row is no longer a deadline that passed in 2025.
12. Row and card re-sort ease, view crossfade, modal rise, rail tick lift.
13. `@container` on cards, table rows and the deadline strip; `clamp()` on display size and section padding.
14. Loading, empty and error states for every data region; the empty state offers "Clear filters".
15. Field palette re-tuned to one lightness band and kept clear of the accent hue.

Proposed for later:

1. Self-host Onest (Fontsource woff2 served by a route in `server.ts`) to drop the third-party request.
2. A raster `og:image` generated from the deadline strip.
3. Year rail as a control: click a month to set the window filter.
4. Saved filter sets in the URL hash with a "Copy link" action.
5. Anywhere-on-Earth labelling once the data records a time zone per deadline.
6. Keyboard shortcuts: `/` focuses search, `1` to `4` switch views, `s` stars the focused row.
7. Requirement fields in the data (page limit, anonymity) so the spec line can carry them; the refresh script does not collect them today.
8. Register this project against the Stint row in `~/.agents/design/languages/registry.md`.
