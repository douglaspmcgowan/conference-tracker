# Work log

<!-- Append: YYYY-MM-DD | completed work | verifier or evidence -->
2026-07-30 | Adopted the portable harness-v3 project contract on an isolated onboarding branch and replaced generated metadata placeholders with repository-backed values | README, package scripts, application paths, and manifests
2026-07-30 | Verified the onboarding branch without changing application source | harness verifier, diff check, Node syntax checks, deployed Playwright suite, and Gitleaks
2026-09-27 | App-repair Stage 2, non-visual pass. TypeScript conversion (server.ts, scripts/refresh-data.ts, tests/*.mts, tsconfig strict), ARIA repairs, axe gate wired into the suite, deadline-cell assertion replaced with the renderer property | `npx tsc --noEmit` exit 0; suite 55 pass / 0 fail (baseline 51/1); `tests/pixel-parity.mts` identical full-page pixels in both themes; `tests/theme-first-paint.mts` 6/6; `tests/a11y.mts` no blocking violations; `git diff --check` clean

### Stage 2 floor rows, measured on the served page at http://localhost:371x

| column | before (HEAD f6f5c74) | after | note |
|---|---|---|---|
| cssChars | 38307 → 43329 | 43341 | +12 chars: `[tabindex]` added to the focus-visible selector list |
| colours_total (hex/rgb/hsl) | 73 (24/49/0) | 73 (24/49/0) | unchanged |
| hexOutsideTokenBlocks | 0 | 0 | already at the floor |
| fontsize_distinct_literal | 0 | 0 | already at the floor |
| fontsize_literal_decls | 0 | 0 | all 69 declarations are `var()` |
| customprops | 103 | 103 | unchanged |
| varUses | 493 | 493 | unchanged |
| important | 4 | 4 | all four inside `prefers-reduced-motion`, the canonical use; effective count 0 |
| focusVisible | 4 | 4 | `:where(a, button, input, label, select, textarea, [tabindex])` covers every focusable element in the app |
| bareFocus | 2 | 2 | `:focus { outline: none }` plus the search field, both paired with a `:focus-visible` ring |
| darkBlocks | 1 | 1 | `prefers-color-scheme: dark`, landed by the previous lane and verified here |
| themeAttrSelectors | 16 → 4 | 4 | the four that remain are structural, not per-component colour overrides |
| prefersReducedMotion | 2 | 2 | unchanged |
| inlineStyleAttrs | 13 | 13 | all generated per-conference field colours in the calendar stripes; they are data, not style literals |
| suite | 51 pass / 1 fail | 55 pass / 0 fail | axe adds 2 checks; the stale deadline threshold became a property |
| axe serious+critical | 2 critical, 1 serious | 0 critical, contrast only | `aria-required-children` and `select-name` fixed |

Proof that the non-visual changes changed no pixel: `tests/pixel-parity.mts` compared full-page
screenshots of the pre-change and post-change builds served side by side on the same day, in both
themes — identical SHA-256 for each. The computed-style oracle's hash DID move, and the reason was
measured rather than assumed: exactly one element of 869 differs, element 77, `SPAN` to `LABEL`,
with all sixteen paint properties byte-identical. That element is the Sort control's label, which
became a real `<label for="sortSelect">` to fix an axe `select-name` critical.
2026-10-04 | Task state consolidated into TASK.md; legacy task and verification sources retained under .agents/archive/task-state-migration.
