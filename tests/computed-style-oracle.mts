// Computed-style oracle — the proof that a token extraction changed no pixel.
//
// Usage: node tests/computed-style-oracle.mjs [url]
//
// Serializes 16 *paint* properties for every descendant of <body>, per theme, and digests
// the result. Two runs across a refactor must produce identical hashes, which is what makes
// "I only renamed literals to tokens" a measurement rather than a claim.
//
// Layout properties (width/height/display/padding/margin) are deliberately EXCLUDED: an
// earlier capture that included them produced a different hash purely from web-font load
// timing, so they are not a reliable oracle.
//
// Two details are load-bearing and were each found by a hash that would not reproduce:
//
//   * The wait is a setTimeout, never requestAnimationFrame — rAF never fires while a browser
//     pane is hidden, which silently yields an all-zero capture.
//   * A hash is only comparable against another hash taken ON THE SAME DAY. Countdown urgency
//     classes are derived from today's date, so which cards carry .urgent and which .soon
//     changes at midnight and the hash changes with them. A before/after pair captured either
//     side of a date rollover differs for that reason alone and says nothing about the diff
//     under test. To compare against an earlier commit, serve that commit's file alongside the
//     current one and capture both now:
//       git show <ref>:server.ts > .local-server-before.mts && PORT=<n> node .local-server-before.mts
//   * The context runs with reducedMotion: "reduce" and waits longer than --dur-out (240ms).
//     Flipping data-theme starts a colour transition; sampling inside it returns interpolated
//     values, so the dark hash varied run to run. Reduced motion collapses the transition and
//     the app's own prefers-reduced-motion block does the rest. Steady-state paint values are
//     unaffected by this, which is the whole reason it is safe to do.
import { chromium } from "playwright";
import crypto from "node:crypto";

const url = process.argv[2] || "http://localhost:3010/";
const PROPS = [
  "color", "background-color", "font-size", "font-family", "font-weight", "line-height",
  "letter-spacing", "text-transform", "border-top-color", "border-top-width", "border-radius",
  "box-shadow", "opacity", "outline-color", "fill", "stroke",
];

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

const out: Record<string, { elements: number; sha256: string }> = {};
for (const theme of ["light", "dark"]) {
  const ser = await page.evaluate(async ({ theme, PROPS }) => {
    document.documentElement.setAttribute("data-theme", theme);
    await new Promise((r) => setTimeout(r, 400));
    const els = [...document.body.querySelectorAll("*")];
    return {
      n: els.length,
      s: els.map((el, i) => {
        const cs = getComputedStyle(el);
        return i + "|" + el.tagName + "|" + PROPS.map((p) => cs.getPropertyValue(p)).join("|");
      }).join("\n"),
    };
  }, { theme, PROPS });
  out[theme] = { elements: ser.n, sha256: crypto.createHash("sha256").update(ser.s).digest("hex") };
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
