/**
 * Legal OS Cockpit Smoke Check — verifies cockpit files exist and have valid imports.
 * Usage: node scripts/smoke/smoke-legal-cockpit.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

const REQUIRED_FILES = [
  "app/(forge)/legal/guide/page.tsx",
  "components/legal-cockpit/LegalCockpitShell.tsx",
  "components/legal-cockpit/LegalKPIRow.tsx",
  "components/legal-cockpit/LegalCommandCenter.tsx",
  "components/legal-cockpit/LegalUrgentMatters.tsx",
  "components/legal-cockpit/LegalGoldenPath.tsx",
  "components/legal-cockpit/LegalAgentGrid.tsx",
  "components/legal-cockpit/LegalActionFallbackPanel.tsx",
  "components/legal-cockpit/LegalTrustPanel.tsx",
  "lib/legal-cockpit/types.ts",
  "lib/legal-cockpit/demo-data.ts",
  "lib/legal-cockpit/api.ts",
  "lib/legal-cockpit/routes.ts",
  "lib/legal-cockpit/intent-router.ts",
];

const MUST_NOT_TOUCH = [
  "app/(forge)/legal/cases/page.tsx",
  "app/(forge)/legal/audit/page.tsx",
  "app/(forge)/legal/contracts/page.tsx",
  "app/(forge)/legal/config/page.tsx",
  "app/(forge)/legal/research/page.tsx",
];

console.log("=== Legal OS Cockpit Smoke Check ===\n");

let pass = 0;
let fail = 0;

// Check required files exist
for (const f of REQUIRED_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) {
    console.log(`  [OK]  ${f}`);
    pass++;
  } else {
    console.log(`  [ERR] ${f} — MISSING`);
    fail++;
  }
}

// Verify existing pages are untouched (just check they exist)
console.log("\n--- Existing pages (must not be deleted) ---");
for (const f of MUST_NOT_TOUCH) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) {
    console.log(`  [OK]  ${f}`);
    pass++;
  } else {
    console.log(`  [ERR] ${f} — MISSING (was deleted!)`)
    fail++;
  }
}

// Check for demoData: true in demo-data.ts
console.log("\n--- demoData compliance ---");
const demoFile = path.join(ROOT, "lib/legal-cockpit/demo-data.ts");
if (fs.existsSync(demoFile)) {
  const content = fs.readFileSync(demoFile, "utf-8");
  const demoCount = (content.match(/demoData:\s*true/g) || []).length;
  const falseCount = (content.match(/demoData:\s*false/g) || []).length;
  console.log(`  demoData: true occurrences: ${demoCount}`);
  if (falseCount > 0) {
    console.log(`  [ERR] demoData: false found ${falseCount} times!`);
    fail++;
  } else {
    console.log(`  [OK]  No demoData: false found`);
    pass++;
  }
} else {
  console.log("  [ERR] demo-data.ts not found");
  fail++;
}

// Check imports in guide page
console.log("\n--- Import resolution (guide/page.tsx) ---");
const guidePage = path.join(ROOT, "app/(forge)/legal/guide/page.tsx");
if (fs.existsSync(guidePage)) {
  const src = fs.readFileSync(guidePage, "utf-8");
  const imports = [];
  const re = /from\s+["'](@\/[^"']+)["']/g;
  let match;
  while ((match = re.exec(src)) !== null) imports.push(match[1]);
  console.log(`  Imports found: ${imports.length}`);
  let broken = 0;
  for (const spec of imports) {
    const base = path.join(ROOT, spec.slice(2)); // strip @/
    const candidates = [base, base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")];
    const found = candidates.some(c => fs.existsSync(c) && fs.statSync(c).isFile());
    if (!found) {
      console.log(`  [ERR] Unresolved: ${spec}`);
      broken++;
      fail++;
    }
  }
  if (broken === 0) {
    console.log(`  [OK]  All ${imports.length} imports resolve`);
    pass++;
  }
}

console.log(`\n${"=".repeat(40)}`);
console.log(`RESULT: ${pass} OK, ${fail} FAIL`);
if (fail === 0) {
  console.log("SMOKE: PASS");
} else {
  console.log("SMOKE: FAIL");
  process.exit(1);
}
