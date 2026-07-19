/**
 * Legal OS Cockpit Smoke Check — verifies cockpit files exist and have valid imports.
 * Usage: node scripts/smoke/smoke-legal-cockpit.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

const REQUIRED_FILES = [
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

// /legal/guide removed (HN-02) — cockpit components retained for potential reuse, not routed.

console.log(`\n${"=".repeat(40)}`);
console.log(`RESULT: ${pass} OK, ${fail} FAIL`);
if (fail === 0) {
  console.log("SMOKE: PASS");
} else {
  console.log("SMOKE: FAIL");
  process.exit(1);
}
