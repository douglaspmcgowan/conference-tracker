// Accessibility gate — axe-core over the primary surface, in both themes.
//
// Usage: node tests/a11y.mts [url]
//
// Zero serious and zero critical violations are required, with ONE recorded exception:
// `color-contrast`. Measured 2026-09-27 at 36 failing nodes in the light theme and 3 in the
// dark theme. Every fix for those is a change to a token's VALUE, which changes what the page
// looks like, and the repair program that added this gate is explicitly barred from making
// visual changes. So the finding is not hidden and it is not waved through either: it is
// pinned at its measured size and the gate fails if it grows. Lower these numbers when the
// palette is fixed; never raise them.
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const url = process.argv[2] || "http://localhost:3010/";
const blocking = new Set(["serious", "critical"]);
const CONTRAST_BASELINE: Record<string, number> = { light: 0, dark: 0 };
const failures: string[] = [];

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

for (const theme of ["light", "dark"] as const) {
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  console.log(`\n${theme}: ${results.violations.length} violation rule(s)`);
  for (const v of results.violations) {
    const line = `[${v.impact}] ${v.id} x${v.nodes.length} — ${v.help} (${v.nodes[0]?.target?.join(" ")})`;
    if (v.id === "color-contrast") {
      const cap = CONTRAST_BASELINE[theme] ?? 0;
      if (v.nodes.length > cap) {
        failures.push(`${theme}: color-contrast grew to ${v.nodes.length} nodes, recorded baseline is ${cap}`);
        console.log("  ✗", line, `— OVER the recorded baseline of ${cap}`);
      } else {
        console.log("  ·", line, `— at or under the recorded baseline of ${cap}, visual fix deferred`);
      }
    } else if (blocking.has(String(v.impact))) {
      failures.push(`${theme}: ${line}`);
      console.log("  ✗", line);
    } else {
      console.log("  ·", line);
    }
  }
  if (!results.violations.length) console.log("  ✓ no violations");
}
await browser.close();

console.log(failures.length ? `\n${failures.length} BLOCKING violation(s)` : "\nno blocking violations");
process.exit(failures.length ? 1 : 0);
