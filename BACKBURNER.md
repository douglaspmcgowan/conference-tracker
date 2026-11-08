# Backburner

<!-- Park optional or deferred work here. Promote it into TASK.md when authorized and active. -->

<!-- agent-harness:intake:v1:start -->

## Intake - filed by agents working on other projects

> An agent that finds something wrong here while working elsewhere records it and does
> not fix it. This block is where those records land; this project's own agent triages
> them, promotes what it takes into TASK.md, and deletes nothing to make a count look
> better. Written by `Add-ProjectIntake.ps1` -- add items with that tool rather than by
> hand, so the id-collision check and the format actually hold.

### cloud-kit-rollout-prerequisite-20260811

**Enroll conference-tracker in the shared hosted-agent cloud kit**

- **Filed** 2026-08-11 by an agent working on agent-harness cloud rollout routing 2026-08-11
- **Relationship** prerequisite - **Value** high - **Risk** medium
- **Evidence** verifier=inspection; subject=.agents/cloud is absent and the shared rollout registry assigns project-owned enrollment; result=verified; reference=AGENTS.md
### app-standard-gaps

**App Standard gaps: stage works, target polished**

- **Filed** 2026-11-08 by an agent working on app-standard-sweep
- **Relationship** defect - **Value** medium - **Risk** low
- **Evidence** Preliminary Test-ProductReadiness -Check all -Write against https://conference-tracker-rho.vercel.app/ (profile library/web/self/daily-tool, read-only GET server, no writes, no CORS): works not-met, usable not-met, polished partial, target polished. Top gaps: tests (npm test runs tests/verify-live.mts, which prints check marks but no pass count, so could-not-tell: no evidence any test ran), keyboard-focus (failing: 25 interactive elements incl. button#themeBtn and every button.chip show no visible focus indicator), error-capture (failing: no window error or unhandledrejection listener on the web surface). Also failing: not-found-page (random path returns HTTP 200), structured-logs (2 plain console calls, server.ts:2360), seo-tags (no canonical, no og:title, robots.txt and sitemap.xml return the HTML page). READINESS.md is the live list.
- **Fix Recommendation** 1) make npm test print a pass count (end tests/verify-live.mts with a line like 'N passed, M failed' and exit 1 on failures); 2) add a :focus-visible outline rule for .chip, .theme-toggle and other buttons in the page CSS in server.ts; 3) add window.addEventListener('error') and 'unhandledrejection' handlers in the page script; 4) return res.status(404) for unknown paths instead of the app.get('*') HTML, plus serve robots.txt and sitemap.xml and add link rel=canonical and og:title; 5) then run the SPEC.md core flows and receipt them.
- **Fix Location** tests/verify-live.mts (summary line); server.ts (CSS focus-visible, page script error handlers, app.get('*') catch-all, head tags); package.json scripts.test
- **Fix Rationale** Stage works needs a test run that proves at least one test passed; usable needs visible keyboard focus, error capture and a real 404; polished and production items follow the order in READINESS.md.
- **CannotFixHere** sweep files the app's own gaps record into its lane worktree by design
- **Queue** .agents/work/imports/intake/queue--20261108T031039086Z--f10089a85faf4e3c8298865e3ba81a98.json
<!-- agent-harness:intake:v1:end -->
