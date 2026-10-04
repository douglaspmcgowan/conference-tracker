import type { Request, Response } from "express";

const express = require("express") as typeof import("express");
const data = require("./data/conferences") as ConferenceData;

// The data module is generated output (scripts/refresh-data.js writes data/conferences.js),
// so it is not converted to TypeScript; its shape is declared here instead.
interface Conference {
  id: string;
  name: string;
  year: number | string;
  fullName?: string;
  fit?: string;
  format?: string;
  link: string;
  deadline?: string | null;
  abstractDeadline?: string | null;
  conferenceStart?: string | null;
  conferenceEnd?: string | null;
  location?: { city?: string; country?: string } | null;
  [key: string]: unknown;
}
interface ConferenceData {
  generated: string;
  conferences: Conference[];
  [key: string]: unknown;
}
interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  url?: string;
  date: string;
  dateEnd?: string | null;
  dtstamp: string;
}

const app = express();
const PORT = process.env.PORT || 3010;

app.get("/health", (req: Request, res: Response) => res.send("ok"));
app.get("/api/conferences", (req: Request, res: Response) => res.json(data));

app.get("/favicon.svg", (req: Request, res: Response) => {
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
app.get("/favicon.ico", (req: Request, res: Response) => res.redirect(302, "/favicon.svg"));

app.get("/cal.ics", (req: Request, res: Response) => {
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

app.get("*", (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(buildPage());
});

// ------ iCalendar export (RFC 5545) ------
function buildICS(onlyIds: Set<string> | null): string {
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const events: string[] = [];
  for (const c of data.conferences) {
    if (onlyIds && !onlyIds.has(c.id)) continue;
    if (c.deadline) {
      events.push(
        icsEvent({
          uid: `${c.id}-deadline@conference-tracker`,
          summary: `${c.name} ${c.year} — submission deadline`,
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
function icsEvent({ uid, summary, description, url, date, dateEnd, dtstamp }: IcsEvent): string {
  const fmt = (d: string): string => d.replace(/-/g, "");
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
function icsEscape(s: string): string {
  return String(s)
    .replace(/[\\;,]/g, (c) => "\\" + c)
    .replace(/\n/g, "\\n");
}

function buildPage(): string {
  // Field colours are a themed token scale (--field-*), so the page carries a reference, not the data file's hex.
  const fields = Object.fromEntries(Object.entries(data.fields as Record<string, { label: string }>).map(([key, f]) => [key, { ...f, color: `var(--field-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")})` }]));
  const dataJson = JSON.stringify({ ...data, fields });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI &amp; Design — Conference Tracker</title>
<meta name="description" content="AI and Engineering Design Conference Tracker — submission deadlines, locations, and requirements across HCI, engineering design, AI/ML, visualization, manufacturing, and cognitive science.">
<meta name="theme-color" content="#F4F3F9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C0B14" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap" rel="stylesheet">
<style>${getCSS()}</style>
</head>
<body>
<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false">
<symbol id="i-sun" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
  <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" /></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></symbol>
<symbol id="i-star-filled" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></symbol>
<symbol id="i-external-link" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
  <path d="M11 13l9 -9" />
  <path d="M15 4h5v5" /></symbol>
<symbol id="i-calendar-down" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" />
  <path d="M19 16v6" />
  <path d="M22 19l-3 3l-3 -3" />
  <path d="M16 3v4" />
  <path d="M8 3v4" />
  <path d="M4 11h16" /></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M12 5l0 14" />
  <path d="M5 12l14 0" /></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
  <path d="M21 21l-6 -6" /></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M18 6l-12 12" />
  <path d="M6 6l12 12" /></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M5 12l5 5l10 -10" /></symbol>
<symbol id="i-chevron-down" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M6 9l6 6l6 -6" /></symbol>
<symbol id="i-arrows-sort" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M3 9l4 -4l4 4m-4 -4v14" />
  <path d="M21 15l-4 4l-4 -4m4 4v-14" /></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227" /></symbol>
</svg>
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
          <h1 class="brand-title">AI &amp; Engineering Design Conference Tracker</h1>
        </div>
      </div>
      <div class="masthead-actions">
        <button class="theme-toggle" id="themeBtn" aria-label="Dark theme" aria-pressed="false" title="Toggle theme">
          <span class="theme-icon-light"><svg class="icon" aria-hidden="true"><use href="#i-sun"></use></svg></span>
          <span class="theme-icon-dark"><svg class="icon" aria-hidden="true"><use href="#i-moon"></use></svg></span>
        </button>
      </div>
    </div>
    <p class="masthead-lede">Submission deadlines, locations, and requirements for conferences and journals at the intersection of AI and engineering design — spanning HCI, design science, AI / ML, visualization, manufacturing, and cognitive science.</p>
    <div class="masthead-stats" id="stats" aria-live="polite"><span class="skeleton skeleton-text" aria-hidden="true"></span><span class="skeleton skeleton-text" aria-hidden="true"></span></div>
  </header>

  <nav class="viewbar" aria-label="View">
    <div class="viewbar-inner">
      <button class="view-tab active" data-view="timeline" aria-pressed="true">Timeline</button>
      <button class="view-tab" data-view="cards" aria-pressed="false">Cards</button>
      <button class="view-tab" data-view="table" aria-pressed="false">Table</button>
      <button class="view-tab" data-view="map" aria-pressed="false">Map</button>
      <span class="viewbar-spacer"></span>
      <a class="viewbar-action" href="/cal.ics" download="conferences.ics" title="Download all deadlines as iCal"><svg class="icon" aria-hidden="true"><use href="#i-calendar-down"></use></svg>.ics</a>
      <button class="viewbar-action" id="submitConfBtn" title="Suggest a missing conference"><svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg>Suggest</button>
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
        <button class="chip" data-tier="all" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>All</button>
        <button class="chip" data-tier="A*" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>A*</button>
        <button class="chip" data-tier="A" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>A</button>
        <button class="chip" data-tier="B" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>B</button>
        <button class="chip" data-tier="industry" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>Industry</button>
        <button class="chip" data-tier="journal" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>Journal</button>
      </div>
    </div>
    <div class="filter-group">
      <label class="filter-label" for="sortSelect">Sort</label>
      <div class="select-wrap">
        <select class="select" id="sortSelect">
          <option value="deadline-asc">Deadline, soonest first</option>
          <option value="deadline-desc">Deadline, latest first</option>
          <option value="conference-asc">Conference date, soonest first</option>
          <option value="name-asc">Name, A to Z</option>
          <option value="tier-asc">Tier, A* first</option>
        </select>
        <svg class="icon select-icon" aria-hidden="true"><use href="#i-chevron-down"></use></svg>
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Window</span>
      <div class="chip-row" id="windowChips">
        <button class="chip" data-window="30" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>30d</button>
        <button class="chip" data-window="90" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>90d</button>
        <button class="chip" data-window="180" aria-pressed="false"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>180d</button>
        <button class="chip active" data-window="all" aria-pressed="true"><svg class="icon chip-check" aria-hidden="true"><use href="#i-check"></use></svg>All</button>
      </div>
    </div>
    </div>
    <div class="filters-search">
    <div class="filter-group filter-group-search">
      <div class="search-field" id="searchField">
        <svg class="icon search-icon" aria-hidden="true"><use href="#i-search"></use></svg>
        <input type="search" id="searchInput" placeholder="Search conferences…" autocomplete="off" aria-label="Search conferences">
        <button type="button" class="search-clear" id="searchClear" aria-label="Clear search" hidden><svg class="icon" aria-hidden="true"><use href="#i-x"></use></svg></button>
      </div>
      <label class="starred-toggle">
        <input type="checkbox" id="starredOnly">
        <span class="starred-label"><svg class="icon icon-off" aria-hidden="true"><use href="#i-star"></use></svg><svg class="icon icon-on icon-fill" aria-hidden="true"><use href="#i-star-filled"></use></svg> Starred only</span>
      </label>
    </div>
    </div>
  </section>

  <main id="main">
    <section id="view-timeline" class="view" aria-busy="true"><div class="skeleton-region" aria-hidden="true"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></section>
    <section id="view-cards" class="view hidden" aria-busy="true"><div class="skeleton-region" aria-hidden="true"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></section>
    <section id="view-table" class="view hidden" aria-busy="true"><div class="skeleton-region" aria-hidden="true"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></section>
    <section id="view-map" class="view hidden" aria-busy="true"><div class="skeleton-region" aria-hidden="true"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></section>
  </main>

  <div id="detailModal" class="modal hidden" aria-hidden="true" aria-modal="true" role="dialog" aria-labelledby="modalTitle">
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel" role="document">
      <button class="modal-close" data-close aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-x"></use></svg></button>
      <div id="modalBody"></div>
    </div>
  </div>

  <div id="suggestModal" class="modal hidden" aria-hidden="true" aria-modal="true" role="dialog" aria-labelledby="suggestTitle">
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel" role="document">
      <button class="modal-close" data-close aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-x"></use></svg></button>
      <h2 class="modal-name" id="suggestTitle">Suggest a venue</h2>
      <p class="modal-fullname">Name a conference or journal the tracker is missing. This opens a prefilled issue on GitHub.</p>
      <form id="suggestForm" class="suggest-form" novalidate>
        <div class="field">
          <label for="sg-name">Venue name</label>
          <input class="input" id="sg-name" name="name" type="text" autocomplete="off" aria-describedby="sg-name-msg" required>
          <p class="field-msg" id="sg-name-msg" role="alert"></p>
        </div>
        <div class="field">
          <label for="sg-link">Call for papers link</label>
          <input class="input" id="sg-link" name="link" type="url" inputmode="url" autocomplete="off" placeholder="https://" aria-describedby="sg-link-msg" required>
          <p class="field-msg" id="sg-link-msg" role="alert"></p>
        </div>
        <div class="field">
          <label for="sg-deadline">Paper deadline, if known</label>
          <input class="input" id="sg-deadline" name="deadline" type="date">
        </div>
        <div class="field">
          <label for="sg-why">Why it fits</label>
          <textarea class="notes-area" id="sg-why" name="why" rows="3"></textarea>
        </div>
        <p class="form-status" id="suggestStatus" role="status"></p>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary" id="suggestSubmit">Open draft on GitHub</button>
          <button type="button" class="btn" data-close>Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <footer class="colophon">
    <span class="colophon-bit">Onest</span>
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

// Stint colour tokens (DESIGN.md § Colour). Each theme is written once and applied by the blocks in
// getCSS(): dark is the :root default, light redefines the same names, and [data-theme] restates either
// so an explicit choice beats the media query. No component carries a per-theme override.
const DARK_TOKENS = `  color-scheme: dark;
  --ground: #0C0B14;
  --surface-1: #15131F;
  --surface-2: #1E1C2C;
  --surface-3: #2B2940;
  --line: #3A3756;
  --line-strong: #75729A;
  --text-1: #F1F0F8;
  --text-2: #B6B3CA;
  --text-3: #918EAA;
  --accent: #9A90F2;
  --accent-solid: #6456E0;
  --on-accent: #FFFFFF;
  --status-urgent: #FF8370;
  --status-soon: #E5B454;
  --status-ok: #62CB93;
  --status-info: #6FB6E8;
  --scrim: rgb(6 5 12 / 0.64);
  --elev-2: 0 8px 24px rgb(0 0 0 / 0.32);
  --elev-3: 0 24px 64px rgb(0 0 0 / 0.48);
  --field-hci: #B994E4;
  --field-ai-for-design: #E59EE0;
  --field-ml: #E287AE;
  --field-nlp: #FE9A9F;
  --field-cv: #E78D6B;
  --field-engineering-design: #F0AA63;
  --field-visualization: #C6A344;
  --field-manufacturing: #BBC364;
  --field-cognitive-science: #83B96D;
  --field-robotics: #6CD2A1;
  --field-graphics: #2CC0B1;
  --field-knowledge-information: #42CFE4;
  --field-affective: #4CB4E7;
  --field-health: #8EBDFE;`;

const LIGHT_TOKENS = `  color-scheme: light;
  --ground: #F4F3F9;
  --surface-1: #FCFBFF;
  --surface-2: #E9E7F2;
  --surface-3: #DAD7E8;
  --line: #B4B0CC;
  --line-strong: #7C7899;
  --text-1: #12101C;
  --text-2: #4A4761;
  --text-3: #625E7C;
  --accent: #4B3CC0;
  --accent-solid: #6456E0;
  --on-accent: #FFFFFF;
  --status-urgent: #B3261E;
  --status-soon: #7A5200;
  --status-ok: #1E6B45;
  --status-info: #1F5F8F;
  --scrim: rgb(18 16 28 / 0.40);
  --elev-2: 0 8px 24px rgb(18 16 28 / 0.12);
  --elev-3: 0 24px 64px rgb(18 16 28 / 0.20);
  --field-hci: #865EB1;
  --field-ai-for-design: #8A4487;
  --field-ml: #AC507B;
  --field-nlp: #A03E48;
  --field-cv: #B25632;
  --field-engineering-design: #8E5300;
  --field-visualization: #8F7002;
  --field-manufacturing: #646900;
  --field-cognitive-science: #4D8533;
  --field-robotics: #00764E;
  --field-graphics: #04877C;
  --field-knowledge-information: #01707D;
  --field-affective: #007FAD;
  --field-health: #2D62AC;`;

function getCSS(): string {
  return `
:root {
${DARK_TOKENS}
  --sans: "Onest", system-ui, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --measure: 65ch;
  --elev-1: inset 0 0 0 1px var(--line);
  --elev-1-strong: inset 0 0 0 1px var(--line-strong);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --radius-1: 4px;
  --radius-2: 6px;
  --radius-3: 8px;
  --radius-4: 12px;
  --radius-dot: 50%;
  --z-sticky: 10;
  --z-popover: 100;
  --z-modal: 1000;
  --dur-in: 120ms;
  --dur-move: 160ms;
  --dur-out: 240ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.3, 0, 0.7, 1);
  /* Type scale: three sizes. Small for labels and metadata, base for body and names, display for the page and modal titles. */
  --fs-sm: 0.8rem;
  --fs-base: 1rem;
  --fs-display: clamp(2rem, 1.6rem + 1.1vw, 2.441rem);
}
/* First paint: the theme script sets data-theme only after it runs, so a light-preference visitor
   would see one dark frame. :root:not([data-theme]) applies light until the script lands. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
${LIGHT_TOKENS}
  }
}
:root[data-theme="light"] {
${LIGHT_TOKENS}
}
:root[data-theme="dark"] {
${DARK_TOKENS}
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-in: 0ms; --dur-move: 0ms; --dur-out: 0ms; }
}
* { box-sizing: border-box; }
html {
  font-family: var(--sans);
  font-size: var(--fs-base);
  font-optical-sizing: auto;
  font-feature-settings: "kern" 1, "liga" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.5;
}
body { margin: 0; background: var(--ground); color: var(--text-1); min-height: 100dvh; }
button, input, textarea, select { font: inherit; }
p, .masthead-lede, .card-fullname, .card-fit, .modal-fullname {
  max-width: var(--measure);
  text-wrap: pretty;
  font-variant-numeric: tabular-nums;
}
h1, h2, h3, .brand-title, .card-name, .modal-name { text-wrap: balance; }
code {
  font-variant-numeric: tabular-nums;
  font-size: 1em;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-1);
  background: var(--surface-2);
  box-shadow: var(--elev-1);
}
::selection { background: color-mix(in oklab, var(--accent) 16%, var(--surface-1)); color: var(--text-1); }
:where(a, button, input, label, select, textarea, [tabindex]):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

/* ------ Masthead ------ */
.masthead { max-width: 78rem; margin: 0 auto; padding: clamp(var(--space-6), 4vw, var(--space-7)) var(--space-6) var(--space-5); }
.masthead-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); }
.brand { display: flex; align-items: flex-start; gap: var(--space-3); min-width: 0; }
.brand-mark {
  margin-top: var(--space-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  flex-shrink: 0;
  color: var(--accent);
  background: var(--surface-1);
  box-shadow: var(--elev-1);
  border-radius: var(--radius-2);
}
.brand-mark svg { display: block; }
.brand-titles { min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
/* .brand-eyebrow removed — redundant above h1 and was an AI-ism (mono eyebrow) */
.brand-title { font-size: var(--fs-display); font-weight: 600; letter-spacing: -0.02em; margin: 0; line-height: 1.1; max-width: 24ch; }
.masthead-lede { color: var(--text-2); font-size: var(--fs-base); margin: 0 0 var(--space-4); line-height: 1.66; }
.masthead-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.stat { display: inline-flex; align-items: baseline; gap: var(--space-2); min-height: 1.5rem; }
.stat strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--text-1);
  font-size: var(--fs-base);
  text-transform: none;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat .stat-accent { color: var(--accent); }
.stat .stat-urgent { color: var(--status-urgent); }

.theme-toggle {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--surface-1);
  border: 0;
  border-radius: var(--radius-2);
  box-shadow: var(--elev-1-strong);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  font-size: var(--fs-base);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out);
}
.theme-toggle:active { background: var(--surface-3); }
.theme-toggle:hover {
  color: var(--text-1);
  background: var(--surface-2);
  box-shadow: var(--elev-1-strong);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
.sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
.icon { display: block; flex-shrink: 0; width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.icon-fill { fill: currentColor; stroke: none; }
.icon-on { display: none; }
.starred .icon-on, .starred-toggle input:checked + .starred-label .icon-on { display: block; }
.starred .icon-off, .starred-toggle input:checked + .starred-label .icon-off { display: none; }
.starred-label { display: inline-flex; align-items: center; gap: var(--space-2); }
.theme-icon-dark { display: none; }
[data-theme="dark"] .theme-icon-light { display: none; }
[data-theme="dark"] .theme-icon-dark { display: inline-flex; }
.theme-icon-light { display: inline-flex; }

/* ------ View tabs ------ */
.viewbar { max-width: 78rem; margin: 0 auto; padding: 0 var(--space-6); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.viewbar-inner { display: flex; gap: var(--space-5); overflow-x: auto; -webkit-overflow-scrolling: touch; padding: var(--space-1); margin: calc(-1 * var(--space-1)); }
.viewbar-inner::-webkit-scrollbar { display: none; }
.view-tab {
  flex: 0 0 auto;
  background: transparent;
  border: 0;
  padding: var(--space-4) 0 var(--space-3);
  cursor: pointer;
  font-family: var(--sans);
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-2);
  opacity: 1;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out),
    opacity var(--dur-out) var(--ease-out);
}
.view-tab:hover { color: var(--text-1); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.view-tab:active { background: var(--surface-2); }
.view-tab.active { color: var(--text-1); font-weight: 600; border-bottom-color: var(--accent); }

.viewbar-spacer { flex: 1 1 auto; min-width: 0.5rem; }
.viewbar-action {
  flex: 0 0 auto;
  align-self: center;
  margin: var(--space-2) 0;
  padding: var(--space-1) var(--space-3);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-2);
  text-decoration: none;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-2);
  cursor: pointer;
  transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out);
}
.viewbar-action { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 500; }
.viewbar-action:hover:not(:disabled) { color: var(--text-1); border-color: var(--text-2); transition-duration: var(--dur-in); }
.viewbar-action:active:not(:disabled) { background: var(--surface-3); }
:disabled { opacity: 0.5; cursor: not-allowed; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 2.75rem; min-width: 2.75rem; padding: var(--space-2) var(--space-4);
  font-family: var(--sans); font-size: var(--fs-sm); font-weight: 500; line-height: 1.3;
  color: var(--text-1); background: transparent; border: 0; box-shadow: var(--elev-1-strong);
  border-radius: var(--radius-2); cursor: pointer; text-decoration: none;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.btn:hover:not(:disabled) { background: var(--surface-3); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.btn:active:not(:disabled) { background: var(--surface-2); }
.btn-primary { background: var(--accent-solid); color: var(--on-accent); box-shadow: none; }
.btn-primary:hover:not(:disabled) { background: color-mix(in oklab, var(--accent-solid) 92%, var(--text-1)); }
.btn-primary:active:not(:disabled) { background: color-mix(in oklab, var(--accent-solid) 84%, var(--text-1)); }

/* ------ Select (sort + status) ------ */
.select {
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-1);
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-2);
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-3);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.select:hover:not(:disabled) { border-color: var(--text-2); transition-duration: var(--dur-in); }
.select-wrap { position: relative; display: inline-flex; align-items: center; justify-self: start; }
.select-wrap .select { padding-right: var(--space-6); }
.select-icon { position: absolute; right: var(--space-2); width: 1rem; height: 1rem; color: var(--text-2); pointer-events: none; }

/* ------ Status pill (per-conf state) ------ */
.status-pill {
  display: inline-flex; align-items: center;
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-1);
  background: var(--surface-2);
  color: var(--text-2);
  font-weight: 500;
  margin-left: var(--space-1);
}
.status-pill.status-interested { background: color-mix(in oklab, var(--status-info) 16%, var(--surface-1)); color: var(--status-info); }
.status-pill.status-drafting   { background: color-mix(in oklab, var(--status-soon) 16%, var(--surface-1));   color: var(--status-soon); }
.status-pill.status-submitted  { background: color-mix(in oklab, var(--status-info) 16%, var(--surface-1)); color: var(--status-info); }
.status-pill.status-accepted   { background: color-mix(in oklab, var(--status-ok) 16%, var(--surface-1)); color: var(--status-ok); }
.status-pill.status-rejected   { background: color-mix(in oklab, var(--status-urgent) 16%, var(--surface-1)); color: var(--status-urgent); }

.note-mark {
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  color: var(--text-3);
  margin-left: var(--space-1);
  cursor: default;
}

/* ------ Colophon link ------ */
.colophon-link { display: inline-flex; align-items: center; min-height: 2.75rem;
  color: var(--text-2);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color var(--dur-out) var(--ease-out), border-color var(--dur-out) var(--ease-out);
}
.colophon-link:hover { color: var(--text-1); border-color: var(--text-2); transition-duration: var(--dur-in); }

/* ------ Map view ------ */
.map-wrap { position: relative; }
.map-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  padding: var(--space-2) 0 var(--space-4);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--space-4);
}
.map-meta strong {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--text-1);
  font-size: var(--fs-base);
  margin-right: var(--space-2);
  font-variant-numeric: tabular-nums;
}
.map-meta .map-hint { color: var(--text-3); text-transform: none; }
.map-svg-wrap { position: relative; }
.map-svg { display: block; max-width: 100%; height: auto; }
.map-marker { cursor: pointer; }
.map-marker:hover { transition-duration: var(--dur-in); }
.map-marker:hover circle:nth-child(1), .map-marker:focus-visible circle:nth-child(1) { fill-opacity: 0.20; }
.map-marker.selected circle:nth-child(2) { stroke: var(--text-1); stroke-width: 2.5; }
.map-tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--surface-2);
  color: var(--text-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-2);
  font-size: var(--fs-sm);
  line-height: 1.35;
  box-shadow: var(--elev-2);
  transform: translate(-50%, calc(-100% - var(--space-2)));
  opacity: 0;
  transition: opacity var(--dur-in) var(--ease-out);
  white-space: nowrap;
  font-family: var(--sans);
}
.map-tooltip.visible { opacity: 1; }

/* ------ Modal tracking (status + notes) ------ */
.modal-tracking { display: flex; flex-direction: column; gap: var(--space-3); }
.tracking-row {
  display: flex; align-items: center; gap: var(--space-3);
  font-size: var(--fs-sm);
}
.tracking-row-stack { flex-direction: column; align-items: stretch; gap: var(--space-2); }
.tracking-label {
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-3);
  width: 5.5rem;
  flex-shrink: 0;
}
.tracking-row-stack .tracking-label { width: auto; }
.notes-area {
  width: 100%;
  font-family: var(--sans);
  font-size: var(--fs-sm);
  line-height: 1.5;
  color: var(--text-1);
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-2);
  padding: var(--space-3) var(--space-3);
  resize: vertical;
  min-height: 5rem;
  transition: border-color var(--dur-out) var(--ease-out), background var(--dur-out) var(--ease-out);
}
.notes-area:focus-visible { border-color: var(--accent); background: var(--surface-1); }
.notes-area::placeholder { color: var(--text-3); }

.modal-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.modal-link-btn-secondary {
  background: transparent;
  color: var(--text-1);
  border: 1px solid var(--line-strong);
}
.modal-link-btn-secondary:hover { background: var(--surface-2); color: var(--text-1); border-color: var(--text-2); }

/* ------ Filters ------ */
.filters { max-width: 78rem; margin: 0 auto; padding: var(--space-4) var(--space-6) var(--space-5); display: flex; gap: var(--space-4) var(--space-6); justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--line); }
.filters-main { display: flex; flex: 1 1 42rem; flex-wrap: wrap; gap: var(--space-4) var(--space-5); min-width: 0; }
.filters-search { display: flex; justify-content: flex-end; flex: 0 1 24rem; min-width: min(100%, 20rem); }
.filter-group { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: var(--space-1) var(--space-3); min-width: min(100%, 13rem); }
.filter-group-search { display: flex; justify-content: flex-end; align-items: center; gap: var(--space-3); flex-wrap: wrap; width: 100%; min-width: 0; }
.filter-label {
  padding-top: var(--space-2);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-3);
  white-space: nowrap;
}
.chip-row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.chip {
  background: var(--surface-1); border: 0;
  box-shadow: var(--elev-1-strong);
  padding: var(--space-2) var(--space-3) var(--space-2); border-radius: var(--radius-2);
  font-family: var(--sans); font-size: var(--fs-sm); cursor: pointer; color: var(--text-2);
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out);
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-feature-settings: "kern" 1, "liga" 1;
}
.chip:hover:not(:disabled) { color: var(--text-1); background: var(--surface-2); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.chip:active:not(:disabled):not(.active) { background: var(--surface-3); }
.chip.active { background: var(--accent-solid); color: var(--on-accent); font-weight: 600; box-shadow: none; }
.chip-check { display: none; width: 1rem; height: 1rem; }
.chip.active .chip-check { display: block; }
.chip-dot { width: 0.48rem; height: 0.48rem; border-radius: var(--radius-dot); flex-shrink: 0; background: var(--field-color, var(--text-2)); }
.search-field { position: relative; flex: 0 1 19rem; width: min(19rem, 100%); }
.search-icon { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
#searchInput {
  display: block; width: 100%;
  background: var(--surface-1); border: 0; border-radius: var(--radius-2);
  box-shadow: var(--elev-1-strong);
  padding: var(--space-2) calc(var(--space-6) + var(--space-3)); font: inherit; font-size: var(--fs-sm); color: var(--text-1);
  transition: box-shadow var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
#searchInput::-webkit-search-cancel-button, #searchInput::-webkit-search-decoration { -webkit-appearance: none; appearance: none; display: none; }
#searchInput::placeholder { color: var(--text-3); }
#searchInput:hover { background: var(--surface-2); }
.search-field.no-results #searchInput { box-shadow: inset 0 0 0 1px var(--status-urgent); }
.search-clear {
  position: absolute; right: 0; top: 0; width: 2.75rem; height: 2.75rem;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 0; border-radius: var(--radius-2); color: var(--text-2); cursor: pointer;
  transition: color var(--dur-out) var(--ease-out), background-color var(--dur-out) var(--ease-out);
}
.search-clear[hidden] { display: none; }
.search-clear:hover { color: var(--text-1); background: var(--surface-3); transition-duration: var(--dur-in); }
.starred-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-2);
  background: var(--surface-1);
  box-shadow: var(--elev-1-strong);
  border-radius: var(--radius-2);
  cursor: pointer;
  user-select: none;
}
.starred-toggle input { margin: 0; accent-color: var(--accent-solid); }
.starred-toggle:hover:not(:has(input:disabled)) { color: var(--text-1); background: var(--surface-2); }
.starred-toggle:has(input:checked) { color: var(--text-1); font-weight: 600; background: var(--surface-3); }
.starred-toggle:has(input:disabled) { opacity: 0.5; cursor: not-allowed; }
.starred-toggle input:disabled { cursor: not-allowed; }

/* ------ Main ------ */
main { max-width: 78rem; margin: 0 auto; padding: var(--space-5) var(--space-6) var(--space-8); }
.view.hidden { display: none; }

/* ------ Per-view sub-toolbar (mode toggles, density, etc.) ------ */
.view-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  flex-wrap: wrap;
  padding: 0 0 var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--line);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  color: var(--text-3);
}
.view-toolbar-label { color: var(--text-3); margin-right: var(--space-1); }
.view-toolbar-group { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1); background: var(--surface-2); border-radius: var(--radius-1); box-shadow: var(--elev-1); }
.view-toolbar-btn {
  background: transparent;
  border: 0;
  padding: var(--space-1) var(--space-3) var(--space-1);
  border-radius: var(--radius-2);
  font: inherit;
  color: var(--text-2);
  text-transform: inherit;
  cursor: pointer;
  transition: background-color var(--dur-out) var(--ease-out), color var(--dur-out) var(--ease-out);
}
.view-toolbar-btn:hover:not(:disabled):not(.active) { color: var(--text-1); background: var(--surface-1); transition-duration: var(--dur-in); }
.view-toolbar-btn.active { background: var(--surface-3); color: var(--text-1); font-weight: 600; box-shadow: var(--elev-1-strong); }
.view-toolbar-spacer { flex: 1 1 auto; }
.view-toolbar-hint { color: var(--text-3); text-transform: none; font-family: var(--sans); font-size: var(--fs-sm); }

/* ------ Timeline ------ */
.timeline-wrap { position: relative; }
.timeline-scroll { overflow-x: auto; overflow-y: visible; padding-bottom: var(--space-1); }
.timeline-scroll::-webkit-scrollbar { height: 8px; }
.timeline-scroll::-webkit-scrollbar-track { background: transparent; }
.timeline-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: var(--radius-1); }
.timeline-svg { display: block; }
.timeline-svg text { font-kerning: normal; text-rendering: geometricPrecision; }
.timeline-svg text[text-anchor="end"] {
  font-size: var(--fs-sm);
  font-weight: 600;
  fill: var(--text-1);
}
.timeline-svg text[text-anchor="end"] tspan {
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  font-weight: 400;
  fill: var(--text-3);
}
.timeline-row-hover { fill: color-mix(in oklab, var(--accent) 16%, var(--surface-1)); cursor: pointer; }
.timeline-deadline-marker {
  cursor: pointer;
  transition: r var(--dur-out) var(--ease-out);
}
.timeline-deadline-marker:hover { r: 7; transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.timeline-tooltip {
  position: absolute; pointer-events: none;
  background: var(--surface-1); color: var(--text-1);
  border: 1px solid var(--line);
  padding: var(--space-2) var(--space-3) var(--space-3); border-radius: var(--radius-3); font-size: var(--fs-sm); line-height: 1.45;
  box-shadow: var(--elev-2);
  max-width: 22rem; transform: translate(-50%, calc(-100% - var(--space-3)));
  white-space: normal; opacity: 0; transition: opacity var(--dur-out) var(--ease-out);
  font-family: var(--sans);
}
.timeline-tooltip.visible { opacity: 1; }
.timeline-tooltip strong { color: var(--text-1); font-weight: 600; }
.timeline-tooltip .tt-date { font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-2); margin-top: var(--space-1); display: block; }

.timeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-1) 0 var(--space-4);
  font-size: var(--fs-sm);
  color: var(--text-2);
  font-family: var(--sans);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--space-4);
}
.legend-item { display: inline-flex; align-items: center; gap: var(--space-2); white-space: nowrap; }
.legend-mark { display: inline-block; flex-shrink: 0; }
.legend-mark.deadline { width: 0.6rem; height: 0.6rem; border-radius: var(--radius-dot); background: var(--text-1); }
.legend-mark.notification { width: 0.45rem; height: 0.45rem; border-radius: var(--radius-dot); background: var(--text-3); }
.legend-mark.conference { width: 0.9rem; height: 0.4rem; border-radius: var(--radius-1); background: color-mix(in oklab, var(--accent) 16%, var(--surface-1)); border: 1px solid var(--accent); }
.legend-mark.cal-deadline {
  width: 0.9rem; height: 0.72rem; border-radius: var(--radius-1); overflow: hidden;
  background: linear-gradient(to bottom, var(--field-hci) 0%, var(--field-hci) 34%, var(--field-engineering-design) 34%, var(--field-engineering-design) 67%, var(--field-ml) 67%, var(--field-ml) 100%);
}
.legend-mark.today-mark {
  width: 0.9rem; height: 0.72rem; border-radius: var(--radius-1); position: relative;
  background: color-mix(in oklab, var(--accent) 24%, var(--surface-1));
}
.legend-mark.today-mark::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  border: 2px solid var(--accent);
}
.legend-mark.today-line { width: 0.9rem; height: 0; border-top: 2px dashed var(--accent); }
.legend-mark.estimated { width: 0.6rem; height: 0.6rem; border-radius: var(--radius-dot); background: transparent; border: 1.5px solid var(--text-2); }

/* ------ Timeline calendar mode (month-grid heatmap) ------ */
.tlcal {
  display: grid;
  grid-template-columns: minmax(5rem, max-content) 1fr;
  gap: var(--space-1) var(--space-3);
  align-items: center;
  font-variant-numeric: tabular-nums;
  font-family: var(--sans);
}
.tlcal-month {
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  color: var(--text-3);
  text-align: right;
  padding-right: var(--space-1);
  font-weight: 500;
}
.tlcal-month.current { color: var(--accent); font-weight: 600; }
.tlcal-month.boundary { color: var(--text-2); }
.tlcal-row {
  display: grid;
  grid-template-columns: repeat(31, 1fr);
  gap: 2px;
  height: 1.55rem;
  align-items: stretch;
}
.tlcal-cell {
  position: relative;
  background: var(--surface-3);
  border-radius: var(--radius-1);
  cursor: default;
  transition: background-color var(--dur-out) var(--ease-out);
}
.tlcal-cell.empty { background: transparent; box-shadow: var(--elev-1); }
.tlcal-cell.weekend { background: var(--surface-2); }
.tlcal-cell.today {
  background: color-mix(in oklab, var(--accent) 24%, var(--surface-1));
}
.tlcal-cell.today::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  border: 2px solid var(--accent);
}
.tlcal-cell.has-deadline { cursor: pointer; }
.tlcal-cell.passed .tlcal-stack { opacity: 0.5; }
.tlcal-cell.has-deadline:focus-visible { z-index: 1; }
.tlcal-cell.has-deadline:hover { outline: 2px solid var(--text-1); outline-offset: -2px; transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.tlcal-cell .tlcal-stack {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  border-radius: inherit; overflow: hidden;
}
.tlcal-cell .tlcal-stack > i { display: block; flex: 1 1 0; }
.tlcal-cell .tlcal-count {
  position: absolute; bottom: var(--space-1); right: var(--space-1);
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-1); font-weight: 600;
  background: var(--surface-1); border-radius: var(--radius-1); padding: 0 var(--space-1);
  line-height: 1.35;
}
.tlcal-axis {
  display: grid;
  grid-template-columns: repeat(31, 1fr);
  gap: 2px;
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  color: var(--text-3);
  text-align: center;
  padding-bottom: var(--space-1);
}
.tlcal-axis span { line-height: 1; }
.tlcal-empty-msg { grid-column: 2; color: var(--text-3); padding: var(--space-2) 0; font-family: var(--sans); font-size: var(--fs-sm); text-transform: none; }

/* ------ Cards: density modes ------ */
.cards-grid.density-spacious { grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr)); gap: var(--space-5); }
.cards-grid.density-spacious .card { padding: var(--space-5) var(--space-6) var(--space-6); gap: var(--space-3); }
.cards-grid.density-spacious .card-name { font-size: var(--fs-base); }
.cards-grid.density-spacious .card-fullname { font-size: var(--fs-base); max-width: 50ch; }
.cards-grid.density-spacious .card-meta { font-size: var(--fs-sm); gap: var(--space-2) var(--space-4); }
.cards-grid.density-spacious .card-fit { font-size: var(--fs-base); }
.cards-grid.density-compact { grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr)); gap: var(--space-4); }
.cards-grid.density-compact .card { padding: var(--space-4) var(--space-4) var(--space-4); gap: var(--space-2); }
.cards-grid.density-compact .card-name { font-size: var(--fs-base); }
.cards-grid.density-compact .card-fullname { font-size: var(--fs-sm); line-height: 1.42; }
.cards-grid.density-compact .card-meta { font-size: var(--fs-sm); gap: var(--space-1) var(--space-3); padding-top: var(--space-2); }
.cards-grid.density-compact .card-meta dt { font-size: var(--fs-sm); }
.cards-grid.density-compact .card-fit { font-size: var(--fs-sm); padding-top: var(--space-2); }
.cards-grid.density-compact .card-tag { font-size: var(--fs-sm); padding: var(--space-1) var(--space-2); }
.cards-grid.density-compact .card-actions { padding-top: var(--space-2); gap: var(--space-2); }

/* ------ Map continents overlay ------ */
.map-continent {
  fill: var(--surface-2);
  stroke: var(--line);
  stroke-width: 0.7;
  stroke-linejoin: round;
  pointer-events: none;
}

/* ------ Cards ------ */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20.5rem, 1fr)); gap: var(--space-5); align-items: start; }
.card {
  background: var(--surface-1); border: 0; border-radius: var(--radius-3);
  padding: var(--space-5) var(--space-5) var(--space-5);
  box-shadow: var(--elev-1);
  transition:
    box-shadow var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out);
  cursor: pointer; display: flex; flex-direction: column; gap: var(--space-3); position: relative; min-height: 100%;
}
.card:hover {
  background: var(--surface-2);
  box-shadow: var(--elev-1-strong);
  transition-duration: var(--dur-in);
  transition-timing-function: var(--ease-in);
}
.card.starred { box-shadow: inset 0 0 0 1px var(--accent); }
.card.closed .card-name { color: var(--text-2); }
.card:focus-visible { background: var(--surface-2); }
.card-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); }
.card-name { font-size: var(--fs-base); font-weight: 600; letter-spacing: -0.02em; margin: 0; line-height: 1.15; font-feature-settings: "kern" 1, "liga" 1; }
.year { display: inline-block; font-variant-numeric: tabular-nums; font-size: var(--fs-sm); font-weight: 400; color: var(--text-3); margin-left: var(--space-2); }
.modal-name .year { font-size: var(--fs-base); }
.card-tier {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm); padding: var(--space-1) var(--space-2) var(--space-1);
  border-radius: var(--radius-1); background: var(--surface-2); color: var(--text-2);
  flex-shrink: 0; font-weight: 600; line-height: 1.35;
}
.card-fullname { color: var(--text-2); font-size: var(--fs-sm); line-height: 1.55; margin: 0; max-width: 38ch; text-wrap: pretty; }
.card-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.card-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm); padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-1); color: var(--text-1); font-weight: 500;
  line-height: 1.4;
  background: var(--surface-2);
}
.card-tag::before { content: ""; width: var(--space-2); height: var(--space-2); border-radius: var(--radius-dot); flex-shrink: 0; background: var(--tag-bg, var(--text-2)); }
.card-meta {
  display: grid; grid-template-columns: minmax(4.6rem, max-content) 1fr;
  gap: var(--space-2) var(--space-4); font-size: var(--fs-sm);
  padding-top: var(--space-3); border-top: 1px solid var(--line);
}
.card-meta dt {
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm);
  color: var(--text-3); padding-top: var(--space-1);
}
.card-meta dd { margin: 0; color: var(--text-1); font-variant-numeric: tabular-nums; line-height: 1.45; }
.card-countdown {
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm); padding: var(--space-1) var(--space-2) var(--space-1);
  border-radius: var(--radius-2); background: var(--surface-2); color: var(--text-2);
  display: inline-flex; gap: var(--space-1); align-items: center; margin-left: var(--space-2);
  font-variant-numeric: tabular-nums;
  box-shadow: var(--elev-1);
}
.card-countdown.urgent { background: color-mix(in oklab, var(--status-urgent) 16%, var(--surface-1)); color: var(--status-urgent); }
.card-countdown.soon { background: color-mix(in oklab, var(--status-soon) 16%, var(--surface-1)); color: var(--status-soon); }
.card-countdown.passed { background: var(--surface-2); color: var(--text-3); }
.card-countdown.urgent { font-weight: 600; }
.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.card-fit {
  color: var(--text-2); font-size: var(--fs-sm);
  line-height: 1.58; padding-top: var(--space-3);
  border-top: 1px solid var(--line); text-wrap: pretty; max-width: 42ch;
}
.card-actions { display: flex; gap: var(--space-3); align-items: center; padding-top: var(--space-2); margin-top: auto; }
.card-link {
  font-size: var(--fs-sm); color: var(--text-2); text-decoration: none;
  padding: var(--space-1) 0; border-bottom: 1px solid transparent;
  transition:
    color var(--dur-out) var(--ease-out),
    border-color var(--dur-out) var(--ease-out);
  font-variant-numeric: tabular-nums;
}
.card-link:hover { color: var(--accent); border-color: var(--accent); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.star-btn {
  background: transparent; border: 0; cursor: pointer;
  border-radius: var(--radius-2);
  color: var(--text-3); padding: var(--space-1); line-height: 1;
  transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out);
}
.star-btn:hover:not(:disabled) { color: var(--accent); background: var(--surface-2); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.star-btn:active:not(:disabled) { background: var(--surface-3); }
.star-btn.starred { color: var(--accent); }
.card-actions .star-btn:last-child { margin-left: auto; }
.confidence-mark {
  font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-3);
  margin-left: auto;
}

/* ------ Table ------ */
.table-wrap { overflow-x: auto; padding: var(--space-1) 0 var(--space-1); }
table.confs { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--fs-sm); font-feature-settings: "kern" 1, "liga" 1; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
table.confs th, table.confs td { padding: var(--space-3) var(--space-4); text-align: left; border-bottom: 1px solid var(--line); }
table.confs tbody tr:last-child td { border-bottom: 0; }
table.confs thead th { background: var(--ground); font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-3); cursor: pointer; user-select: none; white-space: nowrap; font-weight: 500; transition: color var(--dur-out) var(--ease-out); }
.th-btn {
  display: inline-flex; align-items: center; gap: var(--space-1); min-height: 2.75rem; min-width: 2.75rem;
  padding: 0; margin: 0; background: transparent; border: 0; border-radius: var(--radius-2);
  font: inherit; color: inherit; cursor: pointer;
}
.th-btn .icon { width: 1rem; height: 1rem; }
.th-btn[data-dir="asc"] .icon { transform: rotate(180deg); }
table.confs thead th:hover { color: var(--text-1); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
table.confs tbody tr { transition: background-color var(--dur-out) var(--ease-out); }
table.confs tbody tr:hover, table.confs tbody tr:focus-visible { background: var(--surface-2); cursor: pointer; }
table.confs tbody tr.starred td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
table.confs tbody tr.closed td { color: var(--text-3); }
table.confs tbody tr.closed td strong { color: var(--text-2); }
table.confs td .link-icon { color: var(--accent); }
table.confs thead th[aria-sort] { color: var(--text-1); font-weight: 600; }
table.confs td.num { font-variant-numeric: tabular-nums; font-variant-numeric: tabular-nums; white-space: nowrap; }
.table-wrap .card-tag { margin: 0 var(--space-1) var(--space-1) 0; }

/* ------ Modal ------ */
.modal { position: fixed; inset: 0; z-index: var(--z-modal); display: flex; align-items: center; justify-content: center; padding: var(--space-5); }
.modal.hidden { display: none; }
.modal-backdrop { position: absolute; inset: 0; background: var(--scrim); opacity: 0; transition: opacity var(--dur-in) var(--ease-in); }
.modal.open .modal-backdrop { opacity: 1; transition-duration: var(--dur-move); transition-timing-function: var(--ease-out); }
.modal-panel { opacity: 0; transform: translateY(var(--space-2)); transition: opacity var(--dur-in) var(--ease-in), transform var(--dur-in) var(--ease-in); }
.modal.open .modal-panel { opacity: 1; transform: none; transition-duration: var(--dur-move); transition-timing-function: var(--ease-out); }
@media (prefers-reduced-motion: reduce) { .modal-panel { transform: none; } }
.modal-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; }
.modal-lead { margin: 0; color: var(--text-2); line-height: 1.55; }
.saved { color: var(--status-ok); font-size: var(--fs-sm); font-weight: 500; min-height: 1.3em; }
.tracking-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.tracking-head h3 { margin: 0; }
.suggest-form { display: grid; gap: var(--space-4); margin-top: var(--space-4); }
.field { display: grid; gap: var(--space-1); }
.field label { font-size: var(--fs-sm); font-weight: 500; color: var(--text-2); }
.input {
  min-height: 2.75rem; width: 100%; padding: var(--space-2) var(--space-3);
  font: inherit; font-size: var(--fs-sm); color: var(--text-1);
  background: var(--surface-1); border: 0; border-radius: var(--radius-2); box-shadow: var(--elev-1-strong);
  transition: background-color var(--dur-out) var(--ease-out), box-shadow var(--dur-out) var(--ease-out);
}
.input:hover { background: var(--surface-3); }
.input::placeholder { color: var(--text-3); }
.field[data-invalid] .input { box-shadow: inset 0 0 0 1px var(--status-urgent); }
.field-msg { margin: 0; min-height: 1.3em; font-size: var(--fs-sm); color: var(--status-urgent); font-weight: 500; }
.form-status { margin: 0; min-height: 1.3em; font-size: var(--fs-sm); font-weight: 500; color: var(--text-2); display: flex; align-items: center; gap: var(--space-2); }
.form-status.sent { color: var(--status-ok); }
.form-status.error { color: var(--status-urgent); }

/* ------ Region states: loading, empty, error ------ */
.skeleton-region { display: grid; gap: var(--space-3); }
.skeleton-row { position: relative; height: 4.5rem; background: var(--surface-1); box-shadow: var(--elev-1); border-radius: var(--radius-3); }
.skeleton-row::before, .skeleton-row::after { content: ""; position: absolute; left: var(--space-4); background: var(--surface-2); border-radius: var(--radius-1); }
.skeleton-row::before { top: var(--space-4); width: 40%; height: 1rem; }
.skeleton-row::after { top: var(--space-6); margin-top: var(--space-3); width: 70%; height: 0.8rem; }
.skeleton-text { display: inline-block; width: 8rem; height: 1rem; background: var(--surface-2); border-radius: var(--radius-1); }
.region-state { display: grid; justify-items: start; gap: var(--space-3); max-width: var(--measure); padding: var(--space-5); background: var(--surface-1); box-shadow: var(--elev-1); border-radius: var(--radius-3); }
.region-state h3 { margin: 0; font-size: var(--fs-base); font-weight: 600; }
.region-state p { margin: 0; color: var(--text-2); }
.region-error { box-shadow: inset 0 0 0 1px var(--status-urgent); }
.region-error h3 { color: var(--status-urgent); }
.modal-panel {
  position: relative; background: var(--surface-2); border: 0;
  border-radius: var(--radius-4); max-width: 38rem; width: min(38rem, 100%);
  max-height: min(86dvh, 44rem); overflow-y: auto; padding: var(--space-6) var(--space-6) var(--space-6);
  box-shadow: var(--elev-3);
}
#modalBody { display: grid; gap: var(--space-1); }
.modal-close {
  position: absolute; top: var(--space-3); right: var(--space-3); background: var(--surface-1); border: 0;
  box-shadow: var(--elev-1-strong);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-2); padding: 0;
  width: 2.75rem; height: 2.75rem; transition:
    color var(--dur-out) var(--ease-out),
    background-color var(--dur-out) var(--ease-out); border-radius: var(--radius-2);
}
.modal-close:hover { color: var(--text-1); background: var(--surface-2); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.modal-name { font-size: var(--fs-display); margin: 0; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.modal-fullname { color: var(--text-2); font-size: var(--fs-base); margin: 0 0 var(--space-1); line-height: 1.62; max-width: 50ch; text-wrap: pretty; }
.modal-section { margin: 0; padding-top: var(--space-4); border-top: 1px solid var(--line); }
.modal-section h3 { font-family: var(--sans); font-size: var(--fs-sm); color: var(--text-3); margin: 0 0 var(--space-3); font-weight: 500; }
.modal-meta { display: grid; grid-template-columns: minmax(5.6rem, max-content) 1fr; gap: var(--space-2) var(--space-4); font-size: var(--fs-sm); }
.modal-meta dt { font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-3); padding-top: var(--space-1); }
.modal-meta dd { margin: 0; font-variant-numeric: tabular-nums; line-height: 1.46; }
.modal-link-btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4) var(--space-2); background: var(--surface-2); color: var(--text-1); text-decoration: none;
  border-radius: var(--radius-2); font-size: var(--fs-sm); font-weight: 500;
  box-shadow: var(--elev-1-strong);
  transition:
    color var(--dur-out) var(--ease-out),
    box-shadow var(--dur-out) var(--ease-out);
  margin-top: var(--space-3);
  font-family: var(--sans);
}
.modal-link-btn:hover { color: var(--accent); background: var(--surface-3); transition-duration: var(--dur-in); transition-timing-function: var(--ease-in); }
.modal-link-btn:active { background: var(--surface-2); }

/* ------ Footer ------ */
.colophon { max-width: 78rem; margin: 0 auto; padding: var(--space-5) var(--space-6) var(--space-7); border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-3); align-items: center; font-variant-numeric: tabular-nums; font-size: var(--fs-sm); color: var(--text-3); }
.colophon-bit { white-space: nowrap; }
.colophon-sep { color: var(--line); }

/* ------ Touch targets: at least 44 by 44 CSS px, 8px between neighbours ------ */
.view-tab, .viewbar-action, .chip, .view-toolbar-btn, .star-btn, .select, #searchInput, .modal-close, .card-link, .starred-toggle, .modal-link-btn { min-height: 2.75rem; min-width: 2.75rem; }
.view-tab, .viewbar-action, .chip, .view-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; }
.view-tab { padding-top: 0; padding-bottom: 0; padding-left: var(--space-2); padding-right: var(--space-2); }
.viewbar-inner { gap: var(--space-2); }
.starred-toggle { display: inline-flex; align-items: center; gap: var(--space-2); }
.view-toolbar-group { gap: var(--space-2); }
.card-actions { gap: var(--space-2); }
.star-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.card-link { display: inline-flex; align-items: center; gap: var(--space-1); }
table.confs td a[href] { display: inline-flex; align-items: center; justify-content: center; min-width: 2.75rem; min-height: 2.75rem; }
strong { font-weight: 600; }

/* ------ Mobile ------ */
@media (max-width: 720px) {
  .masthead { padding: var(--space-6) var(--space-4) var(--space-4); }
  .brand-title { font-size: var(--fs-display); }
  .viewbar, .filters, main, .colophon { padding-left: var(--space-4); padding-right: var(--space-4); }
  .masthead-lede { font-size: var(--fs-base); margin-bottom: var(--space-4); }
  .masthead-stats { gap: var(--space-2) var(--space-4); }
  .viewbar-inner { gap: var(--space-2); flex-wrap: wrap; overflow-x: visible; }
  .viewbar-spacer { flex-basis: 100%; min-width: 0; height: 0; }
  .filters { padding-top: var(--space-4); gap: var(--space-4); flex-direction: column; align-items: stretch; }
  .filters-main { width: 100%; gap: var(--space-4); }
  .filters-search { width: 100%; min-width: 0; }
  .filter-group { grid-template-columns: 1fr; gap: var(--space-1); width: 100%; }
  .filter-label { padding-top: 0; }
  .filter-group-search { justify-content: flex-start; align-items: stretch; width: 100%; }
  .filter-group-search { flex-wrap: wrap; }
  .search-field { flex: 1 1 100%; min-width: 0; width: 100%; }
  .cards-grid { grid-template-columns: 1fr; gap: var(--space-4); }
  .card { padding: var(--space-4) var(--space-4) var(--space-4); }
  .card-name { font-size: var(--fs-base); }
  .card-meta { grid-template-columns: 1fr; gap: var(--space-1); }
  .card-meta dt { padding-top: var(--space-1); }
  table.confs { font-size: var(--fs-sm); min-width: 44rem; }
  table.confs th, table.confs td { padding: var(--space-2) var(--space-3); }
  .modal { padding: var(--space-3); }
  .modal-panel { padding: var(--space-5) var(--space-4) var(--space-5); max-width: 100%; max-height: calc(100dvh - var(--space-5)); }
  .modal-meta { grid-template-columns: 1fr; gap: var(--space-1); }
  .modal-section { padding-top: var(--space-3); }
  .colophon { padding-top: var(--space-5); padding-bottom: var(--space-6); }
}
`;
}

function getJS(): string {
  return `
(function(){
  // Tabler outline symbols live in one inline sprite; icon() draws one at 20px.
  function icon(n, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; }
  const DATA = window.__DATA__;
  const dataOk = !!(DATA && Array.isArray(DATA.conferences) && DATA.fields);
  const CONFS = dataOk ? DATA.conferences.slice() : [];
  const FIELDS = dataOk ? DATA.fields : {};
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
    "": "No status",
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
    shown: null,                     // venues in the current view after filtering
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
  themeBtn.setAttribute("aria-pressed", initialTheme === "dark" ? "true" : "false");
  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", cur);
    themeBtn.setAttribute("aria-pressed", cur === "dark" ? "true" : "false");
    localStorage.setItem("ct.theme", cur);
    render();
  });
  function setChipActive(btn, on) {
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  // ------ Field chips ------
  const fieldChipsEl = document.getElementById("fieldChips");
  Object.entries(FIELDS).forEach(([key, f]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.field = key;
    btn.style.setProperty("--field-color", f.color);
    btn.innerHTML = icon("check", "chip-check") + '<span class="chip-dot" style="background:' + f.color + '"></span>' + escape(f.label);
    setChipActive(btn, state.fields.has(key));
    btn.addEventListener("click", () => {
      if (state.fields.has(key)) state.fields.delete(key);
      else state.fields.add(key);
      setChipActive(btn, state.fields.has(key));
      writeHash(); render();
    });
    fieldChipsEl.appendChild(btn);
  });

  // ------ Tier chips ------
  document.querySelectorAll("#tierChips .chip").forEach(b => {
    b.type = "button";
    setChipActive(b, b.dataset.tier === state.tier);
    b.addEventListener("click", () => {
      state.tier = b.dataset.tier;
      document.querySelectorAll("#tierChips .chip").forEach(x => setChipActive(x, x === b));
      writeHash(); render();
    });
  });

  // ------ Window chips ------
  document.querySelectorAll("#windowChips .chip").forEach(b => {
    b.type = "button";
    setChipActive(b, b.dataset.window === state.window);
    b.addEventListener("click", () => {
      state.window = b.dataset.window;
      document.querySelectorAll("#windowChips .chip").forEach(x => setChipActive(x, x === b));
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
  const searchField = document.getElementById("searchField");
  const searchClear = document.getElementById("searchClear");
  if (state.search) searchEl.value = state.search;
  let searchTimer;
  searchEl.addEventListener("input", () => {
    searchClear.hidden = !searchEl.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchEl.value.trim().toLowerCase();
      writeHash(); render();
    }, 140);
  });
  searchClear.addEventListener("click", () => {
    clearTimeout(searchTimer);
    searchEl.value = "";
    state.search = "";
    writeHash(); render();
    searchEl.focus();
  });

  // ------ Starred toggle ------
  const starredOnlyEl = document.getElementById("starredOnly");
  starredOnlyEl.checked = !!state.starredOnly;
  starredOnlyEl.addEventListener("change", (e) => {
    state.starredOnly = e.target.checked;
    writeHash(); render();
  });

  // ------ Clear filters, and keep the controls in step with the data ------
  function clearFilters() {
    clearTimeout(searchTimer);
    state.fields.clear(); state.tier = "all"; state.window = "all"; state.search = ""; state.starredOnly = false;
    searchEl.value = ""; starredOnlyEl.checked = false;
    document.querySelectorAll("#fieldChips .chip").forEach(x => setChipActive(x, false));
    document.querySelectorAll("#tierChips .chip").forEach(x => setChipActive(x, x.dataset.tier === "all"));
    document.querySelectorAll("#windowChips .chip").forEach(x => setChipActive(x, x.dataset.window === "all"));
    writeHash(); render();
    const v = document.getElementById("view-" + state.view);
    v.setAttribute("tabindex", "-1");
    v.focus({ preventScroll: true });
  }
  function syncControls() {
    document.querySelectorAll("#fieldChips .chip").forEach(b => {
      const k = b.dataset.field;
      const any = CONFS.some(c => (c.fields || []).includes(k) && matches(c, true));
      b.disabled = !any && !state.fields.has(k);
    });
    starredOnlyEl.disabled = state.starred.size === 0 && !state.starredOnly;
    searchClear.hidden = !searchEl.value;
    searchField.classList.toggle("no-results", !!state.search && state.shown === 0);
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
        x.setAttribute("aria-pressed", x === t ? "true" : "false");
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
    t.setAttribute("aria-pressed", t.dataset.view === state.view ? "true" : "false");
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
  // skipFields: ignore the field filter, so a field chip can tell whether it would show anything
  function matches(c, skipFields) {
      if (!skipFields && state.fields.size && !c.fields.some(f => state.fields.has(f))) return false;
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
  }
  function visibleConfs() {
    return sortConfs(CONFS.filter(c => matches(c, false)));
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
    if (!d) return "TBA";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtMonth(d) { return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
  function fmtRange(a, b) {
    const da = parseDate(a), db = parseDate(b);
    if (!da) return "TBA";
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
    if (days <= 45) return "soon";
    return "";
  }
  // Future: "in 14d". Past: "closed Mar 4, 2026". The unit and the word are always written out.
  function countdownText(days, deadline) {
    if (days === null) return "no deadline";
    if (days < 0) return "closed " + fmtDate(deadline);
    if (days === 0) return "today";
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
        ? '<span class="stat"><strong class="stat-' + (next.days <= 14 ? "urgent" : "accent") + '">' + next.c.name + '</strong>next deadline, ' + countdownText(next.days, next.c.deadline) + '</span>'
        : '',
      '<span class="stat"><strong>' + starred + '</strong>starred</span>',
    ].join("");
    document.getElementById("stats").innerHTML = html;
  }

  // ------ Region states: loading skeleton is static markup, empty and error are drawn here ------
  const VIEW_LABEL = { timeline: "timeline", cards: "cards", table: "table", map: "map" };
  function filtersActive() {
    return !!(state.fields.size || state.tier !== "all" || state.window !== "all" || state.search || state.starredOnly);
  }
  function loosenHint() {
    if (state.search) return "Shorten or remove the search “" + escape(state.search) + "”.";
    if (state.starredOnly) return state.starred.size ? "Turn off Starred only to see every venue." : "Nothing is starred yet. Turn off Starred only, or star a venue first.";
    if (state.window !== "all") return "Widen the " + escape(state.window) + "d window.";
    if (state.tier !== "all") return "Pick a tier other than " + escape(state.tier) + ".";
    if (state.fields.size) return "Remove a field.";
    return "";
  }
  function emptyHtml(title, sentence) {
    const clear = filtersActive()
      ? '<button type="button" class="btn" data-clear-filters>' + icon("filter") + 'Clear filters</button>'
      : '';
    return '<div class="region-state region-empty"><h3>' + title + '</h3><p>' + sentence + '</p>' + clear + '</div>';
  }
  function noMatchHtml() { return emptyHtml("No venues match", loosenHint() || "There is nothing to show yet."); }
  function errorHtml(what, detail) {
    return '<div class="region-state region-error" role="alert"><h3>Could not load the ' + what + '</h3><p>' + detail + '</p>' +
      '<button type="button" class="btn btn-primary" data-retry>Retry</button></div>';
  }
  function bindRegion(el) {
    el.querySelectorAll("[data-clear-filters]").forEach(b => b.addEventListener("click", clearFilters));
    el.querySelectorAll("[data-retry]").forEach(b => b.addEventListener("click", () => {
      if (!dataOk) location.reload(); else render();
    }));
  }
  function setRegion(el, html) {
    el.setAttribute("aria-busy", "false");
    el.innerHTML = html;
    bindRegion(el);
  }

  // ------ Tooltip: shown on hover and on keyboard focus ------
  function placeTip(tooltip, wrap, x, y) {
    tooltip.classList.add("visible");
    const w = tooltip.offsetWidth, max = wrap.clientWidth;
    tooltip.style.left = Math.max(w / 2, Math.min(max - w / 2, x)) + "px";
    tooltip.style.top = y + "px";
  }
  function tipAtNode(tooltip, wrap, node) {
    const wb = wrap.getBoundingClientRect(), nb = node.getBoundingClientRect();
    placeTip(tooltip, wrap, nb.left - wb.left + nb.width / 2, nb.top - wb.top);
  }
  // Roving tabindex: one Tab stop for a whole field of marks, arrows move between them.
  function bindRoving(nodes, activate, onFocus, onBlur) {
    nodes.forEach((n, i) => {
      n.setAttribute("tabindex", i === 0 ? "0" : "-1");
      n.addEventListener("focus", () => {
        nodes.forEach(x => x.setAttribute("tabindex", x === n ? "0" : "-1"));
        if (onFocus) onFocus(n);
      });
      n.addEventListener("blur", () => { if (onBlur) onBlur(n); });
      n.addEventListener("keydown", (e) => {
        const k = e.key; let j = -1;
        if (k === "ArrowRight" || k === "ArrowDown") j = Math.min(nodes.length - 1, i + 1);
        else if (k === "ArrowLeft" || k === "ArrowUp") j = Math.max(0, i - 1);
        else if (k === "Home") j = 0;
        else if (k === "End") j = nodes.length - 1;
        else if (k === "Enter" || k === " ") { e.preventDefault(); activate(n); return; }
        else return;
        e.preventDefault();
        nodes[j].focus();
      });
    });
  }

  // ------ Render router ------
  function render() {
    state.shown = null;
    if (!dataOk) {
      document.getElementById("stats").innerHTML = '<span>Counts unavailable.</span>';
      document.querySelectorAll(".view").forEach(v => setRegion(v, errorHtml(VIEW_LABEL[v.id.replace("view-", "")], "The venue data did not load. Your stars and notes are still saved in this browser.")));
      return;
    }
    try { renderStats(); } catch (err) { document.getElementById("stats").innerHTML = '<span>Counts unavailable.</span> <button type="button" class="btn" data-retry>Retry</button>'; bindRegion(document.getElementById("stats")); }
    const el = document.getElementById("view-" + state.view);
    try {
      const list = visibleConfs();
      state.shown = list.length;
      if (state.view === "timeline") renderTimeline(list);
      else if (state.view === "cards") renderCards(list);
      else if (state.view === "map") renderMap(list);
      else renderTable(list);
      el.setAttribute("aria-busy", "false");
    } catch (err) {
      setRegion(el, errorHtml(VIEW_LABEL[state.view] || "view", "Something failed while drawing this view. " + escape(err && err.message ? err.message : "")));
    }
    syncControls();
  }

  // ------ Timeline view (dispatcher) ------
  function renderTimeline(list) {
    const el = document.getElementById("view-timeline");
    const cal = state.timelineMode === "calendar";
    const toolbar =
      '<div class="view-toolbar">' +
        '<span class="view-toolbar-label">Timeline</span>' +
        '<div class="view-toolbar-group" id="tlModeGroup">' +
          '<button type="button" class="view-toolbar-btn ' + (cal ? "active" : "") + '" data-mode="calendar" aria-pressed="' + cal + '">Calendar</button>' +
          '<button type="button" class="view-toolbar-btn ' + (!cal ? "active" : "") + '" data-mode="gantt" aria-pressed="' + (!cal) + '">Gantt</button>' +
        '</div>' +
        '<span class="view-toolbar-spacer"></span>' +
        '<span class="view-toolbar-hint">' +
          (cal
            ? "Each cell is a day. Filled cells have deadlines; hover or focus for details."
            : "Horizontal bars span the deadline, the notification and the conference dates.") +
        '</span>' +
      '</div>';

    if (!list.length) { setRegion(el, toolbar + noMatchHtml()); bindTlMode(el); return; }

    setRegion(el, toolbar + '<div id="tlBody"></div>');
    bindTlMode(el);

    const body = document.getElementById("tlBody");
    if (cal) renderTimelineCalendar(body, list);
    else renderTimelineGantt(body, list);
  }

  function bindTlMode(el) {
    el.querySelectorAll("#tlModeGroup [data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.timelineMode = btn.dataset.mode;
        localStorage.setItem("ct.timelineMode", state.timelineMode);
        render();
        const again = document.querySelector('#tlModeGroup [data-mode="' + state.timelineMode + '"]');
        if (again) again.focus();
      });
    });
  }

  // ------ Calendar mode ------
  // Compact month-grid heatmap. Each row is a month, each cell is a day.
  // Cells with deadlines are colored by dominant field; hover or focus reveals
  // conference name + countdown; click or Enter opens detail (or first if multiple).
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
      el.innerHTML = emptyHtml("No deadlines in view", (loosenHint() || "None of these venues has a paper deadline."));
      bindRegion(el);
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
    const todayKey = TODAY.getFullYear() + "-" + String(TODAY.getMonth() + 1).padStart(2, "0") + "-" + String(TODAY.getDate()).padStart(2, "0");
    while (cursor <= maxD) {
      const y = cursor.getFullYear(), m = cursor.getMonth();
      const monthLabel = cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
        if (dls && dls.length && key < todayKey) cls.push("passed");

        if (dls && dls.length) {
          // Stack horizontal stripes per field
          const stripes = dls.map(c => {
            const color = (FIELDS[c.fields[0]] || {}).color || "var(--text-2)";
            return '<i style="background:' + color + '"></i>';
          }).join("");
          const ids = dls.map(c => c.id).join(",");
          const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const tipLines = dls.map(c => c.name + " " + c.year + (c.confidence === "estimated" ? " (est.)" : "")).join(" / ");
          const count = dls.length > 1 ? '<span class="tlcal-count">' + dls.length + '</span>' : "";
          cells += '<div class="' + cls.join(" ") + '" role="group" aria-label="' + escapeAttr(tipLines + ", " + dateLabel + (key < todayKey ? ", closed" : "")) + '" data-ids="' + escapeAttr(ids) + '" data-tip-title="' + escapeAttr(tipLines) + '" data-tip-date="' + escapeAttr(dateLabel) + '" data-day="' + d + '">' +
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
        '<span class="legend-item">Hover or focus to preview; click or press Enter to open</span>' +
      '</div>' +
      '<div class="timeline-wrap">' +
        '<div class="tlcal">' + axis + rows + '</div>' +
        '<div id="tlTooltip" class="timeline-tooltip" role="tooltip"></div>' +
      '</div>';

    const tooltip = document.getElementById("tlTooltip");
    const wrap = el.querySelector(".timeline-wrap");
    const showCell = (node) => {
      tooltip.innerHTML = '<strong>' + escape(node.getAttribute("data-tip-title") || "") + '</strong><span class="tt-date">' + escape(node.getAttribute("data-tip-date") || "") + '</span>';
    };
    const nodes = [...el.querySelectorAll(".tlcal-cell.has-deadline")];
    nodes.forEach(node => {
      node.addEventListener("mousemove", (ev) => {
        showCell(node);
        const wrapBox = wrap.getBoundingClientRect();
        placeTip(tooltip, wrap, ev.clientX - wrapBox.left, ev.clientY - wrapBox.top - 6);
      });
      node.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      node.addEventListener("click", () => {
        const ids = (node.getAttribute("data-ids") || "").split(",").filter(Boolean);
        if (ids.length) openDetail(ids[0]);
      });
    });
    bindRoving(nodes, (n) => { n.click(); },
      (n) => { showCell(n); n.setAttribute("aria-describedby", "tlTooltip"); if (n.matches(":focus-visible")) tipAtNode(tooltip, wrap, n); },
      (n) => { n.removeAttribute("aria-describedby"); tooltip.classList.remove("visible"); });
  }

  // ------ Gantt mode (improved: fit-to-viewport + sticky months + tooltips) ------
  function renderTimelineGantt(el, list) {
    // Sort by next-meaningful date asc
    const rows = list
      .map(c => ({ c, sortDate: parseDate(c.deadline) || parseDate(c.conferenceStart) }))
      .filter(r => r.sortDate)
      .sort((a,b) => a.sortDate - b.sortDate);

    if (!rows.length) { el.innerHTML = emptyHtml("No dated venues in view", loosenHint() || "None of these venues has a date yet."); bindRegion(el); return; }

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

    let svg = '<svg class="timeline-svg" width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Conference timeline">';

    // Month gridlines + labels
    const cursor = new Date(minD.getFullYear(), minD.getMonth(), 1);
    while (cursor <= maxD) {
      const x = xFor(cursor);
      svg += '<line x1="' + x + '" y1="' + (topPad - 14) + '" x2="' + x + '" y2="' + (height - 12) + '" stroke="var(--line)" stroke-width="1"/>';
      svg += '<text x="' + (x + 4) + '" y="' + (topPad - 22) + '" font-family="var(--sans)" font-size="13" fill="var(--text-3)" >' + fmtMonth(cursor) + '</text>';
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Today line
    const todayX = xFor(TODAY);
    svg += '<line x1="' + todayX + '" y1="' + (topPad - 14) + '" x2="' + todayX + '" y2="' + (height - 12) + '" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>';
    svg += '<text x="' + (todayX + 5) + '" y="' + (topPad - 18) + '" font-family="var(--sans)" font-size="13" fill="var(--accent)" font-weight="600">Today</text>';

    // Rows
    rows.forEach((r, i) => {
      const c = r.c;
      const y = topPad + i * rowH + rowH/2;
      const fieldColor = (FIELDS[c.fields[0]] || {}).color || "var(--text-2)";
      const isEstimated = c.confidence === "estimated";

      // Row hit zone (click-to-detail), drawn first so marks above it keep their own hover and focus
      svg += '<rect x="0" y="' + (y - rowH/2) + '" width="' + width + '" height="' + rowH + '" fill="transparent" data-id="' + c.id + '" class="tl-row"/>';

      // Label
      svg += '<text x="' + (labelW - 12) + '" y="' + (y + 4) + '" text-anchor="end" font-size="13" font-weight="500" fill="var(--text-1)" font-family="var(--sans)" pointer-events="none">' + escape(c.name) + ' <tspan font-family="var(--sans)" font-size="11" fill="var(--text-3)" font-weight="400">' + escape(c.year) + '</tspan></text>';

      // Field tag dot
      svg += '<circle cx="' + (labelW - 4) + '" cy="' + y + '" r="3" fill="' + fieldColor + '" pointer-events="none"/>';

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
        svg += '<line x1="' + dx + '" y1="' + y + '" x2="' + nx + '" y2="' + y + '" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3" pointer-events="none"/>';
      }

      // Notification marker
      if (ntfD) {
        const nx = xFor(ntfD);
        svg += '<circle cx="' + nx + '" cy="' + y + '" r="3" fill="var(--text-3)" data-tooltip="' + escapeAttr(c.name + ' · notification ' + fmtDate(c.notification)) + '" data-id="' + c.id + '" class="tl-ntf"/>';
      }

      // Deadline marker (the main one)
      if (dlD) {
        const dx = xFor(dlD);
        const days = daysUntil(dlD);
        const cls = countdownClass(days);
        const fill = cls === "urgent" ? "var(--status-urgent)" : (cls === "passed" ? "var(--text-3)" : "var(--text-1)");
        const tip = c.name + ' deadline · ' + fmtDate(c.deadline) + ' · ' + countdownText(days, c.deadline) + (isEstimated ? ' · est.' : '');
        const common = ' class="timeline-deadline-marker" role="graphics-symbol" aria-label="' + escapeAttr(tip.split(" · ").join(", ")) + '" data-id="' + c.id + '" data-tooltip="' + escapeAttr(tip) + '"';
        if (isEstimated) {
          svg += '<circle cx="' + dx + '" cy="' + y + '" r="5" fill="var(--ground)" stroke="' + fill + '" stroke-width="1.6"' + common + '/>';
        } else {
          svg += '<circle cx="' + dx + '" cy="' + y + '" r="5" fill="' + fill + '"' + common + '/>';
        }
      }

      // Abstract deadline if present
      const abD = parseDate(c.abstractDeadline);
      if (abD && abD < (dlD || maxD)) {
        const ax = xFor(abD);
        svg += '<rect x="' + (ax-2.5) + '" y="' + (y-4.5) + '" width="5" height="9" fill="' + fieldColor + '" data-tooltip="' + escapeAttr(c.name + ' abstract · ' + fmtDate(c.abstractDeadline)) + '" data-id="' + c.id + '" class="tl-abs"/>';
      }
    });

    svg += '</svg>';

    el.innerHTML =
      '<div class="timeline-legend">' +
        '<span class="legend-item"><span class="legend-mark deadline"></span>Paper deadline</span>' +
        '<span class="legend-item"><span class="legend-mark estimated"></span>Estimated (no official date yet)</span>' +
        '<span class="legend-item"><span class="legend-mark notification"></span>Notification</span>' +
        '<span class="legend-item"><span class="legend-mark conference"></span>Conference dates</span>' +
        '<span class="legend-item"><span class="legend-mark today-line"></span>Today</span>' +
      '</div>' +
      '<div class="timeline-wrap">' +
        '<div class="timeline-scroll">' + svg + '</div>' +
        '<div id="tlTooltip" class="timeline-tooltip" role="tooltip"></div>' +
      '</div>';

    // Tooltip + click handlers
    const tooltip = document.getElementById("tlTooltip");
    const wrap = el.querySelector(".timeline-wrap");
    const fillTip = (node) => {
      const parts = (node.getAttribute("data-tooltip") || "").split(" · ");
      const tail = parts.slice(1).map(escape).join("; ");
      tooltip.innerHTML = '<strong>' + escape(parts[0] || "") + '</strong>' + (tail ? '<span class="tt-date">' + tail + '</span>' : '');
    };
    el.querySelectorAll("[data-tooltip]").forEach(node => {
      node.addEventListener("mousemove", (ev) => {
        fillTip(node);
        const wrapBox = wrap.getBoundingClientRect();
        placeTip(tooltip, wrap, ev.clientX - wrapBox.left, ev.clientY - wrapBox.top - 6);
      });
      node.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    });
    el.querySelectorAll("[data-id]").forEach(node => {
      node.addEventListener("click", () => openDetail(node.getAttribute("data-id")));
    });
    bindRoving([...el.querySelectorAll(".timeline-deadline-marker")], (n) => openDetail(n.getAttribute("data-id")),
      (n) => { fillTip(n); n.setAttribute("aria-describedby", "tlTooltip"); if (n.matches(":focus-visible")) tipAtNode(tooltip, wrap, n); },
      (n) => { n.removeAttribute("aria-describedby"); tooltip.classList.remove("visible"); });
    // Auto-scroll to today
    setTimeout(() => {
      const scroll = el.querySelector(".timeline-scroll");
      if (scroll) scroll.scrollLeft = Math.max(0, todayX - 100);
    }, 0);
  }

  // ------ Shared row and card pieces ------
  const STAR_ICONS = icon("star", "icon-off") + icon("star-filled", "icon-on icon-fill");
  function whereText(c) { return escape((c.location?.city || "TBA") + (c.location?.country ? ", " + c.location.country : "")); }
  function fieldTags(c) {
    return (c.fields || []).map(f => {
      const meta = FIELDS[f] || { color: "var(--text-2)", label: f };
      return '<span class="card-tag" style="--tag-bg:' + meta.color + '">' + escape(meta.label) + '</span>';
    }).join("");
  }
  function isClosed(c) { const d = daysUntil(parseDate(c.deadline)); return d !== null && d < 0; }
  function countdownHtml(c) {
    if (!c.deadline) return '<span class="card-countdown">no deadline</span>';
    const days = daysUntil(parseDate(c.deadline));
    const cls = countdownClass(days);
    const word = cls === "urgent" ? '<span class="vh">Urgent: </span>' : (cls === "soon" ? '<span class="vh">Soon: </span>' : '');
    return '<span class="card-countdown ' + cls + '">' + word + countdownText(days, c.deadline) + '</span>';
  }
  // A closed deadline already names its date in the countdown, so the date is not written twice.
  function deadlineHtml(c) {
    if (!c.deadline) return countdownHtml(c);
    return (isClosed(c) ? '' : fmtDate(c.deadline) + ' ') + countdownHtml(c);
  }
  function starBtn(c) {
    const on = state.starred.has(c.id);
    return '<button type="button" class="star-btn ' + (on ? "starred" : "") + '" data-star="' + c.id + '" aria-pressed="' + on + '" aria-label="Star ' + escapeAttr(c.name) + '" title="Star">' + STAR_ICONS + '</button>';
  }
  function bindOpen(el, selector) {
    el.querySelectorAll(selector).forEach(node => {
      node.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        openDetail(node.dataset.id);
      });
      node.addEventListener("keydown", (e) => {
        if (e.target !== node) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(node.dataset.id); }
      });
    });
    el.querySelectorAll(".star-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-star");
        toggleStar(id);
        const again = document.querySelector('.star-btn[data-star="' + id + '"]');
        if (again) again.focus();
      });
    });
  }

  // ------ Cards view ------
  // List is pre-sorted by visibleConfs(). No local sort here.
  function renderCards(list) {
    const el = document.getElementById("view-cards");
    const dn = state.cardDensity;
    const seg = (v, label) => '<button type="button" class="view-toolbar-btn ' + (dn === v ? "active" : "") + '" data-density="' + v + '" aria-pressed="' + (dn === v) + '">' + label + '</button>';
    const toolbar =
      '<div class="view-toolbar">' +
        '<span class="view-toolbar-label">Density</span>' +
        '<div class="view-toolbar-group" id="cardDensityGroup">' + seg("compact", "Compact") + seg("comfortable", "Comfortable") + seg("spacious", "Spacious") + '</div>' +
        '<span class="view-toolbar-spacer"></span>' +
        '<span class="view-toolbar-hint">' + list.length + ' venue' + (list.length === 1 ? "" : "s") + ' in view</span>' +
      '</div>';
    if (!list.length) { setRegion(el, toolbar + noMatchHtml()); bindCardDensity(el); return; }

    const cardsHtml = list.map(c => {
      const isStarred = state.starred.has(c.id);
      const status = state.status[c.id] || "";
      const noteCount = (state.notes[c.id] || "").length;
      const cls = "card" + (isStarred ? " starred" : "") + (isClosed(c) ? " closed" : "");

      return '<article class="' + cls + '" data-id="' + c.id + '" tabindex="0">' +
        '<div class="card-row">' +
          '<h3 class="card-name">' + escape(c.name) + '<span class="year">' + escape(c.year) + '</span></h3>' +
          '<span class="card-tier">' + escape(c.tier) + '</span>' +
        '</div>' +
        '<p class="card-fullname">' + escape(c.fullName) + '</p>' +
        '<div class="card-tags">' + fieldTags(c) + '</div>' +
        '<dl class="card-meta">' +
          '<dt>Deadline</dt><dd>' + deadlineHtml(c) + '</dd>' +
          '<dt>Conf</dt><dd>' + fmtRange(c.conferenceStart, c.conferenceEnd) + '</dd>' +
          '<dt>Where</dt><dd>' + whereText(c) + '</dd>' +
          (c.format ? '<dt>Format</dt><dd>' + escape(c.format) + '</dd>' : '') +
        '</dl>' +
        (c.fit ? '<p class="card-fit">' + escape(c.fit) + '</p>' : '') +
        '<div class="card-actions">' +
          '<a class="card-link" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener" aria-label="CFP for ' + escapeAttr(c.name) + ', opens in a new tab" onclick="event.stopPropagation()">CFP' + icon("external-link") + '</a>' +
          (status ? '<span class="status-pill status-' + status + '">' + escape(STATUS_LABEL[status] || status) + '</span>' : '') +
          (noteCount ? '<span class="note-mark">Has notes</span>' : '') +
          (c.confidence === "estimated" ? '<span class="confidence-mark estimated">est.</span>' : '') +
          starBtn(c) +
        '</div>' +
      '</article>';
    }).join("");
    setRegion(el, toolbar + '<div class="cards-grid density-' + state.cardDensity + '">' + cardsHtml + '</div>');
    bindCardDensity(el);
    bindOpen(el, ".card");
  }

  function bindCardDensity(el) {
    el.querySelectorAll("#cardDensityGroup [data-density]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.cardDensity = btn.dataset.density;
        localStorage.setItem("ct.cardDensity", state.cardDensity);
        render();
        const again = document.querySelector('#cardDensityGroup [data-density="' + state.cardDensity + '"]');
        if (again) again.focus();
      });
    });
  }

  // ------ Table view ------
  // List is pre-sorted by visibleConfs(). Column-header clicks remap state.sort
  // to one of the central keys, then trigger render() — which re-sorts globally.
  function renderTable(list) {
    const el = document.getElementById("view-table");
    if (!list.length) { setRegion(el, noMatchHtml()); return; }
    const colSortMap = {
      name: "name-asc",
      tier: "tier-asc",
      deadline: "deadline-asc",
      conferenceStart: "conference-asc",
    };
    const sortCol = { "name-asc": ["name", "ascending"], "tier-asc": ["tier", "ascending"], "deadline-asc": ["deadline", "ascending"], "deadline-desc": ["deadline", "descending"], "conference-asc": ["conferenceStart", "ascending"] }[state.sort] || [];
    const th = (key, label) => {
      const sorted = sortCol[0] === key;
      const dir = sorted ? sortCol[1] : "";
      return '<th data-sort="' + key + '"' + (sorted ? ' aria-sort="' + dir + '"' : '') + '><button type="button" class="th-btn" data-dir="' + (dir === "ascending" ? "asc" : dir === "descending" ? "desc" : "") + '">' + label + (sorted ? icon("chevron-down") : icon("arrows-sort")) + '</button></th>';
    };
    const rows = list.map(c => {
      const isStarred = state.starred.has(c.id);
      const status = state.status[c.id] || "";
      const cls = (isStarred ? "starred " : "") + (isClosed(c) ? "closed" : "");
      return '<tr class="' + cls + '" data-id="' + c.id + '" tabindex="0">' +
        '<td>' + starBtn(c) + '</td>' +
        '<td><strong>' + escape(c.name) + '</strong><span class="year">' + escape(c.year) + '</span>' +
          (status ? ' <span class="status-pill status-' + status + '">' + escape(STATUS_LABEL[status] || status) + '</span>' : '') +
        '</td>' +
        '<td>' + fieldTags(c) + '</td>' +
        '<td>' + escape(c.tier || "") + '</td>' +
        '<td class="num">' + deadlineHtml(c) + '</td>' +
        '<td class="num">' + fmtRange(c.conferenceStart, c.conferenceEnd) + '</td>' +
        '<td>' + whereText(c) + '</td>' +
        '<td><a class="link-icon" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener" aria-label="CFP for ' + escapeAttr(c.name) + ', opens in a new tab" onclick="event.stopPropagation()">' + icon("external-link") + '</a></td>' +
      '</tr>';
    }).join("");

    setRegion(el, '<div class="table-wrap"><table class="confs">' +
      '<thead><tr>' +
        '<th><span class="vh">Star</span></th>' +
        th("name", "Conf") +
        '<th>Field</th>' +
        th("tier", "Tier") +
        th("deadline", "Deadline") +
        th("conferenceStart", "Conference") +
        '<th>Where</th>' +
        '<th><span class="vh">Call for papers</span></th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>');

    el.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        const target = colSortMap[key];
        if (target) {
          // Toggle asc/desc for deadline; everything else just sets the key.
          if (target === "deadline-asc" && state.sort === "deadline-asc") state.sort = "deadline-desc";
          else state.sort = target;
          if (sortSel) sortSel.value = state.sort;
          writeHash(); render();
          const again = document.querySelector('th[data-sort="' + key + '"] .th-btn');
          if (again) again.focus();
        }
      });
    });
    bindOpen(el, "tbody tr");
  }

  // ------ Map view ------
  // Equirectangular projection. Hairline rectangle, no decorative continents.
  // Conferences without a known city are bucketed at the bottom as "no location".
  function renderMap(list) {
    const el = document.getElementById("view-map");
    if (!list.length) { setRegion(el, noMatchHtml()); return; }

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
    if (!byCity.size) {
      setRegion(el, emptyHtml("No venues with a known city", (loosenHint() || "These venues have no city on record yet.")));
      return;
    }

    let svg = '<svg class="map-svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" role="group" aria-label="World map of conference locations">';
    // Hairline frame
    svg += '<rect x="' + MX + '" y="' + MY + '" width="' + innerW + '" height="' + innerH + '" fill="none" stroke="var(--line)" stroke-width="1"/>';
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
      svg += '<line x1="' + MX + '" y1="' + y + '" x2="' + (W-MX) + '" y2="' + y + '" stroke="var(--line)" stroke-width="1" ' + dash + '/>';
    });
    // Prime meridian
    const pmX = project(0, 0)[0];
    svg += '<line x1="' + pmX + '" y1="' + MY + '" x2="' + pmX + '" y2="' + (H-MY) + '" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4"/>';
    // Continent labels — minimal, faint
    const labels = [
      ["North America", 45, -100], ["South America", -15, -60],
      ["Europe", 52, 18], ["Africa", 5, 22],
      ["Asia", 38, 90], ["Oceania", -25, 140],
    ];
    labels.forEach(([t, lat, lng]) => {
      const [x, y] = project(lat, lng);
      svg += '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="var(--sans)" font-size="13" fill="var(--text-3)"  opacity="0.62">' + t + '</text>';
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
      const color = (FIELDS[dominantField] || {}).color || "var(--text-2)";
      const ids = cluster.confs.map(c => c.id).join(",");
      const tooltip = cluster.city + (cluster.country ? ", " + cluster.country : "") + "; " + n + (n === 1 ? " conference" : " conferences");
      svg += '<g class="map-marker" role="graphics-symbol" aria-label="' + escapeAttr(tooltip) + '" data-ids="' + escapeAttr(ids) + '" data-tooltip="' + escapeAttr(tooltip) + '">' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 4) + '" fill="' + color + '" fill-opacity="0.10"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '" fill-opacity="0.78" stroke="var(--ground)" stroke-width="1.5"/>' +
        (n > 1 ? '<text x="' + x + '" y="' + (y + 3.5) + '" text-anchor="middle" font-family="var(--sans)" font-size="13" font-weight="600" fill="var(--on-accent)">' + n + '</text>' : '') +
      '</g>';
    });

    svg += '</svg>';

    const knownCount = [...byCity.values()].reduce((a, c) => a + c.confs.length, 0);
    setRegion(el,
      '<div class="map-wrap">' +
        '<div class="map-meta">' +
          '<span><strong>' + knownCount + '</strong> with known city</span>' +
          (noLoc.length ? '<span><strong>' + noLoc.length + '</strong> TBA / virtual</span>' : '') +
          '<span class="map-hint">Click or focus a marker for details; circle area scales with count</span>' +
        '</div>' +
        '<div class="map-svg-wrap">' + svg + '</div>' +
        '<div class="map-tooltip" id="mapTooltip" role="tooltip"></div>' +
      '</div>');

    const tooltip = document.getElementById("mapTooltip");
    const wrap = el.querySelector(".map-wrap");
    const markers = [...el.querySelectorAll(".map-marker")];
    const select = (g) => { markers.forEach(m => m.classList.toggle("selected", m === g)); };
    markers.forEach(g => {
      g.addEventListener("mousemove", (ev) => {
        tooltip.textContent = g.getAttribute("data-tooltip");
        const wb = wrap.getBoundingClientRect();
        placeTip(tooltip, wrap, ev.clientX - wb.left, ev.clientY - wb.top - 12);
      });
      g.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      g.addEventListener("click", () => {
        select(g);
        // Several venues in one city: the first opens; the rest are reachable from the list views.
        const ids = (g.getAttribute("data-ids") || "").split(",");
        openDetail(ids[0]);
      });
    });
    bindRoving(markers, (n) => n.dispatchEvent(new MouseEvent("click", { bubbles: true })),
      (g) => { tooltip.textContent = g.getAttribute("data-tooltip"); g.setAttribute("aria-describedby", "mapTooltip"); if (g.matches(":focus-visible")) tipAtNode(tooltip, wrap, g); },
      (g) => { g.removeAttribute("aria-describedby"); tooltip.classList.remove("visible"); });
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

  // ------ Modals: open, closing, focus trapped, Escape closes the top one ------
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  const suggestModal = document.getElementById("suggestModal");
  function durIn() {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-in"));
    return isNaN(v) ? 0 : v;
  }
  function showModal(m, focusEl) {
    clearTimeout(m._t);
    m._last = document.activeElement;
    m.classList.remove("hidden");
    m.setAttribute("aria-hidden", "false");
    void m.offsetWidth;
    m.classList.add("open");
    requestAnimationFrame(() => {
      const target = focusEl || m.querySelector(".modal-close");
      if (target) target.focus();
    });
  }
  function hideModal(m) {
    if (m.classList.contains("hidden")) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    const finish = () => m.classList.add("hidden");
    const d = durIn();
    if (d > 0) m._t = setTimeout(finish, d); else finish();
    const back = m._last;
    if (back && typeof back.focus === "function" && document.contains(back)) back.focus();
  }
  function topModal() {
    return [suggestModal, modal].find(m => !m.classList.contains("hidden") && m.classList.contains("open")) || null;
  }
  [modal, suggestModal].forEach(m => m.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) hideModal(m);
  }));
  document.addEventListener("keydown", (e) => {
    const m = topModal();
    if (!m) return;
    if (e.key === "Escape") { hideModal(m); return; }
    if (e.key !== "Tab") return;
    const items = [...m.querySelectorAll("a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")].filter(x => x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function closeDetail() { hideModal(modal); }

  function openDetail(id) {
    const c = CONFS.find(x => x.id === id);
    if (!c) return;
    const status = state.status[c.id] || "";
    const notes = state.notes[c.id] || "";
    const statusOpts = STATUSES.map(s =>
      '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + escape(STATUS_LABEL[s] || s) + '</option>'
    ).join("");
    const calIcs = "/cal.ics?ids=" + encodeURIComponent(c.id);
    const section = (title, rows) => rows.length ? '<div class="modal-section"><h3>' + title + '</h3><dl class="modal-meta">' + rows.join("") + '</dl></div>' : '';
    const row = (dt, dd) => '<dt>' + dt + '</dt><dd>' + dd + '</dd>';

    modalBody.innerHTML =
      '<h2 class="modal-name" id="modalTitle">' + escape(c.name) + '<span class="year">' + escape(c.year) + '</span></h2>' +
      '<p class="modal-fullname">' + escape(c.fullName) + '</p>' +
      '<div class="modal-tags">' + fieldTags(c) +
        '<span class="card-tier">' + escape(c.tier) + '</span>' +
        (c.confidence === "estimated" ? '<span class="confidence-mark estimated">est.</span>' : '') +
      '</div>' +
      section("Schedule", [
        c.abstractDeadline ? row("Abstract", fmtDate(c.abstractDeadline)) : "",
        row("Paper deadline", deadlineHtml(c)),
        c.notification ? row("Notification", fmtDate(c.notification)) : "",
        row("Conference", fmtRange(c.conferenceStart, c.conferenceEnd)),
      ].filter(Boolean)) +
      section("Where", [row("Location", whereText(c))]) +
      section("Submission", [
        c.format ? row("Format", escape(c.format)) : "",
        c.pageLimit ? row("Page limit", escape(c.pageLimit)) : "",
        c.blind ? row("Blind", escape(c.blind)) : "",
        c.acceptanceRate != null ? row("Accept rate", Math.round(c.acceptanceRate * 100) + "%") : "",
      ].filter(Boolean)) +
      (c.fit ? '<div class="modal-section"><h3>Fit for you</h3><p class="modal-lead">' + escape(c.fit) + '</p></div>' : '') +
      '<div class="modal-section"><div class="tracking-head"><h3>Your tracking</h3><span class="saved" id="trackSaved" role="status"></span></div>' +
        '<div class="modal-tracking">' +
          '<label class="tracking-row"><span class="tracking-label">Status</span>' +
            '<span class="select-wrap"><select class="select" id="modal-status">' + statusOpts + '</select>' + icon("chevron-down", "select-icon") + '</span>' +
          '</label>' +
          '<label class="tracking-row tracking-row-stack"><span class="tracking-label">Notes</span>' +
            '<textarea class="notes-area" id="modal-notes" rows="3" placeholder="Draft progress, co-authors, blockers…">' + escape(notes) + '</textarea>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<a class="modal-link-btn" href="' + escapeAttr(c.link) + '" target="_blank" rel="noopener">Open CFP' + icon("external-link") + '</a>' +
        '<a class="modal-link-btn modal-link-btn-secondary" href="' + escapeAttr(calIcs) + '" download="' + escape(c.id) + '.ics">' + icon("calendar-down") + 'Add to calendar (.ics)</a>' +
      '</div>';

    const saved = document.getElementById("trackSaved");
    const statusEl = document.getElementById("modal-status");
    if (statusEl) statusEl.addEventListener("change", () => { setStatus(c.id, statusEl.value); saved.textContent = "Saved"; });
    const notesEl = document.getElementById("modal-notes");
    if (notesEl) {
      let nt;
      notesEl.addEventListener("input", () => {
        saved.textContent = "";
        clearTimeout(nt);
        nt = setTimeout(() => { setNote(c.id, notesEl.value); saved.textContent = "Saved"; }, 300);
      });
    }
    showModal(modal);
  }

  // ------ Suggest modal: default, invalid, submitting, error, sent ------
  const sgForm = document.getElementById("suggestForm");
  const sgStatus = document.getElementById("suggestStatus");
  const sgSubmit = document.getElementById("suggestSubmit");
  function sgField(id, msg) {
    const input = document.getElementById(id);
    const wrap = input.closest(".field");
    const out = document.getElementById(id + "-msg");
    if (msg) { wrap.setAttribute("data-invalid", ""); input.setAttribute("aria-invalid", "true"); }
    else { wrap.removeAttribute("data-invalid"); input.removeAttribute("aria-invalid"); }
    if (out) out.textContent = msg || "";
  }
  function sgSet(kind, html) {
    sgStatus.className = "form-status" + (kind ? " " + kind : "");
    sgStatus.innerHTML = html || "";
  }
  function openSuggest() {
    sgForm.reset();
    sgField("sg-name", ""); sgField("sg-link", "");
    sgSet("", "");
    sgSubmit.disabled = false;
    sgSubmit.textContent = "Open draft on GitHub";
    showModal(suggestModal, document.getElementById("sg-name"));
  }
  const submitBtn = document.getElementById("submitConfBtn");
  if (submitBtn) submitBtn.addEventListener("click", openSuggest);
  sgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("sg-name").value.trim();
    const link = document.getElementById("sg-link").value.trim();
    const deadline = document.getElementById("sg-deadline").value;
    const why = document.getElementById("sg-why").value.trim();
    let linkMsg = "";
    if (!link) linkMsg = "Enter the call for papers link.";
    else if (!/^https?:[/][/][^ ]+[.][^ ]+$/i.test(link)) linkMsg = "Enter a full link that starts with https://";
    sgField("sg-name", name ? "" : "Enter the venue name.");
    sgField("sg-link", linkMsg);
    const missing = [!name ? "sg-name" : "", linkMsg ? "sg-link" : ""].filter(Boolean);
    if (missing.length) {
      sgSet("error", "Fix " + (missing.length === 1 ? "the field" : "the " + missing.length + " fields") + " marked above, then try again.");
      document.getElementById(missing[0]).focus();
      return;
    }
    sgSubmit.disabled = true;
    sgSubmit.textContent = "Opening GitHub…";
    sgSet("", "Opening the draft issue…");
    const body = [
      "Conference name (acronym + full): " + name,
      "",
      "Field(s):",
      "",
      "Tier (A* / A / B / industry / journal):",
      "",
      "Deadline (YYYY-MM-DD): " + deadline,
      "Notification (YYYY-MM-DD):",
      "Conference dates (YYYY-MM-DD to YYYY-MM-DD):",
      "",
      "Location (city, country):",
      "",
      "Format / page limit / blind:",
      "",
      "CFP link: " + link,
      "",
      "Why it fits Doug's research (1 line): " + why,
      "",
      "Sources (2 or more URLs):",
      "",
    ].join("\\n");
    const url = "https://github.com/douglaspmcgowan/conference-tracker/issues/new?title=" +
      encodeURIComponent("Suggest conference: " + name) +
      "&body=" + encodeURIComponent(body) +
      "&labels=conference-suggestion";
    requestAnimationFrame(() => {
      let w = null;
      try { w = window.open(url, "_blank"); } catch (err) { w = null; }
      sgSubmit.disabled = false;
      if (w) {
        try { w.opener = null; } catch (err) { /* cross-origin window, nothing to detach */ }
        sgSubmit.textContent = "Open draft again";
        sgSet("sent", icon("check") + "Draft issue opened on GitHub. Submit it there to finish.");
      } else {
        sgSubmit.textContent = "Retry";
        sgSet("error", "Your browser blocked the new tab, so nothing was opened. Allow pop-ups for this site, then select Retry.");
      }
    });
  });
  [["sg-name", "Enter the venue name."], ["sg-link", ""]].forEach(([id]) => {
    document.getElementById(id).addEventListener("input", () => { sgField(id, ""); if (sgStatus.classList.contains("error")) sgSet("", ""); });
  });

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
