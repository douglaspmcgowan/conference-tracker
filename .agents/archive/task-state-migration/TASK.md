# Task

## Goal

Adopt and verify the portable harness-v3 project contract without changing application behavior.

## Active

<!-- Move the item currently being worked here. -->

## Queue

<!-- Add required work extracted from the request here. -->

- [ ] Converge the framework to Next.js App Router, one route per page, deleting the hand-written Express server | the app-repair program's CONVERGE verdict. NOT attempted in Stage 2: the whole interface is 2351 lines of `server.ts` template literal with a working 103-token design system inside it, so this is a port of every surface at once rather than a file move, and the program's own stopping rule puts a regression in a working app above the floor it would gain. Entry conditions before starting: the suite at 55 pass / 0 fail as the before-and-after oracle, `tests/pixel-parity.mts` as the proof the markup survived, and the token block carried across byte-identical.

## Blocked

<!-- Record externally blocked work here. -->

## Needs decision

<!-- Record items requiring a user decision here. -->

- [?] WCAG AA contrast: 36 failing nodes in the light theme, 3 in the dark theme, measured by axe on the freshly loaded page. `~/.agents/DESIGN.md` § Accessibility makes AA a floor, but every fix is a change to a token VALUE, which changes what the page looks like — and the repair program that found this is barred from visual change. Pinned at its measured size in both `tests/a11y.mts` and the main suite so it cannot grow silently. Needs a palette decision.
- [?] The theme toggle renders `☀` and `☾` as its icons. `craft-floor.md` bans a Unicode glyph standing in for an icon, and `DESIGN.md` bans emoji as an icon system. The fix is an inline SVG pair, which changes the rendered control.
- [?] `.theme-toggle` carries `backdrop-filter: blur(8px)` while sitting in a non-fixed, non-sticky masthead, against `DESIGN.md` § Performance. It is visible rather than inert, because `--paper-raised` is translucent (0.86 / 0.62 alpha), so removing it changes the control's appearance.
- [?] `.timeline-deadline-marker` transitions the SVG `r` attribute and grows to `r: 7` on hover, against `DESIGN.md` § Performance ("animate `transform` and `opacity` only"). The transform-based equivalent also scales the stroke, so the hover feedback would not look the same.

## Completed

- [x] Add the portable Claude, Codex, Cursor, task-state, manifest, hook, and skill-projection files | evidence: `SyncProject` completed on isolated branch `codex/harness-v3-onboarding`.
- [x] Replace generated project metadata placeholders with repository-backed identity, commands, architecture, and durable status | evidence: `README.md`, `package.json`, application paths, and manifests inspected.
- [x] Verify harness adoption without application regressions | evidence: `VerifyProject`, `git diff --check`, both Node syntax checks, and the deployed Playwright verifier passed; Gitleaks found no leaks.

## Verification

- Next: independent review, then commit and publish the isolated onboarding branch.

<!--
Markers use a space for queued work, a tilde for active work, x for complete,
an exclamation mark for blocked work, and a question mark for decisions.
Required delegated work may be nested under its parent with agent provenance.
Optional discoveries belong in BACKBURNER.md.
Parallel mode applies to three or more independent, file-disjoint items.
-->
