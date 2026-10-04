import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
// Design compliance gate: for every view, theme and width, no horizontal scroll, at most three font sizes and
// three weights, one font family, no uppercase text, every control at least 44 by 44 px, zero axe violations.
// Usage: node tests/design-compliance.mts [url] [screenshot-dir]
const url = process.argv[2] || "http://localhost:3010/";
const shots = process.argv[3] || "";
const failures: string[] = [];
const b = await chromium.launch({ channel: "chrome" });
for (const w of [375, 768, 1440]) for (const theme of ["light","dark"]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate((t)=>document.documentElement.setAttribute("data-theme",t), theme);
  for (const v of ["timeline","cards","table","map"]) {
    await p.click(`button[data-view="${v}"]`); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const vis = [...document.querySelectorAll("body *")].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display!=="none" && s.visibility!=="hidden" && r.width>0 && r.height>0 && e.closest(".hidden")==null && !["svg","path","circle","rect","line","g","text","tspan","defs","style","script"].includes(e.tagName.toLowerCase()) && !e.closest("svg") && [...e.childNodes].some(n=>n.nodeType===3&&n.textContent?.trim()); });
      const sizes = new Set(vis.map(e=>getComputedStyle(e).fontSize)); const wts = new Set(vis.map(e=>getComputedStyle(e).fontWeight));
      const fams = new Set(vis.map(e=>getComputedStyle(e).fontFamily.split(",")[0]));
      const small = []; const tt = [];
      for (const e of document.querySelectorAll("button, a[href], select, input, label.starred-toggle, [role=button]")) { const r=e.getBoundingClientRect(); const s=getComputedStyle(e); if(!r.width||s.visibility==="hidden"||e.closest(".hidden")) continue; if((e as HTMLInputElement).type==="checkbox") continue; if (r.width<43.5||r.height<43.5) small.push((e.className||e.tagName)+" "+Math.round(r.width)+"x"+Math.round(r.height)); }
      const clipped = vis.filter(e=>{const s=getComputedStyle(e); return e.scrollWidth>e.clientWidth+1 && (s.overflow==="hidden"||s.textOverflow==="ellipsis") && e.clientWidth>0;}).map(e=>e.className||e.tagName).slice(0,5);
      const upper = vis.filter(e=>getComputedStyle(e).textTransform==="uppercase").length;
      const phClipped = [...document.querySelectorAll("input[placeholder], textarea[placeholder]")].filter(e => { const i = e as HTMLInputElement; const st = getComputedStyle(i); if (!i.getBoundingClientRect().width || i.closest(".hidden")) return false; const c = document.createElement("canvas").getContext("2d")!; c.font = st.fontWeight + " " + st.fontSize + " " + st.fontFamily; return c.measureText(i.placeholder).width > i.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) && i.tagName === "INPUT"; }).map(e => e.id || e.tagName);
      return { phClipped, hs: document.documentElement.scrollWidth>document.documentElement.clientWidth, sizes:[...sizes], wts:[...wts], fams:[...fams], small:[...new Set(small)].slice(0,8), nsmall: small.length, clipped, upper };
    });
    const ax = await new AxeBuilder({ page: p }).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    console.log(w, theme, v, JSON.stringify(r), "axe:", ax.violations.map(x=>x.id+"x"+x.nodes.length).join(","));
    const tag = w+" "+theme+" "+v;
    if (r.hs) failures.push(tag+": horizontal scroll");
    if (r.sizes.length>3) failures.push(tag+": "+r.sizes.length+" font sizes");
    if (r.wts.length>3) failures.push(tag+": "+r.wts.length+" font weights");
    if (r.fams.length>1) failures.push(tag+": "+r.fams.length+" font families");
    if (r.upper) failures.push(tag+": uppercase text");
    if (r.nsmall) failures.push(tag+": "+r.nsmall+" targets under 44px");
    if (r.phClipped.length) failures.push(tag+": placeholder clipped "+r.phClipped.join(","));
    if (r.clipped.length) failures.push(tag+": clipped text");
    if (ax.violations.length) failures.push(tag+": axe "+ax.violations.map(x=>x.id).join(","));
    if (shots && theme==="light") await p.screenshot({ path: `${shots}/${v}-${w}.png`, fullPage: false });
  }
  await ctx.close();
}
await b.close();
if (failures.length) { console.error(failures.join(", ")); process.exit(1); }
console.log("design compliance: pass");
