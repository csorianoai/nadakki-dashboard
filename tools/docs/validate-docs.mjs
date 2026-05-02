/**
 * Validates COMPONENTS.md ↔ components/forge/ui + layout sources.
 * --strict: exit 1 if missing-in-docs or orphan-in-docs (default for CI).
 * Without --strict: exit 0 but still writes JSON (Step 3 intermediate).
 *
 * Usage: node tools/docs/validate-docs.mjs [--strict]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const COMPONENTS_MD = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "COMPONENTS.md");
const REPORT_JSON = path.join(__dirname, "_validate-report.json");
const UI_DIR = path.join(ROOT, "components", "forge", "ui");
const LAYOUT_DIR = path.join(ROOT, "components", "forge", "layout");

const NON_PRIMITIVE_HEADINGS = new Set([
  "Barrel",
  "Phase 2 primitives (28 exports)",
  "Preview playground",
  "App shell (Phase 3)",
  "Lighthouse accessibility (Phase 4 gate)",
  "Motion policy (Phase 7)",
  "DataTable — pagination",
  "Tooltips",
]);

function listForgeSources() {
  const ui = fs
    .readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => ({ base: path.basename(f, ".tsx"), rel: path.join("components", "forge", "ui", f) }));
  const layout = fs
    .readdirSync(LAYOUT_DIR)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => ({ base: path.basename(f, path.extname(f)), rel: path.join("components", "forge", "layout", f) }));
  return [...ui, ...layout];
}

function extractH2Headings(md) {
  const re = /^## (.+)$/gm;
  const out = [];
  let m;
  while ((m = re.exec(md)) !== null) out.push(m[1].trim());
  return out;
}

function hasPrimitiveHeading(md, base) {
  const re = new RegExp(`^## ${escapeRe(base)}\\s*$`, "m");
  return re.test(md);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  const strict = process.argv.includes("--strict");
  const doc = fs.readFileSync(COMPONENTS_MD, "utf8");
  const sources = listForgeSources();
  const headings = extractH2Headings(doc);

  const missingInDocs = [];
  for (const { base, rel } of sources) {
    if (!hasPrimitiveHeading(doc, base)) missingInDocs.push({ base, file: rel });
  }

  const sourceBases = new Set(sources.map((s) => s.base));
  const orphanInDocs = [];
  for (const h of headings) {
    if (NON_PRIMITIVE_HEADINGS.has(h)) continue;
    if (sourceBases.has(h)) continue;
    orphanInDocs.push({ heading: h });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    strict,
    missingInDocs,
    orphanInDocs,
    counts: {
      sources: sources.length,
      headings: headings.length,
      missing: missingInDocs.length,
      orphans: orphanInDocs.length,
    },
    ok: missingInDocs.length === 0 && orphanInDocs.length === 0,
  };
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf8");
  console.log("Wrote", REPORT_JSON);
  console.log(JSON.stringify(report.counts, null, 2));

  if (report.ok) {
    console.log("validate-docs: OK");
    process.exit(0);
  }
  if (missingInDocs.length) console.error("Missing ## headings for:", missingInDocs.map((m) => m.base).join(", "));
  if (orphanInDocs.length) console.error("Orphan headings:", orphanInDocs.map((o) => o.heading).join(", "));
  if (strict) process.exit(1);
  console.warn("validate-docs: non-strict mode — exit 0 despite findings");
  process.exit(0);
}

main();
