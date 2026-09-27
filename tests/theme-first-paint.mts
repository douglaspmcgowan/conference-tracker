// Regression test for the theme's FIRST PAINT.
//
// Usage: node tests/theme-first-paint.mjs [url]
//
// The theme script reads prefers-color-scheme and sets data-theme, but only once it runs. Before
// the @media (prefers-color-scheme: dark) block landed, a visitor whose system asks for dark got
// one frame of the light theme first. javaScriptEnabled:false is what makes that frame observable:
// it freezes the page in exactly the state the first paint sees.
//
// The assertion is that the no-JS paint and the settled JS paint agree, per scheme. That is the
// property, not a hard-coded colour, so it survives any later change to the token values.
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3010/";
const errors: string[] = [];
const ok = (m: string) => console.log("  ✓", m);
const fail = (m: string) => { errors.push(m); console.log("  ✗", m); };

const read = () => ({
  attr: document.documentElement.getAttribute("data-theme"),
  bg: getComputedStyle(document.body).backgroundColor,
  fg: getComputedStyle(document.body).color,
});

const browser = await chromium.launch();
for (const scheme of ["light", "dark"] as const) {
  const noJsCtx = await browser.newContext({ colorScheme: scheme, javaScriptEnabled: false });
  const noJsPage = await noJsCtx.newPage();
  await noJsPage.goto(url, { waitUntil: "load", timeout: 30000 });
  const firstPaint = await noJsPage.evaluate(read);
  await noJsCtx.close();

  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const settled = await page.evaluate(read);
  await ctx.close();

  if (firstPaint.attr !== null) fail(`${scheme}: data-theme should be absent without JS, got ${firstPaint.attr}`);
  else ok(`${scheme}: no data-theme attribute before the script runs`);

  if (settled.attr !== scheme) fail(`${scheme}: script set data-theme=${settled.attr}`);
  else ok(`${scheme}: script settles on data-theme=${scheme}`);

  if (firstPaint.bg !== settled.bg || firstPaint.fg !== settled.fg) {
    fail(`${scheme}: first paint ${firstPaint.bg}/${firstPaint.fg} != settled ${settled.bg}/${settled.fg}`);
  } else {
    ok(`${scheme}: first paint matches settled paint (${settled.bg})`);
  }
}
await browser.close();

console.log(errors.length ? `\n${errors.length} FAILURES` : "\nall first-paint checks passed");
process.exit(errors.length ? 1 : 0);
