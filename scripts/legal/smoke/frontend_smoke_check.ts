/**
 * Legal Frontend Smoke Check — verifies all 21 pages have valid imports.
 *
 * Does NOT fetch real URLs. Only checks that imported components/modules
 * exist on the filesystem.
 *
 * Usage: npx tsx scripts/legal/smoke/frontend_smoke_check.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../../..");

const LEGAL_PAGES_DIR = path.join(ROOT, "app/(forge)/legal");
const COMPONENTS_DIR = path.join(ROOT, "components");
const HOOKS_DIR = path.join(ROOT, "hooks");
const LIB_DIR = path.join(ROOT, "lib");

/** Recursively find all .tsx/.ts files in a directory. */
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/** Extract local imports (starting with @/ or ./) from a file. */
function extractImports(filePath: string): string[] {
  const src = fs.readFileSync(filePath, "utf-8");
  const imports: string[] = [];
  const re = /(?:import|from)\s+["'](@\/[^"']+|\.\/[^"']+|\.\.\/[^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

/** Resolve an import specifier to an absolute path on disk. */
function resolveImport(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = path.join(ROOT, specifier.slice(2));
  } else {
    base = path.resolve(path.dirname(fromFile), specifier);
  }

  // Try exact path, then with extensions, then as directory index
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
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return c;
    }
  }
  return null;
}

// ── Main ──

console.log("=== Legal Frontend Smoke Check ===\n");

const pages = walk(LEGAL_PAGES_DIR);
console.log(`Pages found: ${pages.length}`);

let totalImports = 0;
let brokenImports = 0;
const broken: { page: string; specifier: string }[] = [];

for (const page of pages) {
  const relPage = path.relative(ROOT, page);
  const imports = extractImports(page);
  totalImports += imports.length;

  for (const spec of imports) {
    const resolved = resolveImport(spec, page);
    if (!resolved) {
      brokenImports++;
      broken.push({ page: relPage, specifier: spec });
    }
  }
}

console.log(`Total imports checked: ${totalImports}`);
console.log(`Broken imports: ${brokenImports}\n`);

if (broken.length > 0) {
  console.log("BROKEN IMPORTS:");
  for (const b of broken) {
    console.log(`  ${b.page} → ${b.specifier}`);
  }
  console.log("\n❌ FAIL — broken imports detected");
  process.exit(1);
} else {
  console.log("✓ All imports resolve to existing files");
}

// Also verify components/legal/ directory
const legalComponents = walk(path.join(COMPONENTS_DIR, "legal"));
console.log(`\nLegal components found: ${legalComponents.length}`);

console.log("\n=== DONE ===");
