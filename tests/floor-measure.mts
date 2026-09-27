// Floor measurement for the app-repair program's quality floor.
//
// Usage: node tests/floor-measure.mjs [url] [label]
//        FLOOR_DETAIL=1 node tests/floor-measure.mjs   # also prints the offending literals
//
// Measures the *served* page, not the source, because this app's entire stylesheet is emitted
// from getCSS() into a single inline <style> block — a CSS-file-only pass measures nothing here.
const url = process.argv[2] || "http://localhost:3010/";
const label = process.argv[3] || "row";
const html = await (await fetch(url)).text();
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const inlineStyles = [...html.matchAll(/\sstyle="/g)].length;

const hex = new Set([...styles.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()));
const rgb = new Set([...styles.matchAll(/rgba?\([^)]*\)/g)].map((m) => m[0].replace(/\s+/g, "")));
const hsl = new Set([...styles.matchAll(/hsla?\([^)]*\)/g)].map((m) => m[0].replace(/\s+/g, "")));

const fsDecls = [...styles.matchAll(/font-size\s*:\s*([^;}\n]+)/g)].map((m) => m[1].trim());
const fsLiteralVals = new Set(fsDecls.filter((v) => !v.startsWith("var(")));

const props = new Set([...styles.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
const varUses = [...styles.matchAll(/var\(--/g)].length;

// Token-declaration blocks: :root, :root:not([data-theme]) and [data-theme="…"]. A literal is
// allowed to live in one of these and nowhere else.
const declBlocks = [...styles.matchAll(/(:root(?::not\(\[data-theme\]\))?|\[data-theme="[^"]*"\])\s*\{([\s\S]*?)\}/g)]
  .map((m) => m[2]).join("\n");
const hexInDecl = new Set([...declBlocks.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()));
const hexOutside = [...hex].filter((h) => !hexInDecl.has(h));

const row = {
  label,
  cssChars: styles.length,
  colours_total: hex.size + rgb.size + hsl.size,
  hex: hex.size, rgb: rgb.size, hsl: hsl.size,
  hexOutsideTokenBlocks: hexOutside.length,
  fontsize_distinct_literal: fsLiteralVals.size,
  fontsize_decls: fsDecls.length,
  fontsize_literal_decls: fsDecls.filter((v) => !v.startsWith("var(") && !v.startsWith("inherit")).length,
  customprops: props.size,
  varUses,
  important: [...styles.matchAll(/!important/g)].length,
  focusVisible: [...styles.matchAll(/:focus-visible/g)].length,
  bareFocus: [...styles.matchAll(/:focus(?![-\w])/g)].length,
  darkBlocks: [...styles.matchAll(/@media[^{]*prefers-color-scheme\s*:\s*dark/g)].length,
  themeAttrSelectors: [...styles.matchAll(/\[data-theme=/g)].length,
  prefersReducedMotion: [...styles.matchAll(/@media[^{]*prefers-reduced-motion/g)].length,
  inlineStyleAttrs: inlineStyles,
};
console.log(JSON.stringify(row, null, 2));
if (process.env.FLOOR_DETAIL) {
  console.log("HEX OUTSIDE TOKEN BLOCKS:", hexOutside.sort().join(" ") || "(none)");
  console.log("LITERAL FONT SIZES:", [...fsLiteralVals].sort().join(" | ") || "(none)");
}
