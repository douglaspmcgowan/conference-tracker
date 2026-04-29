const express = require("express");
const path = require("path");
const data = require("./data/conferences");

const app = express();
const PORT = process.env.PORT || 3010;

app.get("/health", (req, res) => res.send("ok"));
app.get("/api/conferences", (req, res) => res.json(data));

app.get("*", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(buildPage());
});

function buildPage() {
  const dataJson = JSON.stringify(data);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conference Tracker</title>
<meta name="description" content="Conference deadlines, locations, and submission requirements across HCI, engineering design, AI/ML, visualization, and manufacturing.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${getCSS()}</style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>
  <header class="masthead">
    <div class="masthead-row">
      <div class="brand">
        <span class="brand-mark">§</span>
        <h1 class="brand-title">Conference Tracker</h1>
      </div>
      <div class="masthead-actions">
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">
          <span class="theme-icon-light">☀</span>
          <span class="theme-icon-dark">☾</span>
        </button>
      </div>
    </div>
    <p class="masthead-lede">Submission deadlines, locations, and requirements for conferences and journals across HCI, engineering design, AI / ML, visualization, manufacturing, and cognitive science.</p>
    <div class="masthead-stats" id="stats"></div>
  </header>

  <nav class="viewbar" role="tablist" aria-label="View">
    <button class="view-tab active" data-view="timeline" role="tab" aria-selected="true">Timeline</button>
    <button class="view-tab" data-view="cards" role="tab" aria-selected="false">Cards</button>
    <button class="view-tab" data-view="table" role="tab" aria-selected="false">Table</button>
  </nav>

  <section class="filters" aria-label="Filters">
    <div class="filter-group">
      <span class="filter-label">Field</span>
      <div class="chip-row" id="fieldChips"></div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Tier</span>
      <div class="chip-row" id="tierChips">
        <button class="chip" data-tier="all">All</button>
        <button class="chip" data-tier="A*">A*</button>
        <button class="chip" data-tier="A">A</button>
        <button class="chip" data-tier="B">B</button>
        <button class="chip" data-tier="industry">Industry</button>
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Window</span>
      <div class="chip-row" id="windowChips">
        <button class="chip" data-window="30">30d</button>
        <button class="chip" data-window="90">90d</button>
        <button class="chip" data-window="180">180d</button>
        <button class="chip active" data-window="all">All</button>
      </div>
    </div>
    <div class="filter-group filter-group-search">
      <input type="search" id="searchInput" placeholder="Search conferences…" autocomplete="off">
      <label class="starred-toggle">
        <input type="checkbox" id="starredOnly">
        <span>★ Starred only</span>
      </label>
    </div>
  </section>

  <main id="main">
    <section id="view-timeline" class="view"></section>
    <section id="view-cards" class="view hidden"></section>
    <section id="view-table" class="view hidden"></section>
  </main>

  <div id="detailModal" class="modal hidden" aria-hidden="true" role="dialog">
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel" role="document">
      <button class="modal-close" data-close aria-label="Close">×</button>
      <div id="modalBody"></div>
    </div>
  </div>

  <footer class="colophon">
    <span class="colophon-bit">Inter Tight · JetBrains Mono</span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit">Data verified ${new Date().toISOString().slice(0,10)}</span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit">Single accent · hairlines · grain</span>
  </footer>

<script>window.__DATA__ = ${dataJson};</script>
<script>${getJS()}</script>
</body>
</html>`;
}

function getCSS() {
  return `
:root {
  --paper: #FAFAF7;
  --paper-soft: #F2F0EA;
  --paper-deep: #EBE8E0;
  --ink: #0F0F0E;
  --ink-soft: #57544D;
  --ink-faint: #8C8880;
  --rule: rgba(15, 15, 14, 0.10);
  --rule-soft: rgba(15, 15, 14, 0.05);
  --accent: #2D5BFF;
  --accent-soft: rgba(45, 91, 255, 0.10);
  --urgent: #C81E1E;
  --urgent-soft: rgba(200, 30, 30, 0.10);
  --warn: #B8753B;
  --warn-soft: rgba(184, 117, 59, 0.12);
  --good: #2F6B3F;
  --sans: "Inter Tight", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
[data-theme="dark"] {
  --paper: #14130F;
  --paper-soft: #1B1A15;
  --paper-deep: #232118;
  --ink: #E9E2D2;
  --ink-soft: #B0A899;
  --ink-faint: #807868;
  --rule: rgba(233, 226, 210, 0.12);
  --rule-soft: rgba(233, 226, 210, 0.06);
  --accent: #7A9CFF;
  --accent-soft: rgba(122, 156, 255, 0.14);
  --urgent: #FF6E6E;
  --urgent-soft: rgba(255, 110, 110, 0.14);
  --warn: #DCA56F;
  --warn-soft: rgba(220, 165, 111, 0.14);
}
* { box-sizing: border-box; }
html { font-family: var(--sans); font-size: 16px; font-feature-settings: "kern" 1, "liga" 1, "ss01" 1; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; line-height: 1.55; }
body { margin: 0; background: var(--paper); color: var(--ink); min-height: 100vh; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }

.grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 1000;
  opacity: 0.030; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
[data-theme="dark"] .grain { mix-blend-mode: screen; opacity: 0.035; }

/* ------ Masthead ------ */
.masthead { max-width: 78rem; margin: 0 auto; padding: 3rem 2rem 1.5rem; }
.masthead-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.brand { display: flex; align-items: baseline; gap: 0.6rem; }
.brand-mark { font-family: var(--mono); font-size: 1.1rem; color: var(--accent); }
.brand-title { font-size: 1.65rem; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
.masthead-lede { color: var(--ink-soft); font-size: 1.02rem; max-width: 60ch; margin: 1rem 0 1.25rem; line-height: 1.55; }
.masthead-stats { display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; padding-top: 1rem; border-top: 1px solid var(--rule); font-family: var(--mono); font-size: 0.78rem; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.04em; }
.stat strong { font-family: var(--sans); font-weight: 600; color: var(--ink); font-size: 1.05rem; letter-spacing: -0.01em; text-transform: none; margin-right: 0.45rem; font-variant-numeric: tabular-nums; }
.stat .stat-accent { color: var(--accent); }
.stat .stat-urgent { color: var(--urgent); }

.theme-toggle { background: transparent; border: 1px solid var(--rule); border-radius: 999px; width: 2.4rem; height: 2.4rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: var(--ink-soft); font-size: 1rem; transition: border-color 200ms, color 200ms; }
.theme-toggle:hover { border-color: var(--ink-soft); color: var(--ink); }
.theme-icon-dark { display: none; }
[data-theme="dark"] .theme-icon-light { display: none; }
[data-theme="dark"] .theme-icon-dark { display: inline; }

/* ------ View tabs ------ */
.viewbar { max-width: 78rem; margin: 0 auto; padding: 0 2rem; display: flex; gap: 0.5rem; border-bottom: 1px solid var(--rule); }
.view-tab { background: transparent; border: 0; padding: 0.85rem 1.1rem; cursor: pointer; font-family: var(--sans); font-size: 0.95rem; color: var(--ink-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 160ms, border-color 160ms; letter-spacing: -0.005em; }
.view-tab:hover { color: var(--ink-soft); }
.view-tab.active { color: var(--ink); border-bottom-color: var(--accent); font-weight: 500; }

/* ------ Filters ------ */
.filters { max-width: 78rem; margin: 0 auto; padding: 1.5rem 2rem; display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; align-items: flex-start; border-bottom: 1px solid var(--rule); }
.filter-group { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
.filter-group-search { margin-left: auto; gap: 0.85rem; }
.filter-label { font-family: var(--mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); }
.chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  background: transparent; border: 1px solid var(--rule);
  padding: 0.35rem 0.75rem; border-radius: 999px;
  font-family: var(--sans); font-size: 0.83rem; cursor: pointer; color: var(--ink-soft);
  transition: border-color 140ms, background 140ms, color 220ms;
  display: inline-flex; align-items: center; gap: 0.35rem;
}
.chip:hover { border-color: var(--ink-soft); color: var(--ink); }
.chip.active {
  background: var(--ink); color: var(--paper); border-color: var(--ink);
}
.chip[data-field].active {
  background: var(--field-color, var(--ink)); border-color: var(--field-color, var(--ink)); color: white;
}
.chip-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
#searchInput {
  background: var(--paper-soft); border: 1px solid var(--rule); border-radius: 6px;
  padding: 0.45rem 0.8rem; font: inherit; color: var(--ink); width: 14rem; transition: border-color 140ms;
}
#searchInput:focus { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }
.starred-toggle { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; color: var(--ink-soft); cursor: pointer; user-select: none; }
.starred-toggle input { accent-color: var(--accent); }

/* ------ Main ------ */
main { max-width: 78rem; margin: 0 auto; padding: 1.75rem 2rem 6rem; }
.view.hidden { display: none; }

/* ------ Timeline ------ */
.timeline-wrap { position: relative; }
.timeline-scroll { overflow-x: auto; overflow-y: visible; }
.timeline-scroll::-webkit-scrollbar { height: 8px; }
.timeline-scroll::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
.timeline-empty { color: var(--ink-faint); font-style: italic; padding: 4rem 0; text-align: center; }
.timeline-svg { display: block; }
.timeline-row-hover { fill: var(--accent-soft); cursor: pointer; }
.timeline-deadline-marker { cursor: pointer; transition: r 140ms; }
.timeline-deadline-marker:hover { r: 7; }
.timeline-tooltip {
  position: absolute; pointer-events: none; background: var(--ink); color: var(--paper);
  padding: 0.55rem 0.75rem; border-radius: 4px; font-size: 0.82rem; line-height: 1.35;
  box-shadow: 0 4px 12px rgba(0,0,0,0.20); max-width: 22rem; transform: translate(-50%, calc(-100% - 8px));
  white-space: normal; opacity: 0; transition: opacity 140ms;
  font-family: var(--sans);
}
.timeline-tooltip.visible { opacity: 1; }
.timeline-tooltip strong { color: var(--paper); font-weight: 600; }
.timeline-tooltip .tt-date { font-family: var(--mono); font-size: 0.78rem; opacity: 0.85; margin-top: 0.25rem; display: block; }

.timeline-legend { display: flex; flex-wrap: wrap; gap: 1.25rem; padding: 0.5rem 0 1.25rem; font-size: 0.83rem; color: var(--ink-soft); border-bottom: 1px solid var(--rule-soft); margin-bottom: 1.25rem; }
.legend-item { display: inline-flex; align-items: center; gap: 0.4rem; }
.legend-mark { display: inline-block; }
.legend-mark.deadline { width: 0.6rem; height: 0.6rem; border-radius: 50%; background: var(--ink); }
.legend-mark.notification { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: var(--ink-faint); }
.legend-mark.conference { width: 0.9rem; height: 0.4rem; border-radius: 2px; background: var(--accent-soft); border: 1px solid var(--accent); }
.legend-mark.estimated { width: 0.6rem; height: 0.6rem; border-radius: 50%; background: transparent; border: 1.5px solid var(--ink); }

/* ------ Cards ------ */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 1.5rem; }
.card { background: var(--paper); border: 1px solid var(--rule); border-radius: 8px; padding: 1.25rem 1.4rem 1.4rem; transition: border-color 180ms, transform 220ms; cursor: pointer; display: flex; flex-direction: column; gap: 0.6rem; position: relative; }
.card:hover { border-color: var(--ink-soft); }
.card-row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
.card-name { font-size: 1.2rem; font-weight: 600; letter-spacing: -0.015em; margin: 0; line-height: 1.2; }
.card-name .year { font-family: var(--mono); font-size: 0.85rem; font-weight: 400; color: var(--ink-faint); margin-left: 0.5rem; }
.card-tier { font-family: var(--mono); font-size: 0.72rem; padding: 0.18rem 0.5rem; border-radius: 4px; background: var(--paper-deep); color: var(--ink-soft); letter-spacing: 0.04em; flex-shrink: 0; }
.card-tier.tier-a-star, .card-tier.tier-A { color: var(--accent); background: var(--accent-soft); }
.card-tier.tier-industry { color: var(--warn); background: var(--warn-soft); }
.card-fullname { color: var(--ink-soft); font-size: 0.85rem; line-height: 1.45; margin: 0; }
.card-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.card-tag { font-family: var(--mono); font-size: 0.7rem; padding: 0.16rem 0.42rem; border-radius: 3px; color: var(--paper); letter-spacing: 0.03em; }
.card-meta { display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.85rem; font-size: 0.85rem; padding-top: 0.45rem; border-top: 1px solid var(--rule-soft); }
.card-meta dt { font-family: var(--mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); padding-top: 0.18rem; }
.card-meta dd { margin: 0; color: var(--ink); font-variant-numeric: tabular-nums; }
.card-countdown {
  font-family: var(--mono); font-size: 0.78rem; padding: 0.22rem 0.55rem; border-radius: 999px;
  background: var(--paper-deep); color: var(--ink-soft); display: inline-flex; gap: 0.3rem; align-items: center;
}
.card-countdown.urgent { background: var(--urgent-soft); color: var(--urgent); }
.card-countdown.soon { background: var(--warn-soft); color: var(--warn); }
.card-countdown.passed { background: var(--rule-soft); color: var(--ink-faint); text-decoration: line-through; }
.card-fit { font-style: italic; color: var(--ink-soft); font-size: 0.88rem; line-height: 1.5; padding-top: 0.3rem; border-top: 1px solid var(--rule-soft); }
.card-actions { display: flex; gap: 0.6rem; align-items: center; padding-top: 0.5rem; }
.card-link { font-size: 0.85rem; color: var(--accent); text-decoration: none; padding: 0.35rem 0; border-bottom: 1px solid transparent; transition: border-color 140ms; font-family: var(--mono); }
.card-link:hover { border-color: var(--accent); }
.star-btn { background: transparent; border: 0; cursor: pointer; font-size: 1.2rem; color: var(--ink-faint); padding: 0; line-height: 1; transition: color 140ms, transform 200ms ease-out; margin-left: auto; }
.star-btn:hover { color: var(--warn); }
.star-btn.starred { color: var(--warn); transform: scale(1.05); }
.confidence-mark { font-family: var(--mono); font-size: 0.66rem; color: var(--ink-faint); letter-spacing: 0.05em; text-transform: uppercase; margin-left: auto; }
.confidence-mark.estimated::before { content: "≈ "; }

/* ------ Table ------ */
.table-wrap { overflow-x: auto; border: 1px solid var(--rule); border-radius: 6px; }
table.confs { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
table.confs th, table.confs td { padding: 0.7rem 0.95rem; text-align: left; border-bottom: 1px solid var(--rule-soft); }
table.confs thead th { background: var(--paper-soft); font-family: var(--mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); cursor: pointer; user-select: none; white-space: nowrap; }
table.confs thead th:hover { color: var(--ink); }
table.confs tbody tr { transition: background 140ms; }
table.confs tbody tr:hover { background: var(--paper-soft); cursor: pointer; }
table.confs td.num { font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* ------ Modal ------ */
.modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal.hidden { display: none; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
[data-theme="dark"] .modal-backdrop { background: rgba(0,0,0,0.65); }
.modal-panel { position: relative; background: var(--paper); border: 1px solid var(--rule); border-radius: 8px; max-width: 38rem; width: calc(100vw - 3rem); max-height: 85vh; overflow-y: auto; padding: 2rem 2.25rem; box-shadow: 0 24px 64px rgba(0,0,0,0.18); }
.modal-close { position: absolute; top: 0.85rem; right: 1rem; background: transparent; border: 0; font-size: 1.6rem; line-height: 1; cursor: pointer; color: var(--ink-faint); padding: 0.2rem 0.5rem; }
.modal-close:hover { color: var(--ink); }
.modal-name { font-size: 1.55rem; margin: 0 0 0.2rem; font-weight: 600; letter-spacing: -0.02em; }
.modal-fullname { color: var(--ink-soft); font-size: 0.95rem; margin: 0 0 1.1rem; line-height: 1.5; }
.modal-section { margin: 1.2rem 0; padding-top: 1rem; border-top: 1px solid var(--rule-soft); }
.modal-section h3 { font-family: var(--mono); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); margin: 0 0 0.5rem; font-weight: 500; }
.modal-meta { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.15rem; font-size: 0.92rem; }
.modal-meta dt { font-family: var(--mono); font-size: 0.78rem; color: var(--ink-faint); }
.modal-meta dd { margin: 0; font-variant-numeric: tabular-nums; }
.modal-link-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; background: var(--accent); color: white; text-decoration: none; border-radius: 4px; font-size: 0.9rem; transition: background 160ms; margin-top: 0.5rem; }
.modal-link-btn:hover { background: var(--ink); }

/* ------ Footer ------ */
.colophon { max-width: 78rem; margin: 0 auto; padding: 2rem 2rem 3rem; border-top: 1px solid var(--rule); display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; font-family: var(--mono); font-size: 0.74rem; color: var(--ink-faint); letter-spacing: 0.04em; text-transform: uppercase; }
.colophon-sep { color: var(--rule); }

/* ------ Mobile ------ */
@media (max-width: 720px) {
  .masthead { padding: 1.75rem 1.25rem 1rem; }
  .brand-title { font-size: 1.4rem; }
  .viewbar, .filters, main, .colophon { padding-left: 1.25rem; padding-right: 1.25rem; }
  .filter-group-search { margin-left: 0; width: 100%; }
  #searchInput { flex: 1; min-width: 0; width: auto; }
  .cards-grid { grid-template-columns: 1fr; gap: 1rem; }
  table.confs { font-size: 0.8rem; }
  table.confs th, table.confs td { padding: 0.55rem 0.7rem; }
  .modal-panel { padding: 1.5rem 1.25rem; max-width: calc(100vw - 1.5rem); }
}
`;
}

function getJS() {
  return `
(function(){
  const DATA = window.__DATA__;
  const CONFS = DATA.conferences.slice();
  const FIELDS = DATA.fields;
  const TODAY = new Date(); TODAY.setHours(0,0,0,0);

  // ------ State ------
  const state = {
    view: localStorage.getItem("ct.view") || "timeline",
    fields: new Set(),               // empty = all
    tier: "all",
    window: "all",
    search: "",
    starredOnly: false,
    starred: new Set(JSON.parse(localStorage.getItem("ct.starred") || "[]")),
    sort: "deadline",
    sortDir: 1,
  };

  // ------ Theme ------
  const themeBtn = document.getElementById("themeBtn");
  const initialTheme = localStorage.getItem("ct.theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initialTheme);
  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", cur);
    localStorage.setItem("ct.theme", cur);
    render();
  });

  // ------ Field chips ------
  const fieldChipsEl = document.getElementById("fieldChips");
  Object.entries(FIELDS).forEach(([key, f]) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.dataset.field = key;
    btn.style.setProperty("--field-color", f.color);
    btn.innerHTML = '<span class="chip-dot" style="background:' + f.color + '"></span>' + f.label;
    btn.addEventListener("click", () => {
      if (state.fields.has(key)) state.fields.delete(key);
      else state.fields.add(key);
      btn.classList.toggle("active", state.fields.has(key));
      render();
    });
    fieldChipsEl.appendChild(btn);
  });

  // ------ Tier chips ------
  document.querySelectorAll("#tierChips .chip").forEach(b => {
    if (b.dataset.tier === "all") b.classList.add("active");
    b.addEventListener("click", () => {
      state.tier = b.dataset.tier;
      document.querySelectorAll("#tierChips .chip").forEach(x => x.classList.toggle("active", x === b));
      render();
    });
  });

  // ------ Window chips ------
  document.querySelectorAll("#windowChips .chip").forEach(b => {
    b.addEventListener("click", () => {
      state.window = b.dataset.window;
      document.querySelectorAll("#windowChips .chip").forEach(x => x.classList.toggle("active", x === b));
      render();
    });
  });

  // ------ Search ------
  const searchEl = document.getElementById("searchInput");
  let searchTimer;
  searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = searchEl.value.trim().toLowerCase(); render(); }, 140);
  });

  // ------ Starred toggle ------
  document.getElementById("starredOnly").addEventListener("change", (e) => {
    state.starredOnly = e.target.checked;
    render();
  });

  // ------ View tabs ------
  document.querySelectorAll(".view-tab").forEach(t => {
    if (t.dataset.view === state.view) t.classList.add("active");
    else t.classList.remove("active");
    t.addEventListener("click", () => {
      state.view = t.dataset.view;
      localStorage.setItem("ct.view", state.view);
      document.querySelectorAll(".view-tab").forEach(x => {
        x.classList.toggle("active", x === t);
        x.setAttribute("aria-selected", x === t ? "true" : "false");
      });
      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
      document.getElementById("view-" + state.view).classList.remove("hidden");
      render();
    });
  });
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-" + state.view).classList.remove("hidden");

  // ------ Filtering ------
  function nextDate(c) {
    const candidates = [c.deadline, c.abstractDeadline, c.conferenceStart].filter(Boolean).map(parseDate);
    return candidates.length ? new Date(Math.min(...candidates.map(d => d.getTime()))) : null;
  }
  function parseDate(s) {
    if (!s || typeof s !== "string") return null;
    const cleaned = s.replace(/X/g, "1");
    const d = new Date(cleaned + "T00:00:00");
    return isNaN(d) ? null : d;
  }
  function daysUntil(date) {
    if (!date) return null;
    return Math.round((date - TODAY) / (1000 * 60 * 60 * 24));
  }
  function visibleConfs() {
    return CONFS.filter(c => {
      if (state.fields.size && !c.fields.some(f => state.fields.has(f))) return false;
      if (state.tier !== "all" && c.tier !== state.tier) return false;
      if (state.starredOnly && !state.starred.has(c.id)) return false;
      if (state.window !== "all") {
        const d = parseDate(c.deadline) || parseDate(c.conferenceStart);
        if (!d) return false;
        const diff = daysUntil(d);
        if (diff === null || diff < -7) return false;
        if (diff > parseInt(state.window, 10)) return false;
      }
      if (state.search) {
        const blob = (c.name + " " + c.fullName + " " + (c.fields||[]).join(" ") + " " + (c.fit||"") + " " + (c.location?.city||"") + " " + (c.location?.country||"")).toLowerCase();
        if (!blob.includes(state.search)) return false;
      }
      return true;
    });
  }

  function fmtDate(s) {
    const d = parseDate(s);
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtMonth(d) { return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); }
  function fmtRange(a, b) {
    const da = parseDate(a), db = parseDate(b);
    if (!da) return "—";
    if (!db) return fmtDate(a);
    if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
      return da.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "–" + db.getDate() + ", " + db.getFullYear();
    }
    return fmtDate(a) + " – " + fmtDate(b);
  }

  function countdownClass(days) {
    if (days === null) return "";
    if (days < 0) return "passed";
    if (days <= 14) return "urgent";
    if (days <= 60) return "soon";
    return "";
  }
  function countdownText(days) {
    if (days === null) return "no deadline";
    if (days < 0) return Math.abs(days) + "d ago";
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    return "in " + days + "d";
  }

  // ------ Stats ------
  function renderStats() {
    const all = CONFS.length;
    const upcoming = CONFS
      .map(c => ({ c, days: daysUntil(parseDate(c.deadline)) }))
      .filter(x => x.days !== null && x.days >= 0);
    upcoming.sort((a,b) => a.days - b.days);
    const next = upcoming[0];
    const starred = state.starred.size;

    const html = [
      '<span class="stat"><strong>' + all + '</strong>conferences</span>',
      next
        ? '<span class="stat"><strong class="stat-' + (next.days <= 14 ? "urgent" : "accent") + '">' + next.c.name + '</strong>next deadline · ' + countdownText(next.days) + '</span>'
        : '',
      '<span class="stat"><strong>' + starred + '</strong>starred</span>',
    ].join("");
    document.getElementById("stats").innerHTML = html;
  }

  // ------ Render router ------
  function render() {
    renderStats();
    const list = visibleConfs();
    if (state.view === "timeline") renderTimeline(list);
    else if (state.view === "cards") renderCards(list);
    else renderTable(list);
  }

  // ------ Timeline view ------
  function renderTimeline(list) {
    const el = document.getElementById("view-timeline");
    if (!list.length) { el.innerHTML = '<div class="timeline-empty">No conferences match the current filters.</div>'; return; }

    // Sort by next-meaningful date asc
    const rows = list
      .map(c => ({ c, sortDate: parseDate(c.deadline) || parseDate(c.conferenceStart) }))
      .filter(r => r.sortDate)
      .sort((a,b) => a.sortDate - b.sortDate);

    if (!rows.length) { el.innerHTML = '<div class="timeline-empty">No conferences with parseable dates match.</div>'; return; }

    // Date range: today - 30d → max(any date) + 30d, capped at +18mo from today
    const minD = new Date(TODAY); minD.setDate(minD.getDate() - 30);
    let maxD = new Date(TODAY); maxD.setMonth(maxD.getMonth() + 18);
    rows.forEach(r => {
      [r.c.deadline, r.c.notification, r.c.conferenceStart, r.c.conferenceEnd, r.c.abstractDeadline].forEach(s => {
        const d = parseDate(s); if (d && d > maxD) maxD = d;
      });
    });

    const totalDays = Math.max(60, Math.round((maxD - minD) / (1000*60*60*24)));
    const dayPx = 4.2;       // pixels per day
    const labelW = 220;      // left label column width
    const padR = 60;
    const rowH = 28;
    const topPad = 56;       // room for month axis
    const width = labelW + totalDays * dayPx + padR;
    const height = topPad + rows.length * rowH + 24;

    const xFor = (d) => labelW + ((d - minD) / (1000*60*60*24)) * dayPx;

    let svg = '<svg class="timeline-svg" width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Conference timeline">';

    // Month gridlines + labels
    const cursor = new Date(minD.getFullYear(), minD.getMonth(), 1);
    while (cursor <= maxD) {
      const x = xFor(cursor);
      svg += '<line x1="' + x + '" y1="' + (topPad - 14) + '" x2="' + x + '" y2="' + (height - 12) + '" stroke="var(--rule-soft)" stroke-width="1"/>';
      svg += '<text x="' + (x + 4) + '" y="' + (topPad - 22) + '" font-family="var(--mono)" font-size="10" fill="var(--ink-faint)" letter-spacing="0.04em">' + fmtMonth(cursor).toUpperCase() + '</text>';
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Today line
    const todayX = xFor(TODAY);
    svg += '<line x1="' + todayX + '" y1="' + (topPad - 14) + '" x2="' + todayX + '" y2="' + (height - 12) + '" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>';
    svg += '<text x="' + (todayX + 5) + '" y="' + (topPad - 18) + '" font-family="var(--mono)" font-size="10" fill="var(--accent)" font-weight="600">TODAY</text>';

    // Rows
    rows.forEach((r, i) => {
      const c = r.c;
      const y = topPad + i * rowH + rowH/2;
      const fieldColor = (FIELDS[c.fields[0]] || {}).color || "var(--ink-soft)";
      const isEstimated = c.confidence === "estimated";

      // Label
      svg += '<text x="' + (labelW - 12) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12.5" font-weight="500" fill="var(--ink)" font-family="var(--sans)">' + escape(c.name) + ' <tspan font-family="var(--mono)" font-size="11" fill="var(--ink-faint)" font-weight="400">' + c.year + '</tspan></text>';

      // Field tag dot
      svg += '<circle cx="' + (labelW - 4) + '" cy="' + y + '" r="3" fill="' + fieldColor + '"/>';

      // Conference dates as bar
      const cs = parseDate(c.conferenceStart);
      const ce = parseDate(c.conferenceEnd) || cs;
      if (cs && cs >= minD) {
        const x1 = xFor(cs), x2 = Math.max(x1 + 3, xFor(ce));
        svg += '<rect x="' + x1 + '" y="' + (y - 6) + '" width="' + (x2-x1) + '" height="12" fill="' + fieldColor + '" fill-opacity="0.18" stroke="' + fieldColor + '" stroke-width="1" rx="2" data-tooltip="' + escapeAttr(c.name + ' · ' + fmtRange(c.conferenceStart, c.conferenceEnd) + ' · ' + (c.location?.city || "TBA")) + '" data-id="' + c.id + '" class="tl-conf"/>';
      }

      // Deadline → notification connector
      const dlD = parseDate(c.deadline);
      const ntfD = parseDate(c.notification);
      if (dlD && ntfD) {
        const dx = xFor(dlD), nx = xFor(ntfD);
        svg += '<line x1="' + dx + '" y1="' + y + '" x2="' + nx + '" y2="' + y + '" stroke="var(--rule)" stroke-width="1" stroke-dasharray="2 3"/>';
      }

      // Notification marker
      if (ntfD) {
        const nx = xFor(ntfD);
        svg += '<circle cx="' + nx + '" cy="' + y + '" r="3" fill="var(--ink-faint)" data-tooltip="' + escapeAttr(c.name + ' · notification ' + fmtDate(c.notification)) + '" data-id="' + c.id + '" class="tl-ntf"/>';
      }

      // Deadline marker (the main one)
      if (dlD) {
        const dx = xFor(dlD);
        const days = daysUntil(dlD);
        const cls = countdownClass(days);
        const fill = cls === "urgent" ? "var(--urgent)" : (cls === "passed" ? "var(--ink-faint)" : "var(--ink)");
        if (isEstimated) {
          svg += '<circle cx="' + dx + '" cy="' + y + '" r="5" fill="var(--paper)" stroke="' + fill + '" stroke-width="1.6" class="timeline-deadline-marker" data-id="' + c.id + '" data-tooltip="' + escapeAttr(c.name + ' deadline · ' + fmtDate(c.deadline) + ' · ' + countdownText(days) + ' · est.') + '"/>';
        } else {
          svg += '<circle cx="' + dx + '" cy="' + y + '" r="5" fill="' + fill + '" class="timeline-deadline-marker" data-id="' + c.id + '" data-tooltip="' + escapeAttr(c.name + ' deadline · ' + fmtDate(c.deadline) + ' · ' + countdownText(days)) + '"/>';
        }
      }

      // Abstract deadline if present
      const abD = parseDate(c.abstractDeadline);
      if (abD && abD < (dlD || maxD)) {
        const ax = xFor(abD);
        svg += '<rect x="' + (ax-2.5) + '" y="' + (y-4.5) + '" width="5" height="9" fill="' + fieldColor + '" data-tooltip="' + escapeAttr(c.name + ' abstract · ' + fmtDate(c.abstractDeadline)) + '" data-id="' + c.id + '" class="tl-abs"/>';
      }

      // Row hit zone (for click-to-detail)
      svg += '<rect x="0" y="' + (y - rowH/2) + '" width="' + width + '" height="' + rowH + '" fill="transparent" data-id="' + c.id + '" class="tl-row"/>';
    });

    svg += '</svg>';

    el.innerHTML =
      '<div class="timeline-legend">' +
        '<span class="legend-item"><span class="legend-mark deadline"></span>Paper deadline</span>' +
        '<span class="legend-item"><span class="legend-mark estimated"></span>Estimated (no official date yet)</span>' +
        '<span class="legend-item"><span class="legend-mark notification"></span>Notification</span>' +
        '<span class="legend-item"><span class="legend-mark conference"></span>Conference dates</span>' +
        '<span class="legend-item" style="color:var(--accent)">— TODAY</span>' +
      '</div>' +
      '<div class="timeline-wrap">' +
        '<div class="timeline-scroll">' + svg + '</div>' +
        '<div id="tlTooltip" class="timeline-tooltip"></div>' +
      '</div>';

    // Tooltip + click handlers
    const tooltip = document.getElementById("tlTooltip");
    const wrap = el.querySelector(".timeline-wrap");
    el.querySelectorAll("[data-tooltip]").forEach(node => {
      node.addEventListener("mousemove", (ev) => {
        tooltip.innerHTML = node.getAttribute("data-tooltip").replace(" · ", "<br><span class='tt-date'>").replace(/$/, "</span>");
        tooltip.style.left = (ev.clientX - wrap.getBoundingClientRect().left + el.querySelector(".timeline-scroll").scrollLeft) + "px";
        tooltip.style.top = (ev.clientY - wrap.getBoundingClientRect().top - 6) + "px";
        tooltip.classList.add("visible");
      });
      node.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    });
    el.querySelectorAll("[data-id]").forEach(node => {
      node.addEventListener("click", () => openDetail(node.getAttribute("data-id")));
    });
    // Auto-scroll to today
    setTimeout(() => {
      const scroll = el.querySelector(".timeline-scroll");
      if (scroll) scroll.scrollLeft = Math.max(0, todayX - 100);
    }, 0);
  }

  // ------ Cards view ------
  function renderCards(list) {
    const el = document.getElementById("view-cards");
    if (!list.length) { el.innerHTML = '<div class="timeline-empty">No conferences match the current filters.</div>'; return; }

    const sorted = list.slice().sort((a,b) => {
      const da = parseDate(a.deadline) || parseDate(a.conferenceStart);
      const db = parseDate(b.deadline) || parseDate(b.conferenceStart);
      if (!da && !db) return 0;
      if (!da) return 1; if (!db) return -1;
      return da - db;
    });

    const cardsHtml = sorted.map(c => {
      const days = daysUntil(parseDate(c.deadline));
      const cdCls = countdownClass(days);
      const cdTxt = c.deadline ? countdownText(days) : "no deadline";
      const tags = c.fields.map(f => {
        const meta = FIELDS[f] || { color: "#888", label: f };
        return '<span class="card-tag" style="background:' + meta.color + '">' + escape(meta.label) + '</span>';
      }).join("");
      const tierClass = c.tier === "A*" ? "tier-a-star" : "tier-" + c.tier;
      const isStarred = state.starred.has(c.id);

      return '<article class="card" data-id="' + c.id + '">' +
        '<div class="card-row">' +
          '<h3 class="card-name">' + escape(c.name) + '<span class="year">′' + String(c.year).slice(-2) + '</span></h3>' +
          '<span class="card-tier ' + tierClass + '">' + escape(c.tier) + '</span>' +
        '</div>' +
        '<p class="card-fullname">' + escape(c.fullName) + '</p>' +
        '<div class="card-tags">' + tags + '</div>' +
        '<dl class="card-meta">' +
          '<dt>Deadline</dt><dd>' + fmtDate(c.deadline) + ' <span class="card-countdown ' + cdCls + '">' + cdTxt + '</span></dd>' +
          '<dt>Conf</dt><dd>' + fmtRange(c.conferenceStart, c.conferenceEnd) + '</dd>' +
          '<dt>Where</dt><dd>' + escape((c.location?.city || "TBA") + (c.location?.country ? ", " + c.location.country : "")) + '</dd>' +
          '<dt>Format</dt><dd>' + escape(c.format || "—") + '</dd>' +
        '</dl>' +
        (c.fit ? '<p class="card-fit">' + escape(c.fit) + '</p>' : '') +
        '<div class="card-actions">' +
          '<a class="card-link" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">CFP ↗</a>' +
          (c.confidence === "estimated" ? '<span class="confidence-mark estimated">est.</span>' : '') +
          '<button class="star-btn ' + (isStarred ? "starred" : "") + '" data-star="' + c.id + '" aria-label="Star" title="Star">★</button>' +
        '</div>' +
      '</article>';
    }).join("");
    el.innerHTML = '<div class="cards-grid">' + cardsHtml + '</div>';

    el.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        openDetail(card.dataset.id);
      });
    });
    el.querySelectorAll(".star-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleStar(btn.getAttribute("data-star"));
      });
    });
  }

  // ------ Table view ------
  function renderTable(list) {
    const el = document.getElementById("view-table");
    if (!list.length) { el.innerHTML = '<div class="timeline-empty">No conferences match the current filters.</div>'; return; }

    const sortKey = state.sort;
    const dir = state.sortDir;
    const sorted = list.slice().sort((a,b) => {
      let va, vb;
      if (sortKey === "deadline") { va = parseDate(a.deadline) || new Date(8640000000000000); vb = parseDate(b.deadline) || new Date(8640000000000000); }
      else if (sortKey === "name") { va = a.name; vb = b.name; }
      else if (sortKey === "tier") { va = a.tier || ""; vb = b.tier || ""; }
      else if (sortKey === "field") { va = (a.fields[0]||""); vb = (b.fields[0]||""); }
      else if (sortKey === "loc") { va = (a.location?.country||"") + (a.location?.city||""); vb = (b.location?.country||"") + (b.location?.city||""); }
      else { va = a[sortKey]; vb = b[sortKey]; }
      if (va < vb) return -1 * dir; if (va > vb) return dir; return 0;
    });

    const rows = sorted.map(c => {
      const days = daysUntil(parseDate(c.deadline));
      const cdCls = countdownClass(days);
      const cdTxt = c.deadline ? countdownText(days) : "—";
      const isStarred = state.starred.has(c.id);
      return '<tr data-id="' + c.id + '">' +
        '<td><button class="star-btn ' + (isStarred ? "starred" : "") + '" data-star="' + c.id + '" aria-label="Star">★</button></td>' +
        '<td><strong>' + escape(c.name) + '</strong> <span style="color:var(--ink-faint);font-family:var(--mono);font-size:0.78rem;">′' + String(c.year).slice(-2) + '</span></td>' +
        '<td>' + (c.fields||[]).map(f => '<span class="card-tag" style="background:' + ((FIELDS[f]||{}).color||"#888") + ';margin-right:3px">' + escape((FIELDS[f]||{}).label || f) + '</span>').join("") + '</td>' +
        '<td>' + escape(c.tier || "—") + '</td>' +
        '<td class="num">' + fmtDate(c.deadline) + ' <span class="card-countdown ' + cdCls + '" style="font-size:0.7rem">' + cdTxt + '</span></td>' +
        '<td class="num">' + fmtRange(c.conferenceStart, c.conferenceEnd) + '</td>' +
        '<td>' + escape((c.location?.city || "TBA") + (c.location?.country ? ", " + c.location.country : "")) + '</td>' +
        '<td><a href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--accent);font-family:var(--mono);font-size:0.82rem">↗</a></td>' +
      '</tr>';
    }).join("");

    el.innerHTML = '<div class="table-wrap"><table class="confs">' +
      '<thead><tr>' +
        '<th></th>' +
        '<th data-sort="name">Conf</th>' +
        '<th data-sort="field">Field</th>' +
        '<th data-sort="tier">Tier</th>' +
        '<th data-sort="deadline">Deadline</th>' +
        '<th data-sort="conferenceStart">Conference</th>' +
        '<th data-sort="loc">Where</th>' +
        '<th></th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';

    el.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (state.sort === k) state.sortDir = -state.sortDir;
        else { state.sort = k; state.sortDir = 1; }
        render();
      });
    });
    el.querySelectorAll("tbody tr").forEach(tr => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        openDetail(tr.dataset.id);
      });
    });
    el.querySelectorAll(".star-btn").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); toggleStar(btn.getAttribute("data-star")); });
    });
  }

  // ------ Star ------
  function toggleStar(id) {
    if (state.starred.has(id)) state.starred.delete(id);
    else state.starred.add(id);
    localStorage.setItem("ct.starred", JSON.stringify([...state.starred]));
    render();
  }

  // ------ Modal ------
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  function openDetail(id) {
    const c = CONFS.find(x => x.id === id);
    if (!c) return;
    const days = daysUntil(parseDate(c.deadline));
    const tags = c.fields.map(f => {
      const meta = FIELDS[f] || { color: "#888", label: f };
      return '<span class="card-tag" style="background:' + meta.color + '">' + escape(meta.label) + '</span>';
    }).join(" ");
    modalBody.innerHTML =
      '<h2 class="modal-name">' + escape(c.name) + ' <span style="color:var(--ink-faint);font-family:var(--mono);font-size:1rem;font-weight:400;">&prime;' + String(c.year).slice(-2) + '</span></h2>' +
      '<p class="modal-fullname">' + escape(c.fullName) + '</p>' +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">' + tags +
        ' <span class="card-tier" style="font-family:var(--mono)">' + escape(c.tier) + '</span>' +
        (c.confidence === "estimated" ? ' <span class="confidence-mark estimated">est.</span>' : '') +
      '</div>' +
      '<div class="modal-section"><h3>Schedule</h3><dl class="modal-meta">' +
        (c.abstractDeadline ? '<dt>Abstract</dt><dd>' + fmtDate(c.abstractDeadline) + '</dd>' : '') +
        '<dt>Paper deadline</dt><dd>' + fmtDate(c.deadline) + ' <span class="card-countdown ' + countdownClass(days) + '">' + (c.deadline ? countdownText(days) : "—") + '</span></dd>' +
        (c.notification ? '<dt>Notification</dt><dd>' + fmtDate(c.notification) + '</dd>' : '') +
        '<dt>Conference</dt><dd>' + fmtRange(c.conferenceStart, c.conferenceEnd) + '</dd>' +
      '</dl></div>' +
      '<div class="modal-section"><h3>Where</h3><dl class="modal-meta">' +
        '<dt>Location</dt><dd>' + escape((c.location?.city || "TBA") + (c.location?.country ? ", " + c.location.country : "")) + '</dd>' +
      '</dl></div>' +
      '<div class="modal-section"><h3>Submission</h3><dl class="modal-meta">' +
        '<dt>Format</dt><dd>' + escape(c.format || "—") + '</dd>' +
        (c.pageLimit ? '<dt>Page limit</dt><dd>' + escape(c.pageLimit) + '</dd>' : '') +
        '<dt>Blind</dt><dd>' + escape(c.blind || "—") + '</dd>' +
        (c.acceptanceRate != null ? '<dt>Accept rate</dt><dd>' + Math.round(c.acceptanceRate * 100) + '%</dd>' : '') +
      '</dl></div>' +
      (c.fit ? '<div class="modal-section"><h3>Fit for you</h3><p style="margin:0;color:var(--ink-soft);font-style:italic;line-height:1.55">' + escape(c.fit) + '</p></div>' : '') +
      '<a class="modal-link-btn" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener">Open call for papers ↗</a>';
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeDetail();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });
  function closeDetail() { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); }

  // ------ Helpers ------
  function escape(s) { return String(s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function escapeAttr(s) { return escape(s); }

  // ------ Init ------
  render();
})();
`;
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log("Conference Tracker on http://localhost:" + PORT));
}
module.exports = app;
