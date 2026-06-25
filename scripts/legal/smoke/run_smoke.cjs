/**
 * Legal Frontend Smoke Check — verifies all legal pages have valid imports.
 * Usage: node scripts/legal/smoke/run_smoke.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const LEGAL = path.join(ROOT, "app/(forge)/legal");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

function extractImports(filePath) {
  const src = fs.readFileSync(filePath, "utf-8");
  const imports = [];
  const re = /(?:import|from)\s+["'](@\/[^"']+|\.\/[^"']+|\.\.\/[^"']+)["']/g;
  let match;
  while ((match = re.exec(src)) !== null) imports.push(match[1]);
  return imports;
}

function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".jsx",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

console.log("=== Legal Frontend Smoke Check ===\n");

const pages = walk(LEGAL);
console.log("Pages found:", pages.length);

let totalImports = 0;
let brokenImports = 0;
const broken = [];

for (const page of pages) {
  const relPage = path.relative(ROOT, page);
  const imports = extractImports(page);
  totalImports += imports.length;
  for (const spec of imports) {
    if (!resolveImport(spec, page)) {
      brokenImports++;
      broken.push({ page: relPage, specifier: spec });
    }
  }
}

console.log("Imports checked:", totalImports);
console.log("Broken:", brokenImports, "\n");

if (broken.length > 0) {
  console.log("BROKEN IMPORTS:");
  for (const b of broken) console.log("  " + b.page + " -> " + b.specifier);
  console.log("\nFAIL — broken imports detected");
  process.exit(1);
} else {
  console.log("All imports resolve to existing files");
}

const legalComponents = walk(path.join(ROOT, "components/legal"));
console.log("\nLegal components found:", legalComponents.length);
console.log("\n=== DONE ===");
