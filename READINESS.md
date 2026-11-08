# Readiness: conference-tracker

| works | usable | polished | production | operated |
| --- | --- | --- | --- | --- |
| not-met | not-met | not-met (target) | not-targeted | not-targeted |

Target: polished

## Next gaps

- B1.1 (failing): Every core flow named in SPEC.md runs end to end.
- tests (could-not-tell): Test suite passes and runs at least one test.
- B1.3 (no-check): PRODUCT.md names who the app is for and why it exists.

## B1 Purpose and core flows

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B1.1 | Every core flow named in SPEC.md runs end to end. | agent | failing | 2026-11-08 |
| B1.2 | A fresh judge finds the app does what PRODUCT.md, SPEC.md and Douglas's asks say. | judge | met | 2026-11-08 |
| B1.3 | PRODUCT.md names who the app is for and why it exists. | auto | no-check | never |

## B2 Feedback and response time

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B2.1 | A control reacts within 0.1 s. | agent | met | 2026-11-08 |
| B2.2 | Any wait over 1 s shows progress. | agent | met | 2026-11-08 |
| B2.3 | Work over 10 s can be left running or cancelled. | agent | met | 2026-11-08 |

## B3 States

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B3.1 | Every data region has loading, empty and error states. | auto | could-not-tell | 2026-11-08 |
| B3.3 | An empty state says what belongs there and offers one action. | judge | failing | 2026-11-08 |

## B4 Errors and recovery

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B4.1 | No uncaught errors on the core flows. | auto | met | 2026-11-08 |
| B4.2 | An error message says what happened and what to do next. | judge | could-not-tell | 2026-11-08 |
| B4.3 | A failed action can be retried without retyping. | agent | could-not-tell | 2026-11-08 |

## B5 Data safety and undo

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B5.1 | Nothing typed is lost on reload, back or crash. | agent | met | 2026-11-08 |
| B5.2 | Reversible actions can be undone; only irreversible ones ask to confirm. | agent | met | 2026-11-08 |

## B6 Navigation

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B6.1 | The user always knows where they are and how to get back. | judge | failing | 2026-11-08 |
| B6.2 | Each view has its own URL and a unique title. | auto | no-check | never |
| B6.3 | Frequent actions have shortcuts. | agent | failing | 2026-11-08 |

## B7 Accessibility to WCAG 2.2 AA

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B7.1 | Core flows work by keyboard alone, with visible focus. | auto | failing | 2026-11-08 |
| B7.2 | Text contrast is at least 4.5:1. | auto | met | 2026-11-08 |
| B7.3 | Large text and interface graphics contrast is at least 3:1. | auto | no-check | never |
| B7.4 | Zero axe violations at WCAG 2.2 AA. | auto | met | 2026-11-08 |
| B7.5 | Pointer targets are at least 24 px. | auto | no-check | never |
| B7.7 | Every non-text element has a text alternative. | auto | met | 2026-11-08 |

## B8 Layout from 320 px to 1440 px

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B8.1 | No horizontal scroll or clipped text at 320 px and 1440 px. | auto | met | 2026-11-08 |
| B8.2 | No horizontal scroll or clipped text at 768 px. | auto | met | 2026-11-08 |
| B8.3 | Layout holds at 200% text zoom. | auto | no-check | never |

## B9 Performance budgets

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B9.1 | Nothing jumps around after it loads. | agent | met | 2026-11-08 |

## B10 Error tracking and logs

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B10.1 | Uncaught errors are captured with the release, the route and the last action. | auto | failing | 2026-11-08 |
| B10.3 | Logs are structured, one JSON object per line. | auto | failing | 2026-11-08 |

## B11 Security and privacy

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B11.1 | No secrets in the client bundle or the repository. | auto | no-check | never |

## B12 Onboarding and help

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B12.1 | A transient app is ready the moment it opens, with no setup step. | agent | met | 2026-11-08 |
| B12.2 | A newcomer gets first-run guidance. | judge | met | 2026-11-08 |
| B12.3 | A first-time user reaches a useful result without help. | agent | met | 2026-11-08 |

## B13 Copy

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B13.1 | Copy is reread, with no machine vocabulary left. | judge | failing | 2026-11-08 |

## B14 Visual design

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| B14.1 | Visual design follows .agents/DESIGN.md and the project design language. | judge | failing | 2026-11-08 |
| B14.2 | Every style comes from tokens, and dark mode reuses them. | auto | no-check | never |

## LB1 Search and browse

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| LB1.1 | A result list appears within 1 s of the last keystroke in the search field. | agent | met | 2026-11-08 |
| LB1.2 | Search matches title, tags and text, and each result says which field matched. | agent | failing | 2026-11-08 |

## LB2 Facets and sort

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| LB2.1 | Each facet value shows its count under the current filters. | auto | no-check | never |
| LB2.2 | Each active facet is listed and removed with one action. | agent | met | 2026-11-08 |
| LB2.3 | The sort control names its field and direction and keeps the active filters. | agent | met | 2026-11-08 |
| LB2.4 | Items with equal sort keys keep a fixed order, so paging never repeats or skips one. | auto | no-check | never |

## LB3 Detail

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| LB3.1 | A detail view shows every field with its label, and an empty field reads Not set. | auto | no-check | never |
| LB3.2 | Next and previous move through the current result list without returning to it. | agent | failing | 2026-11-08 |
| LB3.3 | Opening an item from a search keeps the query visible, so the user can return to it. | agent | met | 2026-11-08 |

## LB4 Organize and bulk edit

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| LB4.1 | Selecting several items shows the count selected and the actions that apply to all of them. | agent | failing | 2026-11-08 |
| LB4.2 | A bulk edit previews each item it changes before it applies, and the whole edit can be undone. | agent | failing | 2026-11-08 |
| LB4.3 | A bulk action is disabled when no items are selected. | auto | no-check | never |

## LB5 Import and export

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| LB5.1 | An import report lists rows accepted and rejected, with a reason for each rejection, before any change is committed. | agent | failing | 2026-11-08 |
| LB5.2 | An export contains exactly the items in the current filtered view, or states that it exports all. | agent | met | 2026-11-08 |
| LB5.3 | Importing an item that duplicates an existing one asks to skip, replace or keep both. | agent | failing | 2026-11-08 |

## runtime Browser runtime errors

| item | statement | verify | state | last run |
| --- | --- | --- | --- | --- |
| S-WEB.1 | A window error listener is registered before app code runs, and each uncaught error it receives reaches the error sink. | agent | failing | 2026-11-08 |
| S-WEB.2 | An unhandled promise rejection has its own listener and reaches the error sink. | agent | failing | 2026-11-08 |
| S-WEB.3 | Each route sits inside an error boundary that shows that route's fallback and reports the caught error, and the other routes stay usable. | agent | failing | 2026-11-08 |
| S-WEB.4 | A chunk that fails to load after a deploy shows a reload prompt, not a blank page. | agent | met | 2026-11-08 |

Generated from `.agents/work/readiness.json` by `Test-ProductReadiness.ps1 -Write`; do not edit. States derive from receipts.

`met` means the app's own command reported success. It does not mean the app is correct or good.

Kind: conference-tracker | Generated: 2026-11-08T03:22:47.4028250Z | Input hash: a2f055f4354e

## Next (checks, detail)

Stage: works

- tests (could-not-tell): no evidence that any test ran

## Refresh

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -NonInteractive -File ~/.agents/tools/Test-ProductReadiness.ps1 -ProductPath . -Profile .agents/app-profile.json -Check all -Write
```

## Stages (checks, detail)

| stage | state |
| --- | --- |
| works | not-met |
| usable | not-met |
| polished | partial |
| production | not-met |
| operated | met |

## Checks (detail)

### works

| check | state | last run | exit | note |
| --- | --- | --- | --- | --- |
| typecheck | met | 2026-11-08T03:21:40.2638935Z | 0 |  |
| tests | could-not-tell | 2026-11-08T03:22:05.1717769Z | 0 | no evidence that any test ran |
| console-clean | met | 2026-11-08T03:22:11.6461519Z | 0 |  |

- build: package.json declares no build script; the app is build-free

### usable

| check | state | last run | exit | note |
| --- | --- | --- | --- | --- |
| loading-state | could-not-tell | 2026-11-08T03:22:13.4641717Z | 2 | \{"check":"loading-state","outcome":"could-not-tell","reason":"no .agents/app-selectors.json selector map","findings":\[\]\} |
| empty-state | could-not-tell | 2026-11-08T03:22:16.4010164Z | 2 | \{"check":"empty-state","outcome":"could-not-tell","reason":"no .agents/app-selectors.json selector map","findings":\[\]\} |
| error-state | could-not-tell | 2026-11-08T03:22:18.9101766Z | 2 | \{"check":"error-state","outcome":"could-not-tell","reason":"no .agents/app-selectors.json selector map","findings":\[\]\} |
| not-found-state | could-not-tell | 2026-11-08T03:22:22.0621752Z | 2 | \{"check":"not-found-state","outcome":"could-not-tell","reason":"no .agents/app-selectors.json selector map","findings":\[\]\} |
| keyboard-focus | failing | 2026-11-08T03:22:26.4547538Z | 1 | child exited 1 |
| error-capture | failing | 2026-11-08T03:22:29.2635308Z | 1 | child exited 1 |
| structured-logs | failing | 2026-11-08T03:22:31.0216179Z | 1 | child exited 1 |
| viewport-320-1280 | met | 2026-11-08T03:22:35.9160421Z | 0 |  |
| not-found-page | failing | 2026-11-08T03:22:38.2107521Z | 1 | child exited 1 |

Not applicable: cli-conformance, game-playable

### polished

| check | state | last run | exit | note |
| --- | --- | --- | --- | --- |
| design-banned-patterns | met | 2026-11-08T03:22:40.0389937Z | 0 |  |
| design-review-dated | never-run |  |  | no design-review receipt; run Write-DesignReviewReceipt.ps1 |

### production

| check | state | last run | exit | note |
| --- | --- | --- | --- | --- |
| seo-tags | failing | 2026-11-08T03:22:42.1731197Z | 1 | child exited 1 |
| axe | met | 2026-11-08T03:22:45.8551935Z | 0 |  |

Not applicable: privacy-terms, security-headers, core-web-vitals, log-personal-data

### operated

Not applicable: deployed-url, env-documented, monitoring, restore-path
