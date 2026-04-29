// Playwright end-to-end verification of the live Vercel deploy.
// Run: node tests/verify-live.mjs [URL]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = process.argv[2] || "https://conference-tracker-rho.vercel.app/";
const SHOTS = path.resolve("tests/screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
const log = (...a) => console.log(...a);
const ok = (msg) => log("  ✓", msg);
const fail = (msg) => { errors.push(msg); log("  ✗", msg); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  page.on("pageerror", (e) => fail(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") fail(`console.error: ${m.text()}`); });

  log("\nNavigating to", URL);
  const res = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  if (!res || !res.ok()) fail(`HTTP ${res?.status()}`);
  else ok(`HTTP ${res.status()}`);

  log("\nMasthead + data");
  const title = await page.title();
  title === "AI & Design — Conference Tracker" ? ok("title correct") : fail(`title: ${title}`);
  const eyebrow = await page.locator(".brand-eyebrow").innerText();
  /AI\s*&\s*Design/i.test(eyebrow) ? ok(`brand eyebrow: ${eyebrow}`) : fail(`eyebrow: ${eyebrow}`);
  const h1 = await page.locator(".brand-title").innerText();
  /Engineering Design Conference Tracker/.test(h1) ? ok(`brand title: ${h1.replace(/\s+/g, " ").trim()}`) : fail(`h1: ${h1}`);
  const faviconRes = await page.request.get(URL.replace(/\/$/, "") + "/favicon.svg");
  faviconRes.ok() ? ok("favicon.svg served") : fail(`favicon.svg: ${faviconRes.status()}`);
  const stats = await page.locator("#stats").innerText();
  /\d+\s*conferences/i.test(stats) ? ok(`stats: ${stats.replace(/\s+/g, " ").trim()}`) : fail(`stats malformed: ${stats}`);

  const dataInfo = await page.evaluate(() => ({
    confs: window.__DATA__?.conferences?.length || 0,
    fields: Object.keys(window.__DATA__?.fields || {}).length,
    verified: window.__DATA__.conferences.filter(c => c.confidence === "verified").length,
  }));
  dataInfo.confs >= 100 ? ok(`${dataInfo.confs} conferences loaded`) : fail(`only ${dataInfo.confs} conferences`);
  dataInfo.fields >= 10 ? ok(`${dataInfo.fields} field categories`) : fail(`only ${dataInfo.fields} fields`);
  dataInfo.verified >= 50 ? ok(`${dataInfo.verified} verified-confidence entries`) : fail(`only ${dataInfo.verified} verified`);

  log("\nTimeline view (calendar mode — default)");
  // Timeline view restored from localStorage may not start at timeline; click to be sure.
  await page.click('.view-tab[data-view="timeline"]');
  await page.waitForTimeout(200);
  // Default mode is now calendar — make sure the toggle is visible and active.
  await page.click('#tlModeGroup [data-mode="calendar"]');
  await page.waitForTimeout(200);
  const cal = await page.evaluate(() => ({
    monthRows: document.querySelectorAll(".tlcal-row").length,
    cells: document.querySelectorAll(".tlcal-cell").length,
    deadlineCells: document.querySelectorAll(".tlcal-cell.has-deadline").length,
    todayCells: document.querySelectorAll(".tlcal-cell.today").length,
    activeMode: document.querySelector("#tlModeGroup .active")?.textContent || "",
  }));
  cal.activeMode === "Calendar" ? ok("calendar mode active") : fail(`mode: ${cal.activeMode}`);
  cal.monthRows >= 12 ? ok(`${cal.monthRows} month rows`) : fail(`only ${cal.monthRows} months`);
  cal.deadlineCells >= 20 ? ok(`${cal.deadlineCells} deadline cells`) : fail(`only ${cal.deadlineCells} deadline cells`);
  cal.todayCells === 1 ? ok("today cell highlighted") : fail(`today cells: ${cal.todayCells}`);

  await page.screenshot({ path: path.join(SHOTS, "01a-timeline-calendar.png"), fullPage: false });
  ok("screenshot: 01a-timeline-calendar.png");

  log("\nTimeline view (gantt mode — toggle)");
  await page.click('#tlModeGroup [data-mode="gantt"]');
  await page.waitForTimeout(250);
  const tl = await page.evaluate(() => ({
    rows: document.querySelectorAll(".tl-row").length,
    deadlineMarkers: document.querySelectorAll(".timeline-deadline-marker").length,
    confBars: document.querySelectorAll(".tl-conf").length,
    todayLabelExists: Array.from(document.querySelectorAll("text")).some(t => t.textContent === "TODAY"),
    svgExists: !!document.querySelector(".timeline-svg"),
  }));
  tl.svgExists ? ok("gantt SVG rendered") : fail("no timeline SVG");
  tl.rows >= 80 ? ok(`${tl.rows} timeline rows`) : fail(`only ${tl.rows} rows`);
  tl.deadlineMarkers >= 50 ? ok(`${tl.deadlineMarkers} deadline markers`) : fail(`only ${tl.deadlineMarkers} markers`);
  tl.confBars >= 50 ? ok(`${tl.confBars} conference bars`) : fail(`only ${tl.confBars} conference bars`);
  tl.todayLabelExists ? ok("TODAY axis label present") : fail("missing TODAY label");

  await page.screenshot({ path: path.join(SHOTS, "01b-timeline-gantt.png"), fullPage: false });
  ok("screenshot: 01b-timeline-gantt.png");
  // Reset to calendar default for the rest of the suite
  await page.click('#tlModeGroup [data-mode="calendar"]');
  await page.waitForTimeout(150);

  log("\nCards view + density toggle");
  await page.click('.view-tab[data-view="cards"]');
  await page.waitForTimeout(200);
  const cards = await page.evaluate(() => ({
    cardCount: document.querySelectorAll(".card").length,
    starButtons: document.querySelectorAll(".star-btn").length,
    cfpLinks: document.querySelectorAll(".card-link").length,
    sampleNames: Array.from(document.querySelectorAll(".card-name")).slice(0, 3).map(n => n.textContent.trim()),
    hasDensityToggle: !!document.getElementById("cardDensityGroup"),
    activeDensity: document.querySelector("#cardDensityGroup .active")?.textContent || "",
  }));
  cards.cardCount >= 100 ? ok(`${cards.cardCount} cards rendered`) : fail(`only ${cards.cardCount} cards`);
  cards.starButtons === cards.cardCount ? ok("each card has star button") : fail(`star count mismatch: ${cards.starButtons}/${cards.cardCount}`);
  cards.cfpLinks === cards.cardCount ? ok("each card has CFP link") : fail(`link count mismatch`);
  cards.hasDensityToggle ? ok(`density toggle visible (active: ${cards.activeDensity})`) : fail("density toggle missing");
  log("    sample:", cards.sampleNames.join(" | "));

  await page.click('#cardDensityGroup [data-density="spacious"]');
  await page.waitForTimeout(150);
  const spaciousCls = await page.evaluate(() => document.querySelector(".cards-grid")?.className || "");
  /density-spacious/.test(spaciousCls) ? ok("spacious density applied") : fail(`grid: ${spaciousCls}`);
  await page.click('#cardDensityGroup [data-density="comfortable"]');
  await page.waitForTimeout(150);

  await page.screenshot({ path: path.join(SHOTS, "02-cards.png"), fullPage: false });
  ok("screenshot: 02-cards.png");

  log("\nTable view + sort");
  await page.click('.view-tab[data-view="table"]');
  await page.waitForTimeout(200);
  const tbl1 = await page.evaluate(() => ({
    rows: document.querySelectorAll("table.confs tbody tr").length,
    firstRow: document.querySelector("table.confs tbody tr td:nth-child(2)")?.textContent.trim(),
  }));
  tbl1.rows >= 100 ? ok(`${tbl1.rows} table rows`) : fail(`only ${tbl1.rows} rows`);

  await page.click('table.confs th[data-sort="name"]');
  await page.waitForTimeout(150);
  const tbl2 = await page.evaluate(() => document.querySelector("table.confs tbody tr td:nth-child(2)")?.textContent.trim());
  tbl1.firstRow !== tbl2 ? ok(`sort by name changed first row: "${tbl1.firstRow}" → "${tbl2}"`) : fail("sort did not change order");

  await page.screenshot({ path: path.join(SHOTS, "03-table.png"), fullPage: false });
  ok("screenshot: 03-table.png");

  log("\nFiltering");
  await page.click('.view-tab[data-view="cards"]');
  await page.waitForTimeout(150);
  const beforeFilter = await page.locator(".card").count();
  await page.click('#fieldChips .chip[data-field="HCI"]');
  await page.waitForTimeout(200);
  const afterFilter = await page.locator(".card").count();
  afterFilter > 0 && afterFilter < beforeFilter ? ok(`HCI filter narrowed cards: ${beforeFilter} → ${afterFilter}`) : fail(`filter broken: ${beforeFilter} → ${afterFilter}`);
  await page.click('#fieldChips .chip[data-field="HCI"]');
  await page.waitForTimeout(200);

  log("\nSearch");
  await page.fill("#searchInput", "neurips");
  await page.waitForTimeout(250);
  const searchResults = await page.locator(".card").count();
  searchResults > 0 ? ok(`search 'neurips' returned ${searchResults} cards`) : fail("search returned 0");
  await page.fill("#searchInput", "");
  await page.waitForTimeout(200);

  log("\nModal detail");
  await page.click(".card");
  await page.waitForTimeout(200);
  const modalOpen = await page.evaluate(() => !document.getElementById("detailModal").classList.contains("hidden"));
  modalOpen ? ok("modal opens on card click") : fail("modal did not open");
  const modalText = await page.locator("#modalBody").innerText();
  /Schedule|Where|Submission/i.test(modalText) ? ok("modal has Schedule / Where / Submission sections") : fail("modal missing sections");
  await page.screenshot({ path: path.join(SHOTS, "04-modal.png"), fullPage: false });
  ok("screenshot: 04-modal.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  log("\nDark mode");
  await page.click("#themeBtn");
  await page.waitForTimeout(200);
  const darkOn = await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark");
  darkOn ? ok("dark mode toggled") : fail("dark mode did not toggle");
  await page.screenshot({ path: path.join(SHOTS, "05-dark.png"), fullPage: false });
  ok("screenshot: 05-dark.png");

  log("\nMap view");
  await page.click('.view-tab[data-view="map"]');
  await page.waitForTimeout(300);
  const mapInfo = await page.evaluate(() => ({
    svg: !!document.querySelector(".map-svg"),
    markers: document.querySelectorAll(".map-marker").length,
    continents: document.querySelectorAll(".map-continent").length,
    meta: document.querySelector(".map-meta")?.innerText.replace(/\s+/g, " ").trim() || "",
  }));
  mapInfo.svg ? ok("map SVG rendered") : fail("no map SVG");
  mapInfo.markers >= 50 ? ok(`${mapInfo.markers} city markers`) : fail(`only ${mapInfo.markers} markers`);
  mapInfo.continents >= 7 ? ok(`${mapInfo.continents} continent outlines drawn`) : fail(`only ${mapInfo.continents} continents`);
  /\d+ with known city/.test(mapInfo.meta) ? ok(`map meta: ${mapInfo.meta.slice(0, 60)}…`) : fail("map meta missing");
  await page.screenshot({ path: path.join(SHOTS, "07-map.png"), fullPage: false });
  ok("screenshot: 07-map.png");

  log("\nJournal tier filter");
  await page.click('.view-tab[data-view="cards"]');
  await page.waitForTimeout(150);
  await page.click('#tierChips .chip[data-tier="journal"]');
  await page.waitForTimeout(200);
  const journalCards = await page.locator(".card").count();
  journalCards > 0 && journalCards < 30 ? ok(`journal tier filtered to ${journalCards}`) : fail(`journal filter wrong: ${journalCards}`);
  await page.click('#tierChips .chip[data-tier="all"]');
  await page.waitForTimeout(200);

  log("\nSort dropdown");
  await page.selectOption("#sortSelect", "name-asc");
  await page.waitForTimeout(200);
  const firstByName = await page.locator(".card-name").first().innerText();
  /^A/.test(firstByName.trim()) ? ok(`sort name-asc puts A* first: ${firstByName.replace(/\s+/g, " ").trim()}`) : fail(`sort wrong: ${firstByName}`);

  log("\nURL hash state");
  const hash = await page.evaluate(() => location.hash);
  /sort=name-asc/.test(hash) ? ok(`hash reflects sort: ${hash}`) : fail(`hash missing sort: ${hash}`);

  log("\niCal export");
  const icsRes = await page.request.get(URL.replace(/\/$/, "") + "/cal.ics");
  const icsOk = icsRes.ok();
  const icsText = await icsRes.text();
  icsOk && icsText.startsWith("BEGIN:VCALENDAR") ? ok("/cal.ics returns valid VCALENDAR") : fail(`cal.ics broken: ${icsRes.status()}`);
  /BEGIN:VEVENT[\s\S]+UID:.+@conference-tracker[\s\S]+END:VEVENT/.test(icsText) ? ok("contains VEVENT entries") : fail("no VEVENT in ics");

  log("\nNotes + status (modal)");
  await page.selectOption("#sortSelect", "deadline-asc");
  await page.waitForTimeout(150);
  await page.click(".card");
  await page.waitForTimeout(150);
  const hasStatus = await page.locator("#modal-status").count();
  const hasNotes = await page.locator("#modal-notes").count();
  hasStatus === 1 ? ok("modal has status select") : fail("no status select");
  hasNotes === 1 ? ok("modal has notes textarea") : fail("no notes textarea");
  await page.selectOption("#modal-status", "drafting");
  await page.fill("#modal-notes", "Test draft note");
  await page.waitForTimeout(400);
  const persisted = await page.evaluate(() => ({
    status: JSON.parse(localStorage.getItem("ct.status") || "{}"),
    notes: JSON.parse(localStorage.getItem("ct.notes") || "{}"),
  }));
  Object.values(persisted.status).includes("drafting") ? ok("status persists to localStorage") : fail("status not saved");
  Object.values(persisted.notes).includes("Test draft note") ? ok("notes persist to localStorage") : fail("notes not saved");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  log("\nMobile viewport");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click("#themeBtn"); // back to light
  await page.waitForTimeout(150);
  await page.click('.view-tab[data-view="cards"]');
  await page.waitForTimeout(200);
  const mobileCards = await page.locator(".card").count();
  mobileCards > 0 ? ok(`mobile renders ${mobileCards} cards`) : fail("mobile broken");
  await page.screenshot({ path: path.join(SHOTS, "08-mobile.png"), fullPage: false });
  ok("screenshot: 08-mobile.png");

  await browser.close();

  log("\n" + "=".repeat(60));
  if (errors.length === 0) {
    log("ALL CHECKS PASSED ✓");
    log(`Screenshots in: ${SHOTS}`);
    process.exit(0);
  } else {
    log(`${errors.length} FAILURES:`);
    errors.forEach(e => log("  -", e));
    process.exit(1);
  }
})().catch(e => { console.error("Test runner error:", e); process.exit(2); });
