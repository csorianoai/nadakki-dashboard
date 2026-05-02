/**
 * Fail if any components/forge/ui/*.tsx or layout/*.tsx|.ts is missing from COMPONENTS.md.
 * Usage: node tools/docs/validate-docs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const COMPONENTS_MD = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "COMPONENTS.md");
const UI_DIR = path.join(ROOT, "components", "forge", "ui");
const LAYOUT_DIR = path.join(ROOT, "components", "forge", "layout");

function listFiles(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => path.join(dir, f));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDocumented(base, text) {
  if (base === "Toast") {
    return /\bForgeToaster\b/.test(text) && /\btoast\b/i.test(text);
  }
  const re = new RegExp(`\\b${escapeRe(base)}\\b`);
  return re.test(text);
}

function main() {
  const doc = fs.readFileSync(COMPONENTS_MD, "utf8");
  const uiFiles = listFiles(UI_DIR, [".tsx"]);
  const layoutFiles = listFiles(LAYOUT_DIR, [".tsx", ".ts"]);
  const missing = [];
  for (const f of [...uiFiles, ...layoutFiles]) {
    const base = path.basename(f, path.extname(f));
    if (!isDocumented(base, doc)) missing.push(path.relative(ROOT, f));
  }
  if (missing.length) {
    console.error("COMPONENTS.md missing documentation for:\n", missing.join("\n "));
    process.exit(1);
  }
  console.log("validate-docs: OK —", uiFiles.length, "ui +", layoutFiles.length, "layout files referenced in COMPONENTS.md");
}

main();
