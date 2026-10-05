# CURRENT-TASK — Conference Tracker app-quality pass

**Goal:** De-slop + harden the conference-tracker UI on branch `fix/app-quality-pass` per FIX-AGENT-PROMPT.md spec; no redesign, smallest fix per tell.

## Completed

- Read corpus: feedback_ai_isms, reference_motion_interaction_defaults, impeccable SKILL.md + audit.md + polish.md
- Explored all files; full app lives in `server.js` (CSS in `getCSS()`, JS in `getJS()`, HTML in `buildPage()`)
- Ran impeccable detector → 2 hits (Inter Tight overused font)
- Manual audit complete → 18 planned fixes
- Created branch `fix/app-quality-pass`

## Remaining steps (in order)

1. Apply CSS fixes to `getCSS()` in server.js (items 1–15)
2. Apply HTML fixes to `buildPage()` in server.js (items 16–17)
3. Apply JS fixes to `getJS()` in server.js (item 18)
4. Kill temp HTML file
5. Serve + preview (desktop + 375px) + re-run detector
6. Commit → push branch → open draft PR
7. Update CURRENT-TASK.md with done state

## Next command to run

Apply fixes to `C:\Users\dougl\Projects\conference-tracker\server.js`
