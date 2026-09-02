const express = require("express");
const path = require("path");
const data = require("./data/conferences");

const app = express();
const PORT = process.env.PORT || 3010;

app.get("/health", (req, res) => res.send("ok"));
app.get("/api/conferences", (req, res) => res.json(data));

app.get("/favicon.svg", (req, res) => {
  res.set("Content-Type", "image/svg+xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="#0F0F0E"/>' +
      '<circle cx="16" cy="16" r="9" fill="none" stroke="#2D5BFF" stroke-width="2"/>' +
      '<line x1="16" y1="5" x2="16" y2="27" stroke="#FAFAF7" stroke-width="1.4" stroke-linecap="round"/>' +
      '<line x1="5" y1="16" x2="27" y2="16" stroke="#FAFAF7" stroke-width="1.4" stroke-linecap="round"/>' +
      '<circle cx="16" cy="16" r="2.4" fill="#2D5BFF"/>' +
      "</svg>",
  );
});
app.get("/favicon.ico", (req, res) => res.redirect(302, "/favicon.svg"));

app.get("/cal.ics", (req, res) => {
  // ?ids=a,b,c restricts the export; otherwise all conferences with deadlines.
  const onlyIds = req.query.ids
    ? new Set(
        String(req.query.ids)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null;
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="conferences.ics"');
  res.send(buildICS(onlyIds));
});

app.get("*", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(buildPage());
});

// ------ iCalendar export (RFC 5545) ------
function buildICS(onlyIds) {
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const events = [];
  for (const c of data.conferences) {
    if (onlyIds && !onlyIds.has(c.id)) continue;
    if (c.deadline) {
      events.push(
        icsEvent({
          uid: `${c.id}-deadline@conference-tracker`,
          summary: `${c.name} ${c.year} — paper deadline`,
          description: [
            c.fullName,
            c.fit,
            "Format: " + (c.format || "—"),
            "CFP: " + c.link,
          ]
            .filter(Boolean)
            .join("\n"),
          url: c.link,
          date: c.deadline,
          dtstamp,
        }),
      );
    }
    if (c.abstractDeadline) {
      events.push(
        icsEvent({
          uid: `${c.id}-abstract@conference-tracker`,
          summary: `${c.name} ${c.year} — abstract due`,
          description: c.fullName,
          url: c.link,
          date: c.abstractDeadline,
          dtstamp,
        }),
      );
    }
    if (c.conferenceStart) {
      events.push(
        icsEvent({
          uid: `${c.id}-conference@conference-tracker`,
          summary: `${c.name} ${c.year} (conference)`,
          description: [
            c.fullName,
            "Where: " + ((c.location && c.location.city) || "TBA"),
          ].join("\n"),
          url: c.link,
          date: c.conferenceStart,
          dateEnd: c.conferenceEnd || c.conferenceStart,
          dtstamp,
        }),
      );
    }
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//conference-tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Conference deadlines",
    "X-WR-CALDESC:Submission deadlines and conference dates from conference-tracker.",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
function icsEvent({ uid, summary, description, url, date, dateEnd, dtstamp }) {
  const fmt = (d) => d.replace(/-/g, "");
  const lines = [
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + dtstamp,
    "DTSTART;VALUE=DATE:" + fmt(date),
  ];
  if (dateEnd) {
    // iCal DTEND on a DATE event is exclusive — add one day.
    const next = new Date(dateEnd + "T00:00:00");
    next.setDate(next.getDate() + 1);
    lines.push("DTEND;VALUE=DATE:" + fmt(next.toISOString().slice(0, 10)));
  }
  lines.push("SUMMARY:" + icsEscape(summary));
  if (description) lines.push("DESCRIPTION:" + icsEscape(description));
  if (url) lines.push("URL:" + url);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}
function icsEscape(s) {
  return String(s)
    .replace(/[\\;,]/g, (c) => "\\" + c)
    .replace(/\n/g, "\\n");
}

function buildPage() {
  const dataJson = JSON.stringify(data);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI &amp; Design — Conference Tracker</title>
<meta name="description" content="AI and Engineering Design Conference Tracker — submission deadlines, locations, and requirements across HCI, engineering design, AI/ML, visualization, manufacturing, and cognitive science.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
          </svg>
        </span>
        <div class="brand-titles">
          <h1 class="brand-title">AI <span class="amp">&amp;</span> Engineering Design Conference Tracker</h1>
        </div>
      </div>
      <div class="masthead-actions">
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">
          <span class="theme-icon-light">☀</span>
          <span class="theme-icon-dark">☾</span>
        </button>
      </div>
    </div>
    <p class="masthead-lede">Submission deadlines, locations, and requirements for conferences and journals at the intersection of AI and engineering design — spanning HCI, design science, AI / ML, visualization, manufacturing, and cognitive science.</p>
    <div class="masthead-stats" id="stats" aria-live="polite"></div>
  </header>

  <nav class="viewbar" role="tablist" aria-label="View">
    <div class="viewbar-inner">
      <button class="view-tab active" data-view="timeline" role="tab" aria-selected="true">Timeline</button>
      <button class="view-tab" data-view="cards" role="tab" aria-selected="false">Cards</button>
      <button class="view-tab" data-view="table" role="tab" aria-selected="false">Table</button>
      <button class="view-tab" data-view="map" role="tab" aria-selected="false">Map</button>
      <span class="viewbar-spacer"></span>
      <a class="viewbar-action" href="/cal.ics" download="conferences.ics" title="Download all deadlines as iCal">.ics</a>
      <button class="viewbar-action" id="submitConfBtn" title="Suggest a missing conference">+ suggest</button>
    </div>
  </nav>

  <section class="filters" aria-label="Filters">
    <div class="filters-main">
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
        <button class="chip" data-tier="journal">Journal</button>
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Sort</span>
      <select class="select" id="sortSelect">
        <option value="deadline-asc">Deadline ↑</option>
        <option value="deadline-desc">Deadline ↓</option>
        <option value="conference-asc">Conf date ↑</option>
        <option value="name-asc">Name A→Z</option>
        <option value="tier-asc">Tier (A* first)</option>
      </select>
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
    </div>
    <div class="filters-search">
    <div class="filter-group filter-group-search">
      <input type="search" id="searchInput" placeholder="Search conferences…" autocomplete="off" aria-label="Search conferences">
      <label class="starred-toggle">
        <input type="checkbox" id="starredOnly">
        <span>★ Starred only</span>
      </label>
    </div>
    </div>
  </section>

  <main id="main">
    <section id="view-timeline" class="view"></section>
    <section id="view-cards" class="view hidden"></section>
    <section id="view-table" class="view hidden"></section>
    <section id="view-map" class="view hidden"></section>
  </main>

  <div id="detailModal" class="modal hidden" aria-hidden="true" aria-modal="true" role="dialog">
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel" role="document">
      <button class="modal-close" data-close aria-label="Close">×</button>
      <div id="modalBody"></div>
    </div>
  </div>

  <footer class="colophon">
    <span class="colophon-bit">Inter Tight · JetBrains Mono</span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit">Data refreshed ${(data.generated || new Date().toISOString()).slice(0, 10)}</span>
    <span class="colophon-sep">/</span>
    <span class="colophon-bit"><a class="colophon-link" href="https://github.com/douglaspmcgowan/conference-tracker" target="_blank" rel="noopener">github.com/douglaspmcgowan/conference-tracker</a></span>
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
  --paper-soft: #F2EEE5;
  --paper-deep: #E7E1D5;
  --paper-raised: rgba(255, 255, 255, 0.62);
  --ink: #0F0F0E;
  --ink-soft: #5B564E;
  --ink-faint: #8A847A;
  --rule: rgba(15, 15, 14, 0.09);
  --rule-soft: rgba(15, 15, 14, 0.05);
  --accent: #2D5BFF;
  --accent-soft: rgba(45, 91, 255, 0.10);
  --accent-line: rgba(45, 91, 255, 0.18);
  --urgent: #C53838;
  --urgent-soft: rgba(197, 56, 56, 0.12);
  --warn: #8C6239;
  --warn-soft: rgba(140, 98, 57, 0.12);
  --good: #2F6B3F;
  --tag-ink: #FAFAF7;
  --sans: "Inter Tight", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --measure: 65ch;
  --shadow-card: 0 18px 30px rgba(15, 15, 14, 0.035);
  --shadow-modal: 0 28px 72px rgba(15, 15, 14, 0.18);
  --dur-in: 120ms;
  --dur-out: 240ms;
  --ease-in: cubic-bezier(0.3, 0, 0.7, 1);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
[data-theme="dark"] {
  --paper: #15120E;
  --paper-soft: #1D1914;
  --paper-deep: #272118;
  --paper-raised: rgba(39, 33, 24, 0.86);
  --ink: #E9E2D2;
  --ink-soft: #B9B09F;
  --ink-faint: #877C6B;
  --rule: rgba(233, 226, 210, 0.12);
  --rule-soft: rgba(233, 226, 210, 0.07);
  --accent: #7A9CFF;
  --accent-soft: rgba(122, 156, 255, 0.14);
  --accent-line: rgba(122, 156, 255, 0.24);
  --urgent: #FF7B75;
  --urgent-soft: rgba(255, 123, 117, 0.16);
  --warn: #D2AD79;
  --warn-soft: rgba(210, 173, 121, 0.16);
  --tag-ink: #FAFAF7;
  --shadow-card: 0 18px 32px rgba(0, 0, 0, 0.28);
  --shadow-modal: 0 30px 80px rgba(0, 0, 0, 0.52);
}
* { box-sizing: border-box; }
html {
  font-family: var(--sans);
  font-size: 16px;
  font-optical-sizing: auto;
  font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.58;
}
body { margin: 0; background: var(--paper); color: var(--ink); min-height: 100dvh; }
button, input, textarea, select { font: inherit; }
p, .masthead-lede, .card-fullname, .card-fit, .modal-fullname, .timeline-empty {
  max-width: var(--measure);
  text-wrap: pretty;
  font-variant-numeric: oldstyle-nums;
}
h1, h2, h3, .brand-title, .card-name, .modal-name { text-wrap: balance; }
code {
  font-family: var(--mono);
  font-size: 0.82em;
  padding: 0.12rem 0.38rem;
  border-radius: 4px;
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule);
}
::selection { background: var(--accent-soft); color: var(--ink); }
:focus { outline: none; }
:where(a, button, input, label, select, textarea):focus-visible { outline: none; box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent); }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 1000;
  opacity: 0.036; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
[data-theme="dark"] .grain { mix-blend-mode: screen; opacity: 0.042; }

/* ------ Masthead ------ */
.masthead { max-width: 78rem; margin: 0 auto; padding: clamp(2.4rem, 4.6vw, 3.4rem) 2rem 1.4rem; }
.masthead-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 0.9rem; }
.brand { display: flex; align-items: flex-start; gap: 0.85rem; min-width: 0; }
.brand-mark {
  margin-top: 0.18rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  flex-shrink: 0;
  color: var(--accent);
  background: var(--paper-raised);
  box-shadow: inset 0 0 0 1px var(--rule);
  border-radius: 6px;
}
.brand-mark svg { display: block; }
.brand-titles { min-width: 0; display: flex; flex-direction: column; gap: 0.18rem; }
/* .brand-eyebrow removed — redundant above h1 and was an AI-ism (mono eyebrow) */
.brand-title { font-size: clamp(1.45rem, 2.5vw, 1.8rem); font-weight: 600; letter-spacing: -0.028em; margin: 0; line-height: 1.06; max-width: 24ch; }
.amp { font-family: "Inter Tight", serif; font-style: italic; font-weight: 500; color: var(--accent); padding: 0 0.04em; }
.masthead-lede { color: var(--ink-soft); font-size: 1.02rem; margin: 0 0 1.18rem; line-height: 1.66; }
.masthead-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.6rem;
  padding-top: 0.95rem;
  border-top: 1px solid var(--rule);
  font-family: var(--sans);
  font-size: 0.74rem;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
}
.stat { display: inline-flex; align-items: baseline; gap: 0.46rem; min-height: 1.5rem; }
.stat strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 1rem;
  letter-spacing: -0.02em;
  text-transform: none;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat .stat-accent { color: var(--accent); }
.stat .stat-urgent { color: var(--urgent); }

.theme-toggle {
  width: 2.55rem;
  height: 2.55rem;
  background: var(--paper-raised);
  border: 0;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--rule);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 1rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
}
.theme-toggle:hover {
  color: var(--ink);
  background: var(--paper-soft);
  box-shadow: inset 0 0 0 1px var(--rule), 0 8px 18px rgba(15, 15, 14, 0.06);
  transform: translateY(-1px);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
[data-theme="dark"] .theme-toggle:hover { box-shadow: inset 0 0 0 1px var(--rule), 0 10px 20px rgba(0, 0, 0, 0.24); }
.theme-icon-dark { display: none; }
[data-theme="dark"] .theme-icon-light { display: none; }
[data-theme="dark"] .theme-icon-dark { display: inline; }

/* ------ View tabs ------ */
.viewbar { max-width: 78rem; margin: 0 auto; padding: 0 2rem; border-top: 1px solid var(--rule-soft); border-bottom: 1px solid var(--rule); }
.viewbar-inner { display: flex; gap: 1.4rem; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.viewbar-inner::-webkit-scrollbar { display: none; }
.view-tab {
  flex: 0 0 auto;
  background: transparent;
  border: 0;
  padding: 0.92rem 0 0.78rem;
  cursor: pointer;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--ink-faint);
  opacity: 0.72;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out),
    opacity var(--dur-out) var(--ease-out);
  letter-spacing: -0.005em;
}
.view-tab:hover { color: var(--ink-soft); opacity: 1; transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.view-tab.active { color: var(--ink); opacity: 1; border-bottom-color: var(--accent); }

.viewbar-spacer { flex: 1 1 auto; min-width: 0.5rem; }
.viewbar-action {
  flex: 0 0 auto;
  align-self: center;
  margin: 0.4rem 0;
  padding: 0.32rem 0.7rem;
  font-family: var(--sans);
  font-size: 0.74rem;
  letter-spacing: 0.02em;
  color: var(--ink-soft);
  text-decoration: none;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 3px;
  cursor: pointer;
  transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out);
}
.viewbar-action:hover { color: var(--ink); border-color: var(--ink-soft); transition-duration: var(--dur-in); }

/* ------ Select (sort + status) ------ */
.select {
  font-family: var(--sans);
  font-size: 0.84rem;
  color: var(--ink);
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 3px;
  padding: 0.34rem 1.6rem 0.34rem 0.7rem;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='currentColor' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.55rem center;
  background-size: 0.6rem;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.select:hover { border-color: var(--ink-soft); transition-duration: var(--dur-in); }
.select:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent); }

/* ------ Status pill (per-conf state) ------ */
.status-pill {
  display: inline-flex; align-items: center;
  font-family: var(--mono);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.12rem 0.42rem;
  border-radius: 2px;
  background: var(--paper-deep);
  color: var(--ink-soft);
  font-weight: 500;
  margin-left: 0.35rem;
}
.status-pill.status-interested { background: var(--accent-soft); color: var(--accent); }
.status-pill.status-drafting   { background: var(--warn-soft);   color: var(--warn); }
.status-pill.status-submitted  { background: rgba(45, 91, 255, 0.18); color: var(--accent); }
.status-pill.status-accepted   { background: rgba(47, 107, 63, 0.16); color: var(--good, #2F6B3F); }
.status-pill.status-rejected   { background: var(--urgent-soft); color: var(--urgent); }

.note-mark {
  font-family: var(--mono);
  font-size: 0.85rem;
  color: var(--ink-faint);
  margin-left: 0.25rem;
  cursor: default;
}

/* ------ Colophon link ------ */
.colophon-link {
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out);
}
.colophon-link:hover { color: var(--ink); border-color: var(--ink-soft); transition-duration: var(--dur-in); }

/* ------ Map view ------ */
.map-wrap { position: relative; }
.map-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.4rem;
  padding: 0.4rem 0 1.1rem;
  font-family: var(--sans);
  font-size: 0.74rem;
  color: var(--ink-faint);
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--rule-soft);
  margin-bottom: 1.1rem;
}
.map-meta strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  font-size: 1rem;
  letter-spacing: -0.01em;
  margin-right: 0.4rem;
  font-variant-numeric: tabular-nums;
}
.map-meta .map-hint { color: var(--ink-faint); font-style: italic; text-transform: none; letter-spacing: 0.02em; }
.map-svg-wrap { position: relative; }
.map-svg { display: block; max-width: 100%; height: auto; }
.map-marker { cursor: pointer; transition: transform var(--dur-out) var(--ease-out); transform-box: fill-box; transform-origin: center; }
.map-marker:hover { transition-duration: var(--dur-in); }
.map-marker:hover circle:nth-child(1) { fill-opacity: 0.20; }
.map-tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--ink);
  color: var(--paper);
  padding: 0.45rem 0.7rem;
  border-radius: 3px;
  font-size: 0.8rem;
  line-height: 1.35;
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  transform: translate(-50%, calc(-100% - 6px));
  opacity: 0;
  transition: opacity 140ms ease;
  white-space: nowrap;
  font-family: var(--sans);
}
.map-tooltip.visible { opacity: 1; }

/* ------ Modal tracking (status + notes) ------ */
.modal-tracking { display: flex; flex-direction: column; gap: 0.85rem; }
.tracking-row {
  display: flex; align-items: center; gap: 0.85rem;
  font-size: 0.92rem;
}
.tracking-row-stack { flex-direction: column; align-items: stretch; gap: 0.4rem; }
.tracking-label {
  font-family: var(--sans);
  font-size: 0.74rem;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  width: 5.5rem;
  flex-shrink: 0;
}
.tracking-row-stack .tracking-label { width: auto; }
.notes-area {
  width: 100%;
  font-family: var(--sans);
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--ink);
  background: var(--paper-soft);
  border: 1px solid var(--rule);
  border-radius: 3px;
  padding: 0.7rem 0.85rem;
  resize: vertical;
  min-height: 5rem;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.notes-area:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent); border-color: transparent; background: var(--paper); }
.notes-area::placeholder { color: var(--ink-faint); }

.modal-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.1rem; }
.modal-link-btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule);
}
.modal-link-btn-secondary:hover { background: var(--paper-soft); color: var(--ink); border-color: var(--ink-soft); }

/* ------ Filters ------ */
.filters { max-width: 78rem; margin: 0 auto; padding: 1.15rem 2rem 1.45rem; display: flex; gap: 1.25rem 2rem; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--rule); }
.filters-main { display: flex; flex: 1 1 42rem; flex-wrap: wrap; gap: 1rem 1.6rem; min-width: 0; }
.filters-search { display: flex; justify-content: flex-end; flex: 0 1 24rem; min-width: min(100%, 20rem); }
.filter-group { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 0.35rem 0.75rem; min-width: min(100%, 13rem); }
.filter-group-search { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; flex-wrap: wrap; width: 100%; min-width: 0; }
.filter-label {
  padding-top: 0.38rem;
  font-family: var(--sans);
  font-size: 0.69rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
  white-space: nowrap;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.chip {
  background: var(--paper-raised); border: 0;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  padding: 0.42rem 0.78rem 0.44rem; border-radius: 999px;
  font-family: var(--sans); font-size: 0.82rem; cursor: pointer; color: var(--ink-soft);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-feature-settings: "kern" 1, "liga" 1;
}
.chip:hover { color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.chip.active { background: var(--ink); color: var(--paper); box-shadow: none; }
.chip[data-field].active {
  background: var(--field-color, var(--ink));
  color: #FAFAF7;
  box-shadow: inset 0 0 0 999px rgba(15, 15, 14, 0.30);
}
[data-theme="dark"] .chip[data-field].active { box-shadow: inset 0 0 0 999px rgba(15, 15, 14, 0.34); }
.chip-dot { width: 0.48rem; height: 0.48rem; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(250, 250, 247, 0.48); }
#searchInput {
  background: var(--paper-raised); border: 0; border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--rule);
  padding: 0.58rem 0.88rem 0.6rem; font: inherit; font-size: 0.9rem; color: var(--ink); width: min(19rem, 100%);
  transition: box-shadow var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
#searchInput::placeholder { color: var(--ink-faint); }
#searchInput:hover { box-shadow: inset 0 0 0 1px var(--rule), 0 4px 14px rgba(15, 15, 14, 0.03); }
#searchInput:focus, #searchInput:focus-visible { outline: none; box-shadow: inset 0 0 0 1px var(--accent-line), 0 0 0 2px var(--accent); background: var(--paper); }
.starred-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.44rem 0.72rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  color: var(--ink-soft);
  background: var(--paper-raised);
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  border-radius: 999px;
  letter-spacing: normal;
  cursor: pointer;
  user-select: none;
}
.starred-toggle input { margin: 0; accent-color: var(--accent); }

/* ------ Main ------ */
main { max-width: 78rem; margin: 0 auto; padding: 1.6rem 2rem 6rem; }
.view.hidden { display: none; }

/* ------ Per-view sub-toolbar (mode toggles, density, etc.) ------ */
.view-toolbar {
  display: flex;
  align-items: center;
  gap: 0.7rem 1.1rem;
  flex-wrap: wrap;
  padding: 0 0 1rem;
  margin-bottom: 0.95rem;
  border-bottom: 1px solid var(--rule-soft);
  font-family: var(--sans);
  font-size: 0.7rem;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.view-toolbar-label { color: var(--ink-faint); margin-right: 0.18rem; }
.view-toolbar-group { display: inline-flex; align-items: center; gap: 0.32rem; padding: 0.18rem; background: var(--paper-soft); border-radius: 4px; box-shadow: inset 0 0 0 1px var(--rule-soft); }
.view-toolbar-btn {
  background: transparent;
  border: 0;
  padding: 0.32rem 0.72rem 0.34rem;
  border-radius: 3px;
  font: inherit;
  color: var(--ink-soft);
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  transition: background-color var(--dur-out) var(--ease-out), color var(--dur-out) var(--ease-out);
}
.view-toolbar-btn:hover { color: var(--ink); transition-duration: var(--dur-in); }
.view-toolbar-btn.active { background: var(--paper-raised); color: var(--ink); box-shadow: inset 0 0 0 1px var(--rule); }
.view-toolbar-spacer { flex: 1 1 auto; }
.view-toolbar-hint { color: var(--ink-faint); font-style: italic; text-transform: none; letter-spacing: 0.02em; font-family: var(--sans); font-size: 0.78rem; }

/* ------ Timeline ------ */
.timeline-wrap { position: relative; }
.timeline-scroll { overflow-x: auto; overflow-y: visible; padding-bottom: 0.35rem; }
.timeline-scroll::-webkit-scrollbar { height: 8px; }
.timeline-scroll::-webkit-scrollbar-track { background: transparent; }
.timeline-scroll::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
.timeline-empty { color: var(--ink-faint); font-style: italic; padding: 4.5rem 0; text-align: center; }
.timeline-svg { display: block; }
.timeline-svg text { font-kerning: normal; text-rendering: geometricPrecision; }
.timeline-svg text[text-anchor="end"] {
  font-size: 12.75px;
  font-weight: 560;
  fill: var(--ink);
  letter-spacing: -0.01em;
}
.timeline-svg text[text-anchor="end"] tspan {
  font-family: var(--mono);
  font-size: 10.4px;
  font-weight: 450;
  fill: var(--ink-faint);
  letter-spacing: 0.02em;
}
.timeline-row-hover { fill: var(--accent-soft); cursor: pointer; }
.timeline-deadline-marker {
  cursor: pointer;
  transition:
    r var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
}
.timeline-deadline-marker:hover { r: 7; transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.timeline-tooltip {
  position: absolute; pointer-events: none;
  background: var(--paper-raised); color: var(--ink);
  border: 1px solid var(--rule);
  padding: 0.6rem 0.82rem 0.65rem; border-radius: 7px; font-size: 0.82rem; line-height: 1.45;
  box-shadow: 0 4px 16px rgba(15, 15, 14, 0.10), 0 1px 3px rgba(15, 15, 14, 0.06);
  max-width: 22rem; transform: translate(-50%, calc(-100% - 10px));
  white-space: normal; opacity: 0; transition: opacity var(--dur-out) var(--ease-out);
  font-family: var(--sans);
}
[data-theme="dark"] .timeline-tooltip {
  background: var(--paper-raised);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28), 0 1px 4px rgba(0, 0, 0, 0.18);
}
.timeline-tooltip.visible { opacity: 1; }
.timeline-tooltip strong { color: var(--ink); font-weight: 600; }
.timeline-tooltip .tt-date { font-family: var(--mono); font-size: 0.76rem; color: var(--ink-soft); margin-top: 0.22rem; display: block; }

.timeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem 1.15rem;
  padding: 0.15rem 0 1rem;
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-family: var(--sans);
  border-bottom: 1px solid var(--rule);
  margin-bottom: 1.1rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.legend-item { display: inline-flex; align-items: center; gap: 0.42rem; white-space: nowrap; }
.legend-mark { display: inline-block; flex-shrink: 0; }
.legend-mark.deadline { width: 0.6rem; height: 0.6rem; border-radius: 50%; background: var(--ink); }
.legend-mark.notification { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: var(--ink-faint); }
.legend-mark.conference { width: 0.9rem; height: 0.4rem; border-radius: 2px; background: var(--accent-soft); border: 1px solid var(--accent-line); }
.legend-mark.cal-deadline {
  width: 0.9rem; height: 0.72rem; border-radius: 2px; overflow: hidden;
  background: linear-gradient(to bottom, #5B6BBF 0%, #5B6BBF 34%, #B8753B 34%, #B8753B 67%, #2F8A6E 67%, #2F8A6E 100%);
}
.legend-mark.today-mark {
  width: 0.9rem; height: 0.72rem; border-radius: 2px; position: relative;
  background: rgba(45, 91, 255, 0.16);
}
.legend-mark.today-mark::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: inset 0 0 0 2px var(--accent);
}
[data-theme="dark"] .legend-mark.today-mark { background: rgba(122, 156, 255, 0.18); }
.legend-mark.estimated { width: 0.6rem; height: 0.6rem; border-radius: 50%; background: transparent; border: 1.5px solid var(--ink-soft); }

/* ------ Timeline calendar mode (month-grid heatmap) ------ */
.tlcal {
  display: grid;
  grid-template-columns: minmax(5rem, max-content) 1fr;
  gap: 0.18rem 0.85rem;
  align-items: center;
  font-variant-numeric: tabular-nums;
  font-family: var(--sans);
}
.tlcal-month {
  font-family: var(--mono);
  font-size: 0.74rem;
  color: var(--ink-faint);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: right;
  padding-right: 0.2rem;
  font-weight: 500;
}
.tlcal-month.current { color: var(--accent); font-weight: 600; }
.tlcal-month.boundary { color: var(--ink-soft); }
.tlcal-row {
  display: grid;
  grid-template-columns: repeat(31, 1fr);
  gap: 2px;
  height: 1.55rem;
  align-items: stretch;
}
.tlcal-cell {
  position: relative;
  background: var(--paper-soft);
  border-radius: 2px;
  cursor: default;
  transition: background-color var(--dur-out) var(--ease-out), transform var(--dur-out) var(--ease-out);
}
.tlcal-cell.empty { background: transparent; box-shadow: inset 0 0 0 1px var(--rule-soft); opacity: 0.5; }
.tlcal-cell.weekend { background: var(--paper-deep); opacity: 0.5; }
.tlcal-cell.today {
  z-index: 1;
  background: rgba(45, 91, 255, 0.16);
}
.tlcal-cell.today::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 0 0 2px var(--accent);
  z-index: 3;
}
[data-theme="dark"] .tlcal-cell.today { background: rgba(122, 156, 255, 0.18); }
.tlcal-cell.has-deadline { cursor: pointer; }
.tlcal-cell.has-deadline:hover {
  transform: scale(1.22); z-index: 2;
  box-shadow: 0 3px 10px rgba(0,0,0,0.16);
  transition-duration: var(--dur-in); transition-timing-function: var(--ease-in);
}
.tlcal-cell .tlcal-stack {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  border-radius: inherit; overflow: hidden;
}
.tlcal-cell .tlcal-stack > i { display: block; flex: 1 1 0; }
.tlcal-cell .tlcal-count {
  position: absolute; bottom: 1px; right: 2px;
  font-family: var(--mono); font-size: 0.6rem; color: #fff; font-weight: 700;
  background: rgba(0,0,0,0.38); border-radius: 2px; padding: 0 2px;
  line-height: 1.35; letter-spacing: 0; z-index: 2;
}
.tlcal-axis {
  display: grid;
  grid-template-columns: repeat(31, 1fr);
  gap: 2px;
  font-family: var(--mono);
  font-size: 0.62rem;
  color: var(--ink-faint);
  text-align: center;
  padding-bottom: 0.3rem;
  letter-spacing: 0;
}
.tlcal-axis span { line-height: 1; }
.tlcal-empty-msg { grid-column: 2; color: var(--ink-faint); font-style: italic; padding: 0.4rem 0; font-family: var(--sans); font-size: 0.85rem; text-transform: none; letter-spacing: 0; }

/* ------ Cards: density modes ------ */
.cards-grid.density-spacious { grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr)); gap: 1.6rem; }
.cards-grid.density-spacious .card { padding: 1.7rem 1.85rem 1.85rem; gap: 0.85rem; }
.cards-grid.density-spacious .card-name { font-size: 1.42rem; }
.cards-grid.density-spacious .card-fullname { font-size: 0.95rem; max-width: 50ch; }
.cards-grid.density-spacious .card-meta { font-size: 0.92rem; gap: 0.5rem 1.1rem; }
.cards-grid.density-spacious .card-fit { font-size: 0.96rem; }
.cards-grid.density-compact { grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr)); gap: 0.95rem; }
.cards-grid.density-compact .card { padding: 1rem 1.05rem 1.1rem; gap: 0.55rem; }
.cards-grid.density-compact .card-name { font-size: 1.04rem; }
.cards-grid.density-compact .card-fullname { font-size: 0.78rem; line-height: 1.42; }
.cards-grid.density-compact .card-meta { font-size: 0.76rem; gap: 0.22rem 0.7rem; padding-top: 0.5rem; }
.cards-grid.density-compact .card-meta dt { font-size: 0.62rem; }
.cards-grid.density-compact .card-fit { font-size: 0.78rem; padding-top: 0.5rem; }
.cards-grid.density-compact .card-tag { font-size: 0.62rem; padding: 0.16rem 0.42rem; }
.cards-grid.density-compact .card-actions { padding-top: 0.4rem; gap: 0.5rem; }

/* ------ Map continents overlay ------ */
.map-continent {
  fill: var(--paper-deep);
  stroke: var(--rule);
  stroke-width: 0.7;
  stroke-linejoin: round;
  pointer-events: none;
}
[data-theme="dark"] .map-continent {
  fill: rgba(233, 226, 210, 0.04);
  stroke: rgba(233, 226, 210, 0.10);
}

/* ------ Cards ------ */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20.5rem, 1fr)); gap: 1.4rem; align-items: start; }
.card {
  background: var(--paper-raised); border: 0; border-radius: 10px;
  padding: 1.35rem 1.45rem 1.5rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft), 0 1px 0 var(--rule-soft);
  transition:
    transform var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out);
  cursor: pointer; display: flex; flex-direction: column; gap: 0.72rem; position: relative; min-height: 100%;
}
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38);
}
[data-theme="dark"] .card::after { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04); }
.card:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 1px var(--rule), var(--shadow-card);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
.card-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.85rem; }
.card-name { font-size: 1.18rem; font-weight: 600; letter-spacing: -0.02em; margin: 0; line-height: 1.15; font-feature-settings: "kern" 1, "liga" 1; }
.card-name .year { display: inline-block; font-family: var(--mono); font-size: 0.77rem; font-weight: 450; color: var(--ink-faint); margin-left: 0.45rem; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; vertical-align: 0.14em; }
.card-tier {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  font-family: var(--mono); font-size: 0.67rem; padding: 0.24rem 0.56rem 0.26rem;
  border-radius: 999px; background: var(--paper-deep); color: var(--ink-soft);
  letter-spacing: 0.06em; flex-shrink: 0; font-weight: 500; line-height: 1.35;
  text-transform: uppercase;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.card-tier.tier-a-star, .card-tier.tier-A { color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent-line); }
.card-tier.tier-industry { color: #7B5633; background: rgba(140, 98, 57, 0.12); box-shadow: inset 0 0 0 1px rgba(140, 98, 57, 0.18); }
[data-theme="dark"] .card-tier.tier-industry { color: #D2AD79; background: rgba(210, 173, 121, 0.14); box-shadow: inset 0 0 0 1px rgba(210, 173, 121, 0.22); }
.card-fullname { color: var(--ink-soft); font-size: 0.87rem; line-height: 1.55; margin: 0; max-width: 38ch; text-wrap: pretty; }
.card-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.card-tag {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  font-family: var(--mono); font-size: 0.67rem; padding: 0.22rem 0.52rem 0.24rem;
  border-radius: 999px; color: var(--tag-ink); letter-spacing: 0.04em; font-weight: 500;
  line-height: 1.4;
  box-shadow: inset 0 0 0 999px rgba(12, 10, 8, 0.30), inset 0 0 0 1px rgba(250, 250, 247, 0.15);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
}
[data-theme="dark"] .card-tag { box-shadow: inset 0 0 0 999px rgba(12, 10, 8, 0.34), inset 0 0 0 1px rgba(250, 250, 247, 0.16); }
.card-meta {
  display: grid; grid-template-columns: minmax(4.6rem, max-content) 1fr;
  gap: 0.38rem 0.95rem; font-size: 0.85rem;
  padding-top: 0.72rem; border-top: 1px solid var(--rule);
}
.card-meta dt {
  font-family: var(--mono); font-size: 0.68rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--ink-faint); padding-top: 0.12rem;
}
.card-meta dd { margin: 0; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1.45; }
.card-countdown {
  font-family: var(--mono); font-size: 0.72rem; padding: 0.22rem 0.52rem 0.24rem;
  border-radius: 999px; background: var(--paper-deep); color: var(--ink-soft);
  display: inline-flex; gap: 0.28rem; align-items: center; margin-left: 0.38rem;
  font-variant-numeric: tabular-nums; letter-spacing: 0.01em;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
}
.card-countdown.urgent { background: var(--urgent-soft); color: var(--urgent); box-shadow: inset 0 0 0 1px rgba(197, 56, 56, 0.18); }
.card-countdown.soon { background: var(--warn-soft); color: var(--warn); box-shadow: inset 0 0 0 1px rgba(140, 98, 57, 0.16); }
.card-countdown.passed { background: var(--rule-soft); color: var(--ink-faint); text-decoration: line-through; }
.card-fit {
  font-style: italic; color: var(--ink-soft); font-size: 0.88rem;
  line-height: 1.58; padding-top: 0.7rem;
  border-top: 1px solid var(--rule); text-wrap: pretty; max-width: 42ch;
}
.card-actions { display: flex; gap: 0.65rem; align-items: center; padding-top: 0.55rem; margin-top: auto; }
.card-link {
  font-size: 0.79rem; color: var(--ink-soft); text-decoration: none;
  padding: 0.25rem 0; border-bottom: 1px solid transparent;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out);
  font-family: var(--mono); letter-spacing: 0.03em;
}
.card-link:hover { color: var(--accent); border-color: var(--accent-line); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.star-btn {
  background: transparent; border: 0; cursor: pointer;
  border-radius: 999px;
  font-size: 1.08rem; color: var(--ink-faint); padding: 0.12rem; line-height: 1;
  transition:
    color var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out);
}
.star-btn:hover { color: var(--warn); background: var(--warn-soft); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.star-btn.starred { color: var(--warn); }
.card-actions .star-btn:last-child { margin-left: auto; }
.confidence-mark {
  font-family: var(--mono); font-size: 0.64rem; color: var(--ink-faint);
  letter-spacing: 0.06em; text-transform: uppercase; margin-left: auto;
}
.confidence-mark.estimated::before { content: "≈ "; opacity: 0.6; }

/* ------ Table ------ */
.table-wrap { overflow-x: auto; padding: 0.12rem 0 0.28rem; }
table.confs { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem; font-feature-settings: "kern" 1, "liga" 1; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
table.confs th, table.confs td { padding: 0.78rem 0.95rem; text-align: left; border-bottom: 1px solid var(--rule-soft); }
table.confs tbody tr:last-child td { border-bottom: 0; }
table.confs thead th { background: var(--paper); font-family: var(--mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); cursor: pointer; user-select: none; white-space: nowrap; font-weight: 500; transition: color var(--dur-out) var(--ease-out); }
table.confs thead th:hover { color: var(--ink); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
table.confs tbody tr { transition: background-color var(--dur-out) var(--ease-out); }
table.confs tbody tr:hover { background: rgba(45, 91, 255, 0.04); cursor: pointer; }
[data-theme="dark"] table.confs tbody tr:hover { background: rgba(122, 156, 255, 0.08); }
table.confs td.num { font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
.table-wrap .card-tag { margin: 0 0.25rem 0.2rem 0; }

/* ------ Modal ------ */
.modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.modal.hidden { display: none; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(19, 17, 15, 0.42); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
[data-theme="dark"] .modal-backdrop { background: rgba(9, 8, 7, 0.68); }
.modal-panel {
  position: relative; background: var(--paper); border: 0;
  border-radius: 10px; max-width: 38rem; width: min(38rem, 100%);
  max-height: min(86dvh, 44rem); overflow-y: auto; padding: 1.9rem 2rem 2rem;
  box-shadow: inset 0 0 0 1px var(--rule-soft), var(--shadow-modal);
}
[data-theme="dark"] .modal-panel { box-shadow: inset 0 0 0 1px var(--rule-soft), var(--shadow-modal); }
#modalBody { display: grid; gap: 0.3rem; }
.modal-close {
  position: absolute; top: 0.75rem; right: 0.8rem; background: var(--paper-raised); border: 0;
  box-shadow: inset 0 0 0 1px var(--rule-soft);
  font-size: 1.25rem; line-height: 1; cursor: pointer; color: var(--ink-faint); padding: 0;
  width: 2.25rem; height: 2.25rem; transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out); border-radius: 999px;
}
.modal-close:hover { color: var(--ink); background: var(--paper-soft); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.modal-name { font-size: clamp(1.45rem, 2.5vw, 1.72rem); margin: 0; font-weight: 600; letter-spacing: -0.03em; line-height: 1.08; }
.modal-fullname { color: var(--ink-soft); font-size: 0.95rem; margin: 0 0 0.3rem; line-height: 1.62; max-width: 50ch; text-wrap: pretty; }
.modal-section { margin: 0; padding-top: 0.95rem; border-top: 1px solid var(--rule); }
.modal-section h3 { font-family: var(--sans); font-size: 0.69rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); margin: 0 0 0.68rem; font-weight: 500; }
.modal-meta { display: grid; grid-template-columns: minmax(5.6rem, max-content) 1fr; gap: 0.48rem 1.25rem; font-size: 0.92rem; }
.modal-meta dt { font-family: var(--mono); font-size: 0.72rem; color: var(--ink-faint); padding-top: 0.1rem; letter-spacing: 0.05em; text-transform: uppercase; }
.modal-meta dd { margin: 0; font-variant-numeric: tabular-nums; line-height: 1.46; }
.modal-link-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 0.95rem 0.62rem; background: var(--paper-soft); color: var(--ink); text-decoration: none;
  border-radius: 999px; font-size: 0.79rem; font-weight: 500;
  box-shadow: inset 0 0 0 1px var(--rule);
  transition:
    color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out),
    transform var(--dur-out) var(--ease-out);
  margin-top: 0.85rem; letter-spacing: 0.01em;
  font-family: var(--sans);
}
.modal-link-btn:hover { color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent-line); transform: translateY(-1px); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }

/* ------ Footer ------ */
.colophon { max-width: 78rem; margin: 0 auto; padding: 1.7rem 2rem 2.6rem; border-top: 1px solid var(--rule); display: flex; flex-wrap: wrap; gap: 0.4rem 0.65rem; align-items: center; font-family: var(--mono); font-size: 0.7rem; color: var(--ink-faint); letter-spacing: 0.06em; text-transform: uppercase; }
.colophon-bit { white-space: nowrap; }
.colophon-sep { color: var(--rule); }

/* ------ Mobile ------ */
@media (max-width: 720px) {
  .masthead { padding: 1.8rem 1.25rem 1rem; }
  .brand-title { font-size: 1.4rem; }
  .viewbar, .filters, main, .colophon { padding-left: 1.25rem; padding-right: 1.25rem; }
  .masthead-lede { font-size: 0.96rem; margin-bottom: 1rem; }
  .masthead-stats { gap: 0.5rem 1rem; }
  .viewbar-inner { gap: 1rem; }
  .filters { padding-top: 1rem; gap: 0.95rem; }
  .filters-main { width: 100%; gap: 0.9rem; }
  .filters-search { width: 100%; min-width: 0; }
  .filter-group { grid-template-columns: 1fr; gap: 0.35rem; width: 100%; }
  .filter-label { padding-top: 0; }
  .filter-group-search { justify-content: flex-start; align-items: stretch; width: 100%; }
  #searchInput { flex: 1; min-width: 0; width: 100%; }
  .cards-grid { grid-template-columns: 1fr; gap: 1rem; }
  .card { padding: 1.15rem 1.1rem 1.2rem; }
  .card-name { font-size: 1.08rem; }
  .card-meta { grid-template-columns: 1fr; gap: 0.18rem; }
  .card-meta dt { padding-top: 0.25rem; }
  table.confs { font-size: 0.82rem; min-width: 44rem; }
  table.confs th, table.confs td { padding: 0.62rem 0.72rem; }
  .modal { padding: 0.75rem; }
  .modal-panel { padding: 1.45rem 1.2rem 1.35rem; max-width: 100%; max-height: calc(100dvh - 1.5rem); }
  .modal-meta { grid-template-columns: 1fr; gap: 0.16rem; }
  .modal-section { padding-top: 0.85rem; }
  .colophon { padding-top: 1.35rem; padding-bottom: 2rem; }
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

  // ------ City geocoding (lat, lng). Hand-curated for the cities the data uses. ------
  const CITY_GEO = {
    "Aix-en-Provence|France": [43.5297, 5.4474],
    "Austin|USA": [30.2672, -97.7431],
    "Bangkok|Thailand": [13.7563, 100.5018],
    "Barcelona|Spain": [41.3851, 2.1734],
    "Beijing|China": [39.9042, 116.4074],
    "Boston|USA": [42.3601, -71.0589],
    "Bremen|Germany": [53.0793, 8.8017],
    "Cagliari|Italy": [39.2238, 9.1217],
    "Cavtat|Croatia": [42.5808, 18.2168],
    "Charlotte|USA": [35.2271, -80.8431],
    "Dallas|USA": [32.7767, -96.7970],
    "Denver|USA": [39.7392, -104.9903],
    "Detroit|USA": [42.3314, -83.0458],
    "Dubai|UAE": [25.2048, 55.2708],
    "Dublin|Ireland": [53.3498, -6.2603],
    "Edinburgh|Scotland": [55.9533, -3.1883], "Edinburgh|UK": [55.9533, -3.1883],
    "El Segundo|USA": [33.9192, -118.4165],
    "Foz do Iguaçu|Brazil": [-25.5469, -54.5882],
    "Frankfurt|Germany": [50.1109, 8.6821],
    "Gothenburg|Sweden": [57.7089, 11.9746],
    "Graz|Austria": [47.0707, 15.4395],
    "Helsinki|Finland": [60.1699, 24.9384],
    "Houston|USA": [29.7604, -95.3698],
    "Istanbul|Türkiye": [41.0082, 28.9784], "Istanbul|Turkey": [41.0082, 28.9784],
    "Jeju|South Korea": [33.4996, 126.5312],
    "Kuala Lumpur|Malaysia": [3.1390, 101.6869],
    "Lancaster|UK": [54.0466, -2.8007],
    "Lieusaint|France": [48.6275, 2.5489],
    "Limassol|Cyprus": [34.7071, 33.0226],
    "Linz|Austria": [48.3069, 14.2858],
    "Lisbon|Portugal": [38.7223, -9.1393],
    "Ljubljana|Slovenia": [46.0569, 14.5058],
    "London|UK": [51.5074, -0.1278],
    "Los Angeles|USA": [34.0522, -118.2437],
    "Malmö|Sweden": [55.6050, 13.0038],
    "Melbourne|Australia": [-37.8136, 144.9631],
    "Milan|Italy": [45.4642, 9.1900],
    "Montreal|Canada": [45.5017, -73.5673], "Montréal|Canada": [45.5017, -73.5673],
    "Naples/Capri|Italy": [40.8518, 14.2681], "Napoli|Italy": [40.8518, 14.2681],
    "New York|USA": [40.7128, -74.0060],
    "Nottingham|UK": [52.9548, -1.1581],
    "Orlando|USA": [28.5383, -81.3792],
    "Paderborn|Germany": [51.7189, 8.7575],
    "Paris|France": [48.8566, 2.3522],
    "Patras|Greece": [38.2466, 21.7346],
    "Philadelphia|USA": [39.9526, -75.1652],
    "Pittsburgh|USA": [40.4406, -79.9959],
    "Puebla|Mexico": [19.0414, -98.2063],
    "Reno|USA": [39.5296, -119.8138],
    "Rio de Janeiro|Brazil": [-22.9068, -43.1729],
    "Rome|Italy": [41.9028, 12.4964],
    "Salt Lake City|USA": [40.7608, -111.8910],
    "San Diego|USA": [32.7157, -117.1611],
    "San Francisco|USA": [37.7749, -122.4194],
    "Santa Clara|USA": [37.3541, -121.9552],
    "Shanghai|China": [31.2304, 121.4737],
    "Shenyang|China": [41.8057, 123.4315],
    "Singapore|Singapore": [1.3521, 103.8198],
    "State College|USA": [40.7934, -77.8600],
    "Swansea|UK": [51.6214, -3.9436],
    "Sydney|Australia": [-33.8688, 151.2093],
    "Tampere|Finland": [61.4978, 23.7610],
    "Tokyo|Japan": [35.6762, 139.6503],
    "Toronto|Canada": [43.6532, -79.3832],
    "Tucson|USA": [32.2226, -110.9747],
    "Turin|Italy": [45.0703, 7.6869],
    "Vaasa|Finland": [63.0951, 21.6165],
    "Wellington|New Zealand": [-41.2865, 174.7762],
    "York|UK": [53.9600, -1.0873],
    "Yokohama|Japan": [35.4437, 139.6380],
  };
  function geo(c) {
    if (!c.location || !c.location.city) return null;
    const k = c.location.city + "|" + (c.location.country || "");
    return CITY_GEO[k] || null;
  }

  // ------ Continent outlines (very simplified, lat/lng).
  // Designed for equirectangular projection. Each polygon is a single ring.
  // Detail level is intentionally rough — purpose is geographic context, not
  // cartographic accuracy. Total ~250 points keeps the inline payload small.
  const CONTINENTS = [
    // North America (Alaska → continental US → Mexico → Central America → Greenland → back)
    [[71,-158],[70,-148],[69,-141],[60,-141],[60,-135],[55,-130],[50,-127],[42,-124],[35,-120],[32,-117],[26,-112],[22,-106],[19,-102],[15,-93],[18,-89],[16,-87],[10,-83],[8,-77],[10,-75],[12,-72],[18,-66],[19,-71],[21,-78],[24,-81],[26,-80],[30,-81],[34,-78],[37,-76],[39,-75],[42,-71],[44,-67],[46,-60],[48,-55],[55,-58],[60,-65],[62,-77],[63,-92],[68,-83],[73,-77],[75,-91],[79,-72],[83,-30],[78,-22],[68,-50],[58,-62],[60,-78],[55,-85],[58,-95],[68,-95],[70,-110],[70,-130],[71,-141],[70,-156],[71,-158]],
    // South America
    [[12,-72],[10,-65],[8,-60],[5,-52],[1,-49],[-3,-44],[-9,-35],[-15,-39],[-23,-41],[-30,-50],[-38,-58],[-50,-67],[-55,-68],[-54,-72],[-46,-74],[-41,-72],[-30,-71],[-22,-70],[-18,-71],[-10,-79],[-3,-81],[3,-77],[9,-77],[12,-72]],
    // Europe (very rough; merges British Isles)
    [[71,28],[70,32],[60,33],[55,38],[45,39],[41,29],[36,28],[37,22],[38,15],[36,14],[37,9],[42,3],[36,-6],[44,-9],[47,-3],[51,-6],[55,-8],[58,-3],[60,5],[63,11],[65,16],[68,15],[71,25],[71,28]],
    // Africa
    [[36,-6],[31,-10],[24,-15],[15,-17],[10,-15],[5,-9],[5,-2],[6,3],[5,8],[3,9],[2,15],[-3,12],[-8,13],[-15,12],[-18,12],[-23,14],[-29,17],[-34,18],[-34,21],[-32,28],[-30,32],[-25,35],[-15,40],[-10,40],[-1,42],[8,49],[12,52],[11,46],[12,43],[18,40],[24,37],[31,32],[34,25],[36,15],[35,11],[36,5],[37,2],[37,-1],[36,-6]],
    // Asia (large; merges Russia + India + China + SE Asia)
    [[71,28],[78,60],[78,100],[73,130],[71,142],[67,170],[60,170],[55,165],[50,156],[45,148],[42,140],[35,140],[32,131],[26,122],[22,114],[20,109],[10,108],[9,101],[1,103],[6,99],[10,95],[12,93],[16,94],[20,92],[22,89],[20,80],[8,78],[8,76],[15,73],[22,69],[24,60],[27,55],[28,49],[30,40],[37,40],[39,46],[44,50],[47,52],[55,60],[71,28]],
    // Australia
    [[-11,142],[-15,145],[-23,152],[-32,153],[-37,150],[-39,146],[-37,140],[-34,138],[-32,133],[-32,125],[-34,116],[-26,113],[-22,114],[-19,121],[-15,128],[-12,131],[-13,135],[-12,141],[-11,142]],
    // New Zealand (two main islands as a single rough polygon)
    [[-34,173],[-37,175],[-41,174],[-46,167],[-46,170],[-41,176],[-34,173]],
    // Madagascar
    [[-12,49],[-15,50],[-19,49],[-23,45],[-25,45],[-22,43],[-15,46],[-12,49]],
    // Greenland (simplified)
    [[83,-30],[78,-22],[70,-22],[60,-43],[60,-49],[68,-53],[75,-58],[83,-30]],
  ];

  const STATUSES = ["", "interested", "drafting", "submitted", "accepted", "rejected"];
  const STATUS_LABEL = {
    "": "—",
    "interested": "interested",
    "drafting": "drafting",
    "submitted": "submitted",
    "accepted": "accepted",
    "rejected": "rejected",
  };

  // ------ State ------
  const state = {
    view: localStorage.getItem("ct.view") || "timeline",
    fields: new Set(),               // empty = all
    tier: "all",
    window: "all",
    search: "",
    starredOnly: false,
    starred: new Set(JSON.parse(localStorage.getItem("ct.starred") || "[]")),
    notes: JSON.parse(localStorage.getItem("ct.notes") || "{}"),
    status: JSON.parse(localStorage.getItem("ct.status") || "{}"),
    sort: "deadline-asc",
    timelineMode: localStorage.getItem("ct.timelineMode") || "calendar",   // "calendar" | "gantt"
    cardDensity: localStorage.getItem("ct.cardDensity") || "comfortable",  // "compact" | "comfortable" | "spacious"
  };

  // ------ Hash state (sharable URL) ------
  // URL hash format: #f=HCI,ML&t=A*&w=90&q=neurips&s=1&sort=deadline-asc
  function readHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    const params = new URLSearchParams(h);
    if (params.has("f")) state.fields = new Set(params.get("f").split(",").filter(Boolean));
    if (params.has("t")) state.tier = params.get("t");
    if (params.has("w")) state.window = params.get("w");
    if (params.has("q")) state.search = params.get("q").toLowerCase();
    if (params.has("s")) state.starredOnly = params.get("s") === "1";
    if (params.has("sort")) state.sort = params.get("sort");
    if (params.has("v")) state.view = params.get("v");
  }
  function writeHash() {
    const params = new URLSearchParams();
    if (state.fields.size) params.set("f", [...state.fields].join(","));
    if (state.tier !== "all") params.set("t", state.tier);
    if (state.window !== "all") params.set("w", state.window);
    if (state.search) params.set("q", state.search);
    if (state.starredOnly) params.set("s", "1");
    if (state.sort !== "deadline-asc") params.set("sort", state.sort);
    const hash = params.toString();
    history.replaceState(null, "", hash ? "#" + hash : location.pathname);
  }
  readHash();

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
    btn.className = "chip" + (state.fields.has(key) ? " active" : "");
    btn.dataset.field = key;
    btn.style.setProperty("--field-color", f.color);
    btn.innerHTML = '<span class="chip-dot" style="background:' + f.color + '"></span>' + f.label;
    btn.addEventListener("click", () => {
      if (state.fields.has(key)) state.fields.delete(key);
      else state.fields.add(key);
      btn.classList.toggle("active", state.fields.has(key));
      writeHash(); render();
    });
    fieldChipsEl.appendChild(btn);
  });

  // ------ Tier chips ------
  document.querySelectorAll("#tierChips .chip").forEach(b => {
    b.classList.toggle("active", b.dataset.tier === state.tier);
    b.addEventListener("click", () => {
      state.tier = b.dataset.tier;
      document.querySelectorAll("#tierChips .chip").forEach(x => x.classList.toggle("active", x === b));
      writeHash(); render();
    });
  });

  // ------ Window chips ------
  document.querySelectorAll("#windowChips .chip").forEach(b => {
    b.classList.toggle("active", b.dataset.window === state.window);
    b.addEventListener("click", () => {
      state.window = b.dataset.window;
      document.querySelectorAll("#windowChips .chip").forEach(x => x.classList.toggle("active", x === b));
      writeHash(); render();
    });
  });

  // ------ Sort dropdown ------
  const sortSel = document.getElementById("sortSelect");
  if (sortSel) {
    sortSel.value = state.sort;
    sortSel.addEventListener("change", () => {
      state.sort = sortSel.value;
      writeHash(); render();
    });
  }

  // ------ Search ------
  const searchEl = document.getElementById("searchInput");
  if (state.search) searchEl.value = state.search;
  let searchTimer;
  searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchEl.value.trim().toLowerCase();
      writeHash(); render();
    }, 140);
  });

  // ------ Starred toggle ------
  const starredOnlyEl = document.getElementById("starredOnly");
  starredOnlyEl.checked = !!state.starredOnly;
  starredOnlyEl.addEventListener("change", (e) => {
    state.starredOnly = e.target.checked;
    writeHash(); render();
  });

  // ------ Submit a conference (opens prefilled GitHub issue in new tab) ------
  const submitBtn = document.getElementById("submitConfBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const tmpl = "Conference name (acronym + full):\\n\\nField(s):\\n\\nTier (A* / A / B / industry / journal):\\n\\nDeadline (YYYY-MM-DD):\\nNotification (YYYY-MM-DD):\\nConference dates (YYYY-MM-DD to YYYY-MM-DD):\\n\\nLocation (city, country):\\n\\nFormat / page limit / blind:\\n\\nCFP link:\\n\\nWhy it fits Doug's research (1 line):\\n\\nSources (≥2 URLs):\\n";
      const url = "https://github.com/douglaspmcgowan/conference-tracker/issues/new?title=" +
        encodeURIComponent("Suggest conference: ") +
        "&body=" + encodeURIComponent(tmpl.replace(/\\\\n/g, "\\n")) +
        "&labels=conference-suggestion";
      window.open(url, "_blank", "noopener");
    });
  }

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
  const initialViewEl = document.getElementById("view-" + state.view);
  if (initialViewEl) {
    initialViewEl.classList.remove("hidden");
  } else {
    state.view = "timeline";
    document.getElementById("view-timeline").classList.remove("hidden");
  }
  document.querySelectorAll(".view-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.view === state.view);
    t.setAttribute("aria-selected", t.dataset.view === state.view ? "true" : "false");
  });

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
    const list = CONFS.filter(c => {
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
    return sortConfs(list);
  }

  function sortConfs(list) {
    const TIER_ORDER = { "A*": 0, "A": 1, "B": 2, "industry": 3, "journal": 4 };
    const FAR = new Date(8640000000000000);
    const sortKey = state.sort || "deadline-asc";
    const out = list.slice();
    out.sort((a, b) => {
      switch (sortKey) {
        case "deadline-desc": {
          const da = parseDate(a.deadline) || FAR;
          const db = parseDate(b.deadline) || FAR;
          return db - da;
        }
        case "conference-asc": {
          const da = parseDate(a.conferenceStart) || FAR;
          const db = parseDate(b.conferenceStart) || FAR;
          return da - db;
        }
        case "name-asc":
          return a.name.localeCompare(b.name) || (a.year || 0) - (b.year || 0);
        case "tier-asc": {
          const ta = TIER_ORDER[a.tier] ?? 99;
          const tb = TIER_ORDER[b.tier] ?? 99;
          if (ta !== tb) return ta - tb;
          const da = parseDate(a.deadline) || FAR;
          const db = parseDate(b.deadline) || FAR;
          return da - db;
        }
        case "deadline-asc":
        default: {
          const da = parseDate(a.deadline) || parseDate(a.conferenceStart) || FAR;
          const db = parseDate(b.deadline) || parseDate(b.conferenceStart) || FAR;
          return da - db;
        }
      }
    });
    return out;
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
    else if (state.view === "map") renderMap(list);
    else renderTable(list);
  }

  // ------ Timeline view (dispatcher) ------
  function renderTimeline(list) {
    const el = document.getElementById("view-timeline");
    const toolbar =
      '<div class="view-toolbar">' +
        '<span class="view-toolbar-label">Timeline</span>' +
        '<div class="view-toolbar-group" id="tlModeGroup">' +
          '<button class="view-toolbar-btn ' + (state.timelineMode === "calendar" ? "active" : "") + '" data-mode="calendar">Calendar</button>' +
          '<button class="view-toolbar-btn ' + (state.timelineMode === "gantt" ? "active" : "") + '" data-mode="gantt">Gantt</button>' +
        '</div>' +
        '<span class="view-toolbar-spacer"></span>' +
        '<span class="view-toolbar-hint">' +
          (state.timelineMode === "calendar"
            ? "Each cell is a day. Filled cells have deadlines; hover for details."
            : "Horizontal bars span deadline → notification → conference dates.") +
        '</span>' +
      '</div>';

    if (!list.length) { el.innerHTML = toolbar + '<div class="timeline-empty">No conferences match the current filters.</div>'; bindTlMode(el); return; }

    el.innerHTML = toolbar + '<div id="tlBody"></div>';
    bindTlMode(el);

    const body = document.getElementById("tlBody");
    if (state.timelineMode === "calendar") renderTimelineCalendar(body, list);
    else renderTimelineGantt(body, list);
  }

  function bindTlMode(el) {
    el.querySelectorAll("#tlModeGroup [data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.timelineMode = btn.dataset.mode;
        localStorage.setItem("ct.timelineMode", state.timelineMode);
        render();
      });
    });
  }

  // ------ Calendar mode ------
  // Compact month-grid heatmap. Each row is a month, each cell is a day.
  // Cells with deadlines are colored by dominant field; hover reveals
  // conference name + countdown; click opens detail (or first if multiple).
  function renderTimelineCalendar(el, list) {
    // Bucket deadlines by YYYY-MM-DD
    const byDay = new Map();
    list.forEach(c => {
      if (!c.deadline) return;
      const d = parseDate(c.deadline);
      if (!d) return;
      const key = c.deadline.slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(c);
    });

    // Window: today - 30d → today + 18mo (or further if any deadline pushes it)
    const minD = new Date(TODAY); minD.setDate(1); minD.setMonth(minD.getMonth() - 1);
    let maxD = new Date(TODAY); maxD.setMonth(maxD.getMonth() + 18);
    list.forEach(c => {
      const d = parseDate(c.deadline);
      if (d && d > maxD) maxD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    });

    if (!byDay.size) {
      el.innerHTML = '<div class="timeline-empty">No deadlines in the current filter set.</div>';
      return;
    }

    // Day-of-month axis (1, 5, 10, …)
    let axis = '<div class="tlcal-month"></div><div class="tlcal-axis">';
    for (let d = 1; d <= 31; d++) {
      axis += '<span>' + (d === 1 || d === 5 || d === 10 || d === 15 || d === 20 || d === 25 || d === 30 ? d : "") + '</span>';
    }
    axis += '</div>';

    let rows = "";
    const cursor = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const todayKey = TODAY.toISOString().slice(0, 10);
    while (cursor <= maxD) {
      const y = cursor.getFullYear(), m = cursor.getMonth();
      const monthLabel = cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
      const isCurrent = (y === TODAY.getFullYear() && m === TODAY.getMonth());
      const isJan = m === 0;
      const dim = new Date(y, m + 1, 0).getDate();

      let cells = "";
      for (let d = 1; d <= 31; d++) {
        if (d > dim) {
          cells += '<div class="tlcal-cell empty"></div>';
          continue;
        }
        const dateObj = new Date(y, m, d);
        const dow = dateObj.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const key = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        const isToday = (key === todayKey);
        const dls = byDay.get(key);
        const cls = ["tlcal-cell"];
        if (isWeekend && !dls) cls.push("weekend");
        if (isToday) cls.push("today");
        if (dls && dls.length) cls.push("has-deadline");

        if (dls && dls.length) {
          // Stack horizontal stripes per field
          const stripes = dls.map(c => {
            const color = (FIELDS[c.fields[0]] || {}).color || "var(--ink-soft)";
            return '<i style="background:' + color + '"></i>';
          }).join("");
          const ids = dls.map(c => c.id).join(",");
          const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const tipLines = dls.map(c => c.name + " " + c.year + (c.confidence === "estimated" ? " (est.)" : "")).join(" / ");
          const count = dls.length > 1 ? '<span class="tlcal-count">' + dls.length + '</span>' : "";
          cells += '<div class="' + cls.join(" ") + '" data-ids="' + escapeAttr(ids) + '" data-tip-title="' + escapeAttr(tipLines) + '" data-tip-date="' + escapeAttr(dateLabel) + '" data-day="' + d + '">' +
            '<div class="tlcal-stack">' + stripes + '</div>' + count +
          '</div>';
        } else {
          cells += '<div class="' + cls.join(" ") + '" data-day="' + d + '"></div>';
        }
      }
      const monthCls = ["tlcal-month"];
      if (isCurrent) monthCls.push("current");
      if (isJan) monthCls.push("boundary");
      rows += '<div class="' + monthCls.join(" ") + '">' + monthLabel + '</div>' +
              '<div class="tlcal-row">' + cells + '</div>';
      cursor.setMonth(cursor.getMonth() + 1);
    }

    el.innerHTML =
      '<div class="timeline-legend">' +
        '<span class="legend-item"><span class="legend-mark cal-deadline"></span>Paper deadline (stripe = field)</span>' +
        '<span class="legend-item"><span class="legend-mark today-mark"></span>Today</span>' +
        '<span class="legend-item">Hover to preview · click to open</span>' +
      '</div>' +
      '<div class="timeline-wrap">' +
        '<div class="tlcal">' + axis + rows + '</div>' +
        '<div id="tlTooltip" class="timeline-tooltip"></div>' +
      '</div>';

    const tooltip = document.getElementById("tlTooltip");
    const wrap = el.querySelector(".timeline-wrap");
    el.querySelectorAll(".tlcal-cell.has-deadline").forEach(node => {
      node.addEventListener("mousemove", (ev) => {
        const title = node.getAttribute("data-tip-title") || "";
        const dateStr = node.getAttribute("data-tip-date") || "";
        tooltip.innerHTML = '<strong>' + escape(title) + '</strong><span class="tt-date">' + escape(dateStr) + '</span>';
        const wrapBox = wrap.getBoundingClientRect();
        tooltip.style.left = (ev.clientX - wrapBox.left) + "px";
        tooltip.style.top = (ev.clientY - wrapBox.top - 6) + "px";
        tooltip.classList.add("visible");
      });
      node.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      node.addEventListener("click", () => {
        const ids = (node.getAttribute("data-ids") || "").split(",").filter(Boolean);
        if (ids.length) openDetail(ids[0]);
      });
    });
  }

  // ------ Gantt mode (improved: fit-to-viewport + sticky months + tooltips) ------
  function renderTimelineGantt(el, list) {
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
    // Fit-to-viewport: pick dayPx so the timeline matches the container width
    // (with sensible min/max so it doesn't get unreadable for very long ranges).
    const containerW = Math.max(640, (el.parentElement ? el.parentElement.clientWidth : 1100) - 8);
    const labelW = 180;      // left label column
    const padR = 30;
    const rowH = 22;         // tighter rows
    const topPad = 48;       // room for month axis
    const dayPx = Math.max(2.4, Math.min(5.2, (containerW - labelW - padR) / totalDays));
    const width = labelW + totalDays * dayPx + padR;
    const height = topPad + rows.length * rowH + 18;

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
        const raw = node.getAttribute("data-tooltip") || "";
        const parts = raw.split(" · ");
        const head = escape(parts[0] || "");
        const tail = parts.slice(1).map(escape).join(" · ");
        tooltip.innerHTML = '<strong>' + head + '</strong>' + (tail ? '<span class="tt-date">' + tail + '</span>' : '');
        const wrapBox = wrap.getBoundingClientRect();
        const scrollEl = el.querySelector(".timeline-scroll");
        tooltip.style.left = (ev.clientX - wrapBox.left + (scrollEl ? scrollEl.scrollLeft : 0)) + "px";
        tooltip.style.top = (ev.clientY - wrapBox.top - 6) + "px";
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
  // List is pre-sorted by visibleConfs(). No local sort here.
  function renderCards(list) {
    const el = document.getElementById("view-cards");
    const toolbar =
      '<div class="view-toolbar">' +
        '<span class="view-toolbar-label">Density</span>' +
        '<div class="view-toolbar-group" id="cardDensityGroup">' +
          '<button class="view-toolbar-btn ' + (state.cardDensity === "compact" ? "active" : "") + '" data-density="compact">Compact</button>' +
          '<button class="view-toolbar-btn ' + (state.cardDensity === "comfortable" ? "active" : "") + '" data-density="comfortable">Comfortable</button>' +
          '<button class="view-toolbar-btn ' + (state.cardDensity === "spacious" ? "active" : "") + '" data-density="spacious">Spacious</button>' +
        '</div>' +
        '<span class="view-toolbar-spacer"></span>' +
        '<span class="view-toolbar-hint">' + list.length + ' conference' + (list.length === 1 ? "" : "s") + ' in view</span>' +
      '</div>';
    if (!list.length) { el.innerHTML = toolbar + '<div class="timeline-empty">No conferences match the current filters.</div>'; bindCardDensity(el); return; }

    const cardsHtml = list.map(c => {
      const days = daysUntil(parseDate(c.deadline));
      const cdCls = countdownClass(days);
      const cdTxt = c.deadline ? countdownText(days) : "no deadline";
      const tags = c.fields.map(f => {
        const meta = FIELDS[f] || { color: "#888", label: f };
        return '<span class="card-tag" style="background:' + meta.color + '">' + escape(meta.label) + '</span>';
      }).join("");
      const tierClass = c.tier === "A*" ? "tier-a-star" : "tier-" + c.tier;
      const isStarred = state.starred.has(c.id);
      const status = state.status[c.id] || "";
      const noteCount = (state.notes[c.id] || "").length;

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
          (status ? '<span class="status-pill status-' + status + '">' + escape(STATUS_LABEL[status] || status) + '</span>' : '') +
          (noteCount ? '<span class="note-mark" title="You\\'ve added notes">⊝</span>' : '') +
          (c.confidence === "estimated" ? '<span class="confidence-mark estimated">est.</span>' : '') +
          '<button class="star-btn ' + (isStarred ? "starred" : "") + '" data-star="' + c.id + '" aria-label="Star" title="Star">★</button>' +
        '</div>' +
      '</article>';
    }).join("");
    el.innerHTML = toolbar + '<div class="cards-grid density-' + state.cardDensity + '">' + cardsHtml + '</div>';
    bindCardDensity(el);

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

  function bindCardDensity(el) {
    el.querySelectorAll("#cardDensityGroup [data-density]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.cardDensity = btn.dataset.density;
        localStorage.setItem("ct.cardDensity", state.cardDensity);
        render();
      });
    });
  }

  // ------ Table view ------
  // List is pre-sorted by visibleConfs(). Column-header clicks remap state.sort
  // to one of the central keys, then trigger render() — which re-sorts globally.
  function renderTable(list) {
    const el = document.getElementById("view-table");
    if (!list.length) { el.innerHTML = '<div class="timeline-empty">No conferences match the current filters.</div>'; return; }
    const colSortMap = {
      name: "name-asc",
      tier: "tier-asc",
      deadline: "deadline-asc",
      conferenceStart: "conference-asc",
    };
    const rows = list.map(c => {
      const days = daysUntil(parseDate(c.deadline));
      const cdCls = countdownClass(days);
      const cdTxt = c.deadline ? countdownText(days) : "—";
      const isStarred = state.starred.has(c.id);
      const status = state.status[c.id] || "";
      return '<tr data-id="' + c.id + '">' +
        '<td><button class="star-btn ' + (isStarred ? "starred" : "") + '" data-star="' + c.id + '" aria-label="Star">★</button></td>' +
        '<td><strong>' + escape(c.name) + '</strong> <span style="color:var(--ink-faint);font-family:var(--mono);font-size:0.78rem;font-variant-numeric:tabular-nums">′' + String(c.year).slice(-2) + '</span>' +
          (status ? ' <span class="status-pill status-' + status + '">' + escape(STATUS_LABEL[status] || status) + '</span>' : '') +
        '</td>' +
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
        '<th>Field</th>' +
        '<th data-sort="tier">Tier</th>' +
        '<th data-sort="deadline">Deadline</th>' +
        '<th data-sort="conferenceStart">Conference</th>' +
        '<th>Where</th>' +
        '<th></th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';

    el.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const target = colSortMap[th.dataset.sort];
        if (target) {
          // Toggle asc/desc for deadline; everything else just sets the key.
          if (target === "deadline-asc" && state.sort === "deadline-asc") state.sort = "deadline-desc";
          else state.sort = target;
          if (sortSel) sortSel.value = state.sort;
          writeHash(); render();
        }
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

  // ------ Map view ------
  // Equirectangular projection. Hairline rectangle, no decorative continents.
  // Conferences without a known city are bucketed at the bottom as "no location".
  function renderMap(list) {
    const el = document.getElementById("view-map");
    if (!list.length) { el.innerHTML = '<div class="timeline-empty">No conferences match the current filters.</div>'; return; }

    const W = 1120, H = 560, MX = 30, MY = 30;
    const innerW = W - 2 * MX, innerH = H - 2 * MY;
    const project = (lat, lng) => [
      MX + ((lng + 180) / 360) * innerW,
      MY + ((90 - lat) / 180) * innerH,
    ];

    // Group conferences by city to cluster overlapping markers.
    const byCity = new Map();
    const noLoc = [];
    for (const c of list) {
      const g = geo(c);
      if (!g) { noLoc.push(c); continue; }
      const k = c.location.city + "|" + (c.location.country || "");
      if (!byCity.has(k)) byCity.set(k, { city: c.location.city, country: c.location.country, lat: g[0], lng: g[1], confs: [] });
      byCity.get(k).confs.push(c);
    }

    let svg = '<svg class="map-svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map of conference locations">';
    // Hairline frame
    svg += '<rect x="' + MX + '" y="' + MY + '" width="' + innerW + '" height="' + innerH + '" fill="none" stroke="var(--rule)" stroke-width="1"/>';
    // Continent landmasses (simplified outlines, drawn before grid + markers)
    CONTINENTS.forEach(poly => {
      const pts = poly.map(([lat, lng]) => {
        const [x, y] = project(lat, lng);
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
      svg += '<polygon class="map-continent" points="' + pts + '"/>';
    });
    // Equator + tropics
    [-66.5, -23.4, 0, 23.4, 66.5].forEach(lat => {
      const y = project(lat, 0)[1];
      const dash = lat === 0 ? "" : 'stroke-dasharray="2 4"';
      svg += '<line x1="' + MX + '" y1="' + y + '" x2="' + (W-MX) + '" y2="' + y + '" stroke="var(--rule-soft)" stroke-width="1" ' + dash + '/>';
    });
    // Prime meridian
    const pmX = project(0, 0)[0];
    svg += '<line x1="' + pmX + '" y1="' + MY + '" x2="' + pmX + '" y2="' + (H-MY) + '" stroke="var(--rule-soft)" stroke-width="1" stroke-dasharray="2 4"/>';
    // Continent labels — minimal, faint
    const labels = [
      ["NORTH AMERICA", 45, -100], ["SOUTH AMERICA", -15, -60],
      ["EUROPE", 52, 18], ["AFRICA", 5, 22],
      ["ASIA", 38, 90], ["OCEANIA", -25, 140],
    ];
    labels.forEach(([t, lat, lng]) => {
      const [x, y] = project(lat, lng);
      svg += '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--ink-faint)" letter-spacing="0.1em" opacity="0.62">' + t + '</text>';
    });

    // Plot city markers
    [...byCity.values()].forEach((cluster) => {
      const [x, y] = project(cluster.lat, cluster.lng);
      const n = cluster.confs.length;
      const r = Math.min(11, 4 + Math.sqrt(n) * 1.6);
      // Dominant field color
      const fieldCount = {};
      cluster.confs.forEach(cf => (cf.fields || []).forEach(f => { fieldCount[f] = (fieldCount[f] || 0) + 1; }));
      const dominantField = Object.entries(fieldCount).sort((a,b) => b[1]-a[1])[0]?.[0];
      const color = (FIELDS[dominantField] || {}).color || "var(--ink-soft)";
      const ids = cluster.confs.map(c => c.id).join(",");
      const tooltip = cluster.city + (cluster.country ? ", " + cluster.country : "") + " · " + n + (n === 1 ? " conference" : " conferences");
      svg += '<g class="map-marker" data-ids="' + escapeAttr(ids) + '" data-tooltip="' + escapeAttr(tooltip) + '">' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 4) + '" fill="' + color + '" fill-opacity="0.10"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '" fill-opacity="0.78" stroke="var(--paper)" stroke-width="1.5"/>' +
        (n > 1 ? '<text x="' + x + '" y="' + (y + 3.5) + '" text-anchor="middle" font-family="var(--mono)" font-size="9" font-weight="600" fill="#fff">' + n + '</text>' : '') +
      '</g>';
    });

    svg += '</svg>';

    const knownCount = [...byCity.values()].reduce((a, c) => a + c.confs.length, 0);
    el.innerHTML =
      '<div class="map-wrap">' +
        '<div class="map-meta">' +
          '<span><strong>' + knownCount + '</strong> with known city</span>' +
          (noLoc.length ? '<span><strong>' + noLoc.length + '</strong> TBA / virtual</span>' : '') +
          '<span class="map-hint">Click a marker for details · circle area scales with count</span>' +
        '</div>' +
        '<div class="map-svg-wrap">' + svg + '</div>' +
        '<div class="map-tooltip" id="mapTooltip"></div>' +
      '</div>';

    const tooltip = document.getElementById("mapTooltip");
    el.querySelectorAll(".map-marker").forEach(g => {
      g.addEventListener("mousemove", (ev) => {
        tooltip.textContent = g.getAttribute("data-tooltip");
        const wrap = el.querySelector(".map-svg-wrap").getBoundingClientRect();
        tooltip.style.left = (ev.clientX - wrap.left) + "px";
        tooltip.style.top = (ev.clientY - wrap.top - 12) + "px";
        tooltip.classList.add("visible");
      });
      g.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      g.addEventListener("click", () => {
        const ids = (g.getAttribute("data-ids") || "").split(",");
        if (ids.length === 1) openDetail(ids[0]);
        else {
          // Multiple at one city: open the first; user can iterate.
          openDetail(ids[0]);
        }
      });
    });
  }

  // ------ Star / Notes / Status ------
  function toggleStar(id) {
    if (state.starred.has(id)) state.starred.delete(id);
    else state.starred.add(id);
    localStorage.setItem("ct.starred", JSON.stringify([...state.starred]));
    render();
  }
  function setNote(id, text) {
    if (text) state.notes[id] = text;
    else delete state.notes[id];
    localStorage.setItem("ct.notes", JSON.stringify(state.notes));
  }
  function setStatus(id, status) {
    if (status) state.status[id] = status;
    else delete state.status[id];
    localStorage.setItem("ct.status", JSON.stringify(state.status));
    render();
  }

  // ------ Modal ------
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  let _lastFocused = null;
  function openDetail(id) {
    _lastFocused = document.activeElement;
    const c = CONFS.find(x => x.id === id);
    if (!c) return;
    const days = daysUntil(parseDate(c.deadline));
    const tags = c.fields.map(f => {
      const meta = FIELDS[f] || { color: "#888", label: f };
      return '<span class="card-tag" style="background:' + meta.color + '">' + escape(meta.label) + '</span>';
    }).join(" ");
    const status = state.status[c.id] || "";
    const notes = state.notes[c.id] || "";
    const statusOpts = STATUSES.map(s =>
      '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + escape(STATUS_LABEL[s] || s) + '</option>'
    ).join("");
    const calIcs = "/cal.ics?ids=" + encodeURIComponent(c.id);

    modalBody.innerHTML =
      '<h2 class="modal-name">' + escape(c.name) + ' <span style="color:var(--ink-faint);font-family:var(--mono);font-size:1rem;font-weight:400;font-variant-numeric:tabular-nums">&prime;' + String(c.year).slice(-2) + '</span></h2>' +
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
      '<div class="modal-section"><h3>Your tracking</h3>' +
        '<div class="modal-tracking">' +
          '<label class="tracking-row"><span class="tracking-label">Status</span>' +
            '<select class="select" id="modal-status">' + statusOpts + '</select>' +
          '</label>' +
          '<label class="tracking-row tracking-row-stack"><span class="tracking-label">Notes</span>' +
            '<textarea class="notes-area" id="modal-notes" rows="3" placeholder="Draft progress, co-authors, blockers…">' + escape(notes) + '</textarea>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<a class="modal-link-btn" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener">Open CFP ↗</a>' +
        '<a class="modal-link-btn modal-link-btn-secondary" href="' + escapeAttr(calIcs) + '" download="' + escape(c.id) + '.ics">+ Calendar (.ics)</a>' +
      '</div>';

    const statusEl = document.getElementById("modal-status");
    if (statusEl) statusEl.addEventListener("change", () => setStatus(c.id, statusEl.value));
    const notesEl = document.getElementById("modal-notes");
    if (notesEl) {
      let nt;
      notesEl.addEventListener("input", () => {
        clearTimeout(nt);
        nt = setTimeout(() => setNote(c.id, notesEl.value), 300);
      });
    }
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    // Move focus into modal for keyboard accessibility
    requestAnimationFrame(() => {
      const closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.focus();
    });
  }
  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeDetail();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });
  function closeDetail() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    // Restore focus to the element that triggered the modal
    if (_lastFocused && typeof _lastFocused.focus === "function") _lastFocused.focus();
  }

  // ------ Helpers ------
  function escape(s) { return String(s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function escapeAttr(s) { return escape(s); }

  // ------ Init ------
  render();
})();
`;
}

if (!process.env.VERCEL) {
  app.listen(PORT, () =>
    console.log("Conference Tracker on http://localhost:" + PORT),
  );
}
module.exports = app;
