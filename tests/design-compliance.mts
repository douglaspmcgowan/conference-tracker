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
    if (w === 1440) {
      const top = await p.evaluate((view) => {
        const sel = { timeline: ".tlcal-row, .timeline-svg", cards: ".card", table: "tbody tr", map: ".map-svg" }[view]!;
        const e = document.querySelector(sel.split(", ").map(x => "#view-" + view + " " + x).join(", ")); return e ? Math.round(e.getBoundingClientRect().top) : -1;
      }, v);
      console.log("  first data top at 1440x900:", v, top);
      if (top < 0 || top >= 900) failures.push(tag + ": first data element top " + top + " is not above y=900");
    }
    if (shots && theme==="light") await p.screenshot({ path: `${shots}/${v}-${w}.png`, fullPage: false });
  }
  await ctx.close();
}

// ---- Component state assertions (packet 2): sprite, icons, tab order, ring, empty, suggest, modal, region error ----
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(() => { localStorage.clear(); });
  await p.click('button[data-view="cards"]'); await p.waitForTimeout(200);
  const facts = await p.evaluate(() => {
    const text = document.body.innerText;
    const radii = [...document.querySelectorAll("*")].filter(e => /999px/.test(getComputedStyle(e).borderRadius)).length;
    const years = [...document.querySelectorAll(".year")].map(e => e.textContent || "");
    return {
      sprites: document.querySelectorAll("svg.sprite").length,
      symbols: [...document.querySelectorAll("svg.sprite symbol")].map(e => e.id),
      glyphs: (text.match(/[☀-⛿←-⇿★☆]/g) || []).length,
      radii, ago: /\bago\b/.test(text), badYears: years.filter(y => !/^\d{4}$/.test(y)).length, nYears: years.length,
    };
  });
  const need = ["sun","moon","star","star-filled","external-link","calendar-down","plus","search","x","check","chevron-down","arrows-sort","filter"];
  if (facts.sprites !== 1) failures.push("sprite count " + facts.sprites);
  for (const n of need) if (!facts.symbols.includes("i-" + n)) failures.push("sprite missing " + n);
  if (facts.glyphs) failures.push(facts.glyphs + " icon glyph characters in rendered text");
  if (facts.radii) failures.push(facts.radii + " elements with a 999px radius");
  if (facts.ago) failures.push("countdown text contains ago");
  if (facts.badYears || !facts.nYears) failures.push("venue years not four digits: " + facts.badYears + "/" + facts.nYears);
  const shell = await (await fetch(url)).text();
  if (!/skeleton-row/.test(shell)) failures.push("no loading skeleton in the page shell");

  // Tab order and the 2px accent ring
  await p.click('button[data-view="timeline"]'); await p.waitForTimeout(200);
  await p.evaluate(() => { window.scrollTo(0, 0); });
  await p.focus("#themeBtn");
  const seen: string[] = ["themeBtn"]; let ringBad = 0;
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const e = document.activeElement as HTMLElement; const s = getComputedStyle(e);
      const acc = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const probe = document.createElement("i"); probe.style.color = acc; document.body.appendChild(probe); const accRgb = getComputedStyle(probe).color; probe.remove();
      const tag = e.id || (e.dataset.view ? "view:" + e.dataset.view : "") || (e.dataset.field ? "field:" + e.dataset.field : "") || (e.dataset.tier ? "tier:" + e.dataset.tier : "") || (e.dataset.window ? "win:" + e.dataset.window : "") || (e.dataset.mode ? "mode:" + e.dataset.mode : "") || String(e.className || e.tagName);
      return { tag, ring: s.outlineStyle === "solid" && s.outlineWidth === "2px" && s.outlineColor === accRgb && s.outlineOffset === "2px" };
    });
    seen.push(r.tag); if (!r.ring && r.tag !== "BODY") ringBad++;
  }
  const order = ["themeBtn","view:timeline","view:cards","view:table","view:map","searchInput","viewbar-action","submitConfBtn","field:HCI","tier:all","tier:A*","tier:industry","tier:journal","win:30","win:90","win:180","win:all","sortSelect","mode:calendar","mode:gantt"];
  let at = -1; const missing: string[] = [];
  for (const o of order) { const i = seen.indexOf(o, at + 1); if (i < 0) missing.push(o); else at = i; }
  if (!(await p.locator("#starredOnly").isDisabled())) failures.push("starred-only should be disabled while nothing is starred");
  if (missing.length) failures.push("tab order missing or out of order: " + missing.join(",") + " in " + seen.join(">"));
  if (ringBad) failures.push(ringBad + " focus stops without the 2px accent ring");
  if ((await p.locator("#fieldChips .chip").count()) !== 14 || (await p.locator("#tierChips .chip").count()) !== 6 || (await p.locator("#windowChips .chip").count()) !== 4) failures.push("chip counts changed");

  // Selected chip shows a check; empty state and Clear filters
  await p.click('#tierChips .chip[data-tier="A*"]');
  const chk = await p.evaluate(() => { const c = document.querySelector('#tierChips .chip[data-tier="A*"] .chip-check') as HTMLElement; return c ? getComputedStyle(c).display : "none"; });
  if (chk === "none") failures.push("selected chip has no check icon");
  await p.click('#tierChips .chip[data-tier="all"]');
  await p.click('button[data-view="cards"]'); await p.waitForTimeout(200);
  const full = await p.locator(".card").count();
  await p.fill("#searchInput", "zzzzqqqq"); await p.waitForTimeout(400);
  const empty = await p.evaluate(() => ({ state: !!document.querySelector(".region-empty"), btn: !!document.querySelector(".region-empty [data-clear-filters]"), cards: document.querySelectorAll(".card").length, clear: !(document.getElementById("searchClear") as HTMLElement).hidden }));
  if (!empty.state || !empty.btn || empty.cards) failures.push("empty state missing for zero results");
  if (!empty.clear) failures.push("search clear button hidden while filled");
  await p.click(".region-empty [data-clear-filters]"); await p.waitForTimeout(300);
  if ((await p.locator(".card").count()) !== full) failures.push("Clear filters did not restore the list");

  // Detail modal: opens from the keyboard, traps focus, Escape closes
  await p.focus(".card"); await p.keyboard.press("Enter"); await p.waitForTimeout(250);
  let trapped = true;
  for (let i = 0; i < 25; i++) { await p.keyboard.press("Tab"); if (!(await p.evaluate(() => !!document.activeElement?.closest("#detailModal")))) trapped = false; }
  if (!trapped) failures.push("focus escaped the detail modal");
  await p.fill("#modal-notes", "state check"); await p.waitForTimeout(500);
  if (!/Saved/.test(await p.locator("#trackSaved").innerText())) failures.push("notes saved text missing");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  if (!(await p.evaluate(() => document.getElementById("detailModal")!.classList.contains("hidden")))) failures.push("Escape did not close the detail modal");

  // Suggest modal: invalid, error, sent
  await p.click("#submitConfBtn"); await p.waitForTimeout(250);
  await p.click("#suggestSubmit"); await p.waitForTimeout(100);
  const inv = await p.evaluate(() => ({ m: document.getElementById("sg-name-msg")!.textContent, l: document.getElementById("sg-link-msg")!.textContent, a: document.getElementById("sg-name")!.getAttribute("aria-invalid") }));
  if (!/venue name/i.test(inv.m || "") || !/link/i.test(inv.l || "") || inv.a !== "true") failures.push("suggest invalid state wrong: " + JSON.stringify(inv));
  await p.fill("#sg-name", "Test venue"); await p.fill("#sg-link", "https://example.org/cfp");
  await p.evaluate(() => { window.open = () => null; });
  await p.click("#suggestSubmit"); await p.waitForTimeout(200);
  const err = await p.evaluate(() => ({ cls: document.getElementById("suggestStatus")!.className, btn: document.getElementById("suggestSubmit")!.textContent }));
  if (!/error/.test(err.cls) || err.btn !== "Retry") failures.push("suggest error state wrong: " + JSON.stringify(err));
  await p.evaluate(() => { window.open = (() => ({})) as typeof window.open; });
  await p.click("#suggestSubmit"); await p.waitForTimeout(200);
  if (!/sent/.test(await p.evaluate(() => document.getElementById("suggestStatus")!.className))) failures.push("suggest sent state wrong");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  await ctx.close();

  // Region error state: data that never loads shows the error with Retry in every region
  const ectx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const ep = await ectx.newPage();
  await ep.addInitScript(() => { Object.defineProperty(window, "__DATA__", { configurable: true, get() { return undefined; }, set() {} }); });
  await ep.goto(url, { waitUntil: "networkidle" });
  const regionErr = await ep.evaluate(() => [...document.querySelectorAll(".view")].map(v => !!v.querySelector(".region-error [data-retry]")));
  if (regionErr.length !== 4 || regionErr.some(x => !x)) failures.push("error state with Retry missing: " + JSON.stringify(regionErr));
  await ectx.close();
}

// ---- Layout and motion assertions (packet 3): rail, readout, sort, rows, container queries, FLIP, reduced motion, ledger at 375 ----
{
  const api = await (await fetch(new URL("/api/conferences", url))).json();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parse = (d: string | null) => d ? new Date(d.replace(/X/g, "1") + "T00:00:00") : null;
  const inNext = (months: number) => { const end = new Date(today); end.setMonth(end.getMonth() + months); return api.conferences.filter((c: any) => { const d = parse(c.deadline); return d && d >= today && d < end; }).length; };
  const openIds = new Set(api.conferences.filter((c: any) => { const d = parse(c.deadline); return d && d >= today; }).map((c: any) => c.id));

  // 1440: layout, rail, readout, default sort, spec line, countdown column, containers
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(() => { localStorage.clear(); }); await p.reload({ waitUntil: "networkidle" });
  const lay = await p.evaluate(() => {
    const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    const f = document.getElementById("filters") as HTMLDetailsElement;
    return {
      appbar: r(".appbar").height,
      sticky: getComputedStyle(f).position, open: f.open, filtersRight: Math.round(r("#filters").right), mainLeft: Math.round(r("#main").left),
      ticks: document.querySelectorAll("#yearRail .rail-tick").length, railCount: Number(document.getElementById("railCount")!.dataset.count),
      svgText: !!document.querySelector("#yearRail svg title") && !!document.querySelector("#yearRail svg desc"),
      stripType: getComputedStyle(document.querySelector(".strip-box")!).containerType, stripPad: parseFloat(getComputedStyle(document.querySelector(".strip-box")!).paddingLeft),
      searchInBar: !!document.querySelector(".viewbar #searchInput"), actionsInBar: document.querySelectorAll(".viewbar .viewbar-action").length,
    };
  });
  console.log("layout 1440", JSON.stringify(lay));
  if (lay.sticky !== "sticky" || !lay.open) failures.push("1440: filters are not an open sticky rail");
  if (lay.filtersRight > lay.mainLeft) failures.push("1440: filter rail overlaps the data column");
  if (lay.appbar > 90) failures.push("1440: app bar is not one line (" + lay.appbar + "px)");
  if (lay.ticks !== inNext(12) || lay.railCount !== lay.ticks) failures.push("year rail ticks " + lay.ticks + " / reported " + lay.railCount + " vs " + inNext(12) + " deadlines in the next 12 months");
  if (!lay.svgText) failures.push("year rail has no text alternative");
  if (lay.stripType !== "inline-size") failures.push("deadline strip is not a container");
  if (lay.stripPad !== 24) failures.push("1440: strip padding " + lay.stripPad + " expected clamp max 24");
  if (!lay.searchInBar || lay.actionsInBar !== 2) failures.push("search or actions missing from the view bar");
  const readPx = await p.evaluate(() => { const probe = document.createElement("i"); probe.style.fontSize = "var(--fs-display)"; document.body.appendChild(probe); const v = getComputedStyle(probe).fontSize; probe.remove(); return [getComputedStyle(document.querySelector(".readout-num")!).fontSize, v]; });
  if (readPx[0] !== readPx[1]) failures.push("readout number is not at --fs-display: " + readPx.join(" vs "));

  await p.click('button[data-view="table"]'); await p.waitForTimeout(300);
  const tab = await p.evaluate(() => {
    const first = document.querySelector("tbody tr") as HTMLElement; const cells = [...first.querySelectorAll("td")];
    const dl = first.querySelector("td.c-deadline") as HTMLElement; const cd = dl.querySelector(".card-countdown") as HTMLElement;
    return {
      id: first.dataset.id, closed: first.classList.contains("closed"), cdText: cd.textContent, dlW: dl.getBoundingClientRect().width, maxOther: Math.max(...cells.filter(c => c !== dl).map(c => c.getBoundingClientRect().width)),
      align: getComputedStyle(dl).textAlign, weight: getComputedStyle(cd).fontWeight, rowsType: getComputedStyle(document.querySelector(".table-wrap")!).containerType,
      specs: [...document.querySelectorAll("tbody .spec")].map(e => e.textContent || ""),
    };
  });
  if (!openIds.has(tab.id) || tab.closed || /^closed/.test(tab.cdText || "")) failures.push("default sort: first table row is not an open deadline (" + tab.id + ")");
  if (!(tab.dlW > tab.maxOther)) failures.push("countdown column is not the widest cell: " + tab.dlW + " vs " + tab.maxOther);
  if (tab.align !== "right" || tab.weight !== "600") failures.push("countdown not right-aligned weight 600: " + tab.align + " " + tab.weight);
  if (tab.rowsType !== "inline-size") failures.push("table is not a container");
  if (tab.specs.some(t => /^\s*·|·\s*·|·\s*$/.test(t)) || !tab.specs.length) failures.push("spec line has empty values or is missing in the table");
  await p.click('button[data-view="cards"]'); await p.waitForTimeout(300);
  const cardFacts = await p.evaluate(() => ({ spec: document.querySelectorAll(".card .card-spec").length, type: getComputedStyle(document.querySelector(".card")!).containerType, journal: [...document.querySelectorAll(".card")].filter(c => /Journal/.test(c.querySelector(".card-spec")?.textContent || "")).every(c => !/Tier/.test(c.querySelector(".card-spec")!.textContent!)) }));
  if (cardFacts.spec < 1 || cardFacts.type !== "inline-size" || !cardFacts.journal) failures.push("cards: spec line or container missing " + JSON.stringify(cardFacts));

  // FLIP: a filter change moves surviving rows with a 160ms transform transition
  await p.click('button[data-view="table"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { (window as any).__tr = []; document.addEventListener("transitionrun", (e) => { const t = e as TransitionEvent; const el = t.target as Element; if (t.propertyName === "transform" && el.closest("tbody tr, .card")) (window as any).__tr.push(getComputedStyle(el).transitionDuration); }, true); });
  await p.click('#tierChips .chip[data-tier="A*"]'); await p.waitForTimeout(450);
  const tr = await p.evaluate(() => (window as any).__tr as string[]);
  console.log("flip transitions", tr.length, [...new Set(tr)].join(","));
  if (!tr.length || tr.some(d => d !== "0.16s")) failures.push("re-sort did not run 160ms transform transitions: " + tr.length + " " + [...new Set(tr)].join(","));
  await p.click('#tierChips .chip[data-tier="all"]');
  await ctx.close();

  // reduced motion: no transition or animation runs on a filter change, a view switch or a star
  const rctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const rp = await rctx.newPage(); await rp.goto(url, { waitUntil: "networkidle" });
  await rp.click('button[data-view="table"]'); await rp.waitForTimeout(300);
  await rp.evaluate(() => { (window as any).__any = 0; for (const ev of ["transitionrun", "animationstart"]) document.addEventListener(ev, () => { (window as any).__any++; }, true); });
  await rp.click('#tierChips .chip[data-tier="A*"]'); await rp.waitForTimeout(300);
  await rp.click('button[data-view="cards"]'); await rp.waitForTimeout(300);
  await rp.locator(".card .star-btn").first().click(); await rp.waitForTimeout(300);
  const ran = await rp.evaluate(() => (window as any).__any as number);
  if (ran) failures.push("reduced motion: " + ran + " transitions or animations ran");
  await rctx.close();

  // 768 and 375: details block, table restack, rail months, ledger with the filters block opened
  for (const w of [768, 375]) {
    const c2 = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const q = await c2.newPage(); await q.goto(url, { waitUntil: "networkidle" });
    await q.evaluate(() => { localStorage.clear(); }); await q.reload({ waitUntil: "networkidle" });
    const f = await q.evaluate(() => ({ open: (document.getElementById("filters") as HTMLDetailsElement).open, count: document.getElementById("filtersCount")!.textContent, sticky: getComputedStyle(document.getElementById("filters")!).position, ticks: document.querySelectorAll("#yearRail .rail-tick").length, pad: parseFloat(getComputedStyle(document.querySelector(".strip-box")!).paddingLeft), hs: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    const want = w === 375 ? inNext(6) : inNext(12);
    if (f.open || f.sticky === "sticky" || f.count !== "0 active") failures.push(w + ": filters should be a closed details block with a count: " + JSON.stringify(f));
    if (f.ticks !== want) failures.push(w + ": rail ticks " + f.ticks + " vs " + want);
    if (f.hs !== 0) failures.push(w + ": scrollWidth differs from clientWidth");
    if (w === 375 && f.pad !== 16) failures.push("375: strip padding " + f.pad + " expected 16");
    await q.click("#filtersSummary"); await q.waitForTimeout(100);
    await q.click('#tierChips .chip[data-tier="A*"]');
    if ((await q.locator("#filtersCount").innerText()) !== "1 active") failures.push(w + ": active count did not update");
    await q.click('#tierChips .chip[data-tier="all"]');
    const need: Record<string, number> = { "#themeBtn": 1, ".view-tab": 4, 'a.viewbar-action[href="/cal.ics"]': 1, "#submitConfBtn": 1, "#fieldChips .chip": 14, "#tierChips .chip": 6, "#sortSelect": 1, "#windowChips .chip": 4, "#searchInput": 1, "#starredOnly": 1 };
    for (const [sel, n] of Object.entries(need)) {
      const vis = await q.locator(sel).evaluateAll((els) => els.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length);
      if (vis !== n) failures.push(w + ": ledger control " + sel + " visible " + vis + " of " + n);
    }
    await q.click('button[data-view="cards"]'); await q.waitForTimeout(250);
    if ((await q.locator("#cardDensityGroup [data-density]").count()) !== 3 || (await q.locator(".card .star-btn").count()) < 1) failures.push(w + ": cards controls missing");
    await q.click('button[data-view="timeline"]'); await q.waitForTimeout(250);
    if ((await q.locator("#tlModeGroup [data-mode]").count()) !== 2) failures.push(w + ": calendar and gantt switch missing");
    if (w === 375) {
      await q.click('button[data-view="table"]'); await q.waitForTimeout(250);
      const rs = await q.evaluate(() => { const tr = document.querySelector("tbody tr")!; const t = (tr.querySelector(".c-venue") as HTMLElement).getBoundingClientRect(); const d = (tr.querySelector(".c-deadline") as HTMLElement).getBoundingClientRect(); return { display: getComputedStyle(tr).display, sameLine: Math.abs(t.top - d.top) < 8 }; });
      if (rs.display !== "grid" || !rs.sameLine) failures.push("375: table rows did not restack " + JSON.stringify(rs));
    }
    await c2.close();
  }
}
await b.close();
if (failures.length) { console.error(failures.join(", ")); process.exit(1); }
console.log("design compliance: pass");
