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

// Explicit tag → canonical field. Only tags in this map are recognized.
// Anything unrecognized returns null and is dropped — the entry keeps whichever
// fields DID match. This prevents the old fallback from polluting cards
// with "Knowledge & Information" alongside an already-correct primary tag.
const fieldMap = {
  // HCI cluster
  "HCI": "HCI", "Human-Computer Interaction": "HCI",
  "HRI": "HCI", "interaction": "HCI", "UIST": "HCI", "UI": "HCI",
  "CSCW": "HCI", "Collaboration": "HCI", "tangible": "HCI",
  // AI for Design cluster
  "AI for Design": "AI for Design", "AI for design": "AI for Design",
  "AI for CAD": "AI for Design", "Generative Design": "AI for Design",
  "Mixed-initiative": "AI for Design",
  // ML cluster
  "ML": "ML", "Machine Learning": "ML", "AI": "ML", "AI/ML": "ML",
  "Deep Learning": "ML", "Foundation Models": "ML", "Agents": "ML",
  "Datasets": "ML", "Datasets & Benchmarks": "ML",
  // NLP cluster
  "NLP": "NLP", "Natural Language Processing": "NLP",
  "Computational Linguistics": "NLP", "LLM": "NLP",
  // CV cluster
  "CV": "CV", "Computer Vision": "CV", "Vision": "CV",
  // Engineering Design cluster
  "Engineering Design": "Engineering Design", "Design Science": "Engineering Design",
  "Design Theory": "Engineering Design", "Design Methodology": "Engineering Design",
  "DfM": "Engineering Design", "DfAM": "Engineering Design",
  "Mechanical Design": "Engineering Design", "Product Design": "Engineering Design",
  "Design Cognition": "Engineering Design",
  // Manufacturing cluster
  "Manufacturing": "Manufacturing", "Additive Manufacturing": "Manufacturing",
  "AM": "Manufacturing", "3D Printing": "Manufacturing",
  // Visualization cluster
  "Visualization": "Visualization", "InfoVis": "Visualization", "SciVis": "Visualization",
  "VAST": "Visualization", "Data Visualization": "Visualization",
  // Cognitive Science cluster
  "Cognitive Science": "Cognitive Science", "CogSci": "Cognitive Science",
  "Psychology": "Cognitive Science",
  // Robotics cluster
  "Robotics": "Robotics", "Autonomy": "Robotics",
  // Graphics cluster
  "Graphics": "Graphics", "Computer Graphics": "Graphics", "3D": "Graphics",
  "Geometry": "Graphics", "Rendering": "Graphics",
  // Knowledge & Information cluster — ONLY when explicit
  "Knowledge & Information": "Knowledge & Information",
  "Knowledge Graphs": "Knowledge & Information",
  "Information Retrieval": "Knowledge & Information",
  "Digital Libraries": "Knowledge & Information",
  "Hypertext": "Knowledge & Information",
  "Web": "Knowledge & Information",
  // Affective / Health
  "Affective": "Affective", "Affective Computing": "Affective",
  "Health": "Health", "Wellbeing": "Health", "Wearables": "Health",
  "BCI": "Health",
};

// Strict canon: returns null for unknown tags. Heuristic patterns kick in
// only after the explicit map misses, and only return a non-null value if
// the input clearly matches a known cluster.
const canon = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const f = raw.trim();
  if (fieldMap[f]) return fieldMap[f];
  // case-insensitive map lookup
  const lower = f.toLowerCase();
  for (const k of Object.keys(fieldMap)) {
    if (k.toLowerCase() === lower) return fieldMap[k];
  }
  // narrow heuristics — strict enough that random tags don't slip through
  if (/^(HCI|UIST|interaction|HRI)$/i.test(f)) return "HCI";
  if (/visualization|infovis|scivis/i.test(f)) return "Visualization";
  if (/manufactur|additive/i.test(f)) return "Manufacturing";
  if (/^design|engineering design|design (science|theory|methodology|cogn)/i.test(f)) return "Engineering Design";
  if (/cognitive|psycholog/i.test(f)) return "Cognitive Science";
  if (/robotic/i.test(f)) return "Robotics";
  if (/^NLP|natural language/i.test(f)) return "NLP";
  if (/^(CV|computer vision)$/i.test(f)) return "CV";
  if (/(graphics|rendering|geometry)/i.test(f)) return "Graphics";
  if (/^(ML|machine learning|deep learning|foundation model)/i.test(f)) return "ML";
  if (/affective/i.test(f)) return "Affective";
  if (/wellbeing|wearable|health|BCI/i.test(f)) return "Health";
  if (/knowledge|hypertext|digital librar|^web$/i.test(f)) return "Knowledge & Information";
  return null;
};

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
  // Drop nulls (unrecognized) — keep only canonical tags. Only fall back
  // to a generic bucket if NOTHING in the original list matched.
  const fset = [...new Set((c.fields || []).map(canon).filter(Boolean))];
  if (!fset.length) {
    // Last-ditch heuristic against the conference name itself.
    const blob = (c.name + " " + (c.fullName || "")).toLowerCase();
    if (/chi|uist|hci|cscw|iui/.test(blob)) fset.push("HCI");
    else if (/idetc|design|asme/.test(blob)) fset.push("Engineering Design");
    else if (/neurips|icml|iclr|aaai|ijcai/.test(blob)) fset.push("ML");
    else if (/vis|vast|eurovis/.test(blob)) fset.push("Visualization");
    else if (/cogsci|psychon/.test(blob)) fset.push("Cognitive Science");
    else fset.push("Knowledge & Information");
  }
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

const generated = new Date().toISOString();
const header = `// Generated ${generated.slice(0, 10)} by scripts/refresh-data.js\n\n`;
fs.writeFileSync(
  "./data/conferences.js",
  header +
    "module.exports = {\n  generated: " +
    JSON.stringify(generated) +
    ",\n\n  fields: " +
    JSON.stringify(fields, null, 2) +
    ",\n\n  conferences: " +
    JSON.stringify(cleaned, null, 2) +
    "\n};\n",
);
console.log(`wrote ${cleaned.length} conferences across ${Object.keys(fields).length} fields`);
