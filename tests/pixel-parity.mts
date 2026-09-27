// Pixel parity between two running builds, per theme.
//
// Usage: node tests/pixel-parity.mts <before-url> <after-url>
//
// The computed-style oracle proves paint properties are unchanged, but it keys each element
// by index and tag name, so a change that only renames an element (a <span> to a <label>, say)
// moves the hash while changing nothing on screen. This compares the rendered pixels instead
// and is the stronger proof for exactly that case.
import { chromium, type Page } from "playwright";
import crypto from "node:crypto";

const before = process.argv[2];
const after = process.argv[3];
if (!before || !after) {
  console.error("usage: node tests/pixel-parity.mts <before-url> <after-url>");
  process.exit(2);
}

const browser = await chromium.launch();
const shoot = async (url: string, theme: string): Promise<string> => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page: Page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ fullPage: true });
  await ctx.close();
  return crypto.createHash("sha256").update(buf).digest("hex");
};

let bad = 0;
for (const theme of ["light", "dark"]) {
  const a = await shoot(before, theme);
  const b = await shoot(after, theme);
  if (a === b) console.log(`  ✓ ${theme}: identical pixels (${a.slice(0, 16)}…)`);
  else { bad++; console.log(`  ✗ ${theme}: ${a.slice(0, 16)}… != ${b.slice(0, 16)}…`); }
}
await browser.close();
process.exit(bad ? 1 : 0);
