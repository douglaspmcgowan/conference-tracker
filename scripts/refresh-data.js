// Re-merge research/agent-{1..4}-*.md JSON blocks into data/conferences.js.
// Used by both the initial build and the biweekly refresh routine.

const fs = require("fs");
const path = require("path");

const dir = "./research";
const files = [
  "agent-1-hci.md",
  "agent-2-engineering-design.md",
  "agent-3-ai-ml.md",
  "agent-4-viz-mfg-cogsci.md",
];

const all = [];
const seenIds = new Set();
for (const f of files) {
  const txt = fs.readFileSync(path.join(dir, f), "utf8");
  const re = /```json([\s\S]*?)```/g;
  let m;
  const blocks = [];
  while ((m = re.exec(txt))) blocks.push(m[1]);
  for (const b of blocks) {
    let parsed = null;
    try { parsed = JSON.parse(b); }
    catch (e) { try { parsed = eval("(" + b + ")"); } catch (_) { continue; } }
    const list = (parsed && parsed.conferences) || (Array.isArray(parsed) ? parsed : []);
    for (const c of list) if (c.id && !seenIds.has(c.id)) { seenIds.add(c.id); all.push(c); }
  }
}

const fieldMap = {
  "HCI": "HCI", "AI for Design": "AI for Design", "ML": "ML", "AI/ML": "ML",
  "NLP": "NLP", "CV": "CV",
  "Engineering Design": "Engineering Design", "Manufacturing": "Manufacturing",
  "Visualization": "Visualization", "Cognitive Science": "Cognitive Science",
  "Robotics": "Robotics", "HRI": "HCI", "Graphics": "Graphics",
  "Knowledge & Information": "Knowledge & Information",
  "Affective": "Affective", "Health": "Health", "Datasets": "ML",
};
const canon = (f) => fieldMap[f] || (
  /HCI|UIST|interaction/i.test(f) ? "HCI" :
  /visual/i.test(f) ? "Visualization" :
  /manuf|additive/i.test(f) ? "Manufacturing" :
  /design/i.test(f) ? "Engineering Design" :
  /cogn|psych/i.test(f) ? "Cognitive Science" :
  /robot/i.test(f) ? "Robotics" :
  /NLP/i.test(f) ? "NLP" :
  /graph|3D/i.test(f) ? "Graphics" :
  /ML|learning|AI/i.test(f) ? "ML" :
  "Knowledge & Information"
);

const normDate = (s) => {
  if (!s || ["TBA", "TBD", "rolling", "null"].includes(s) || typeof s !== "string") return null;
  const m = s.match(/^(\d{4})-(\d{2})-([\d X]{2})/);
  if (!m) return null;
  const day = m[3].includes("X") ? "15" : m[3];
  return `${m[1]}-${m[2]}-${day.padStart(2, "0")}`;
};

const normTier = (t) => {
  if (!t) return "B";
  const s = String(t);
  if (/A\*|A-?star/i.test(s)) return "A*";
  if (/^A-?$/.test(s) || s === "A") return "A";
  if (/^B/.test(s)) return "B";
  if (/industry|practitioner/i.test(s)) return "industry";
  if (/journal/i.test(s)) return "journal";
  return "B";
};

const cleaned = all.map((c) => {
  const fset = [...new Set((c.fields || []).map(canon).filter(Boolean))];
  if (!fset.length) fset.push("Knowledge & Information");
  return {
    id: c.id,
    name: c.name,
    fullName: c.fullName || c.name,
    year: c.year || (c.deadline ? parseInt(c.deadline.slice(0, 4)) : null),
    fields: fset,
    tier: normTier(c.tier),
    abstractDeadline: normDate(c.abstractDeadline),
    deadline: normDate(c.deadline),
    notification: normDate(c.notification),
    conferenceStart: normDate(c.conferenceStart),
    conferenceEnd: normDate(c.conferenceEnd) || normDate(c.conferenceStart),
    location: c.location || { city: "TBA", country: "TBA" },
    format: c.format || null,
    pageLimit: c.pageLimit ? String(c.pageLimit) : null,
    acceptanceRate: typeof c.acceptanceRate === "number" ? c.acceptanceRate : null,
    blind: c.blind || null,
    link: c.link || "#",
    fit: c.fit || "",
    confidence: c.confidence || "estimated",
  };
}).filter((c) => c.id && c.name);

const nextDate = (c) => {
  const cands = [c.deadline, c.abstractDeadline, c.conferenceStart]
    .filter(Boolean)
    .map((s) => new Date(s + "T00:00:00").getTime())
    .filter((t) => !isNaN(t));
  return cands.length ? Math.min(...cands) : Infinity;
};
cleaned.sort((a, b) => nextDate(a) - nextDate(b));

const fields = {
  "HCI":                     { color: "#5B6BBF", label: "HCI" },
  "AI for Design":           { color: "#3F8579", label: "AI for Design" },
  "ML":                      { color: "#2F8A6E", label: "ML" },
  "NLP":                     { color: "#5BA88E", label: "NLP" },
  "CV":                      { color: "#2F8AA8", label: "CV" },
  "Engineering Design":      { color: "#B8753B", label: "Eng Design" },
  "Visualization":           { color: "#7A4FAB", label: "Visualization" },
  "Manufacturing":           { color: "#A0522D", label: "Manufacturing" },
  "Cognitive Science":       { color: "#6B7B5C", label: "Cognitive Sci" },
  "Robotics":                { color: "#487E9F", label: "Robotics" },
  "Graphics":                { color: "#9C5BAB", label: "Graphics" },
  "Knowledge & Information": { color: "#B5A030", label: "Knowledge & Info" },
  "Affective":               { color: "#B05F8C", label: "Affective" },
  "Health":                  { color: "#C84D4D", label: "Health" },
};

const header = `// Generated ${new Date().toISOString().slice(0, 10)} by scripts/refresh-data.js\n\n`;
fs.writeFileSync(
  "./data/conferences.js",
  header +
    "module.exports = {\n  fields: " +
    JSON.stringify(fields, null, 2) +
    ",\n\n  conferences: " +
    JSON.stringify(cleaned, null, 2) +
    "\n};\n",
);
console.log(`wrote ${cleaned.length} conferences across ${Object.keys(fields).length} fields`);
