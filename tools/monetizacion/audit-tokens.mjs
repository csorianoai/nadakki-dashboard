/**
 * Phase 0.5 — diff §1 HANDOFF hex vs tokens.css custom properties.
 * Usage: node tools/monetizacion/audit-tokens.mjs [path/to/tokens.css]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tokensPath = resolve(process.argv[2] ?? "components/credit-hub/monetizacion/shell/tokens.css");
const css = readFileSync(tokensPath, "utf8");

/** HANDOFF §1 canonical map (--fm-* scoped names). */
const EXPECTED = {
  "--fm-bg": "#0c1316",
  "--fm-panel": "#131d21",
  "--fm-panel2": "#0f181c",
  "--fm-line": "#22323a",
  "--fm-ink": "#e8f0f2",
  "--fm-ink-soft": "#aebcbf",
  "--fm-sub": "#74908f",
  "--fm-green": "#2bd073",
  "--fm-green-ink": "#06160f",
  "--fm-amber": "#f4b740",
  "--fm-red": "#f06150",
  "--fm-blue": "#54a8ec",
  "--fm-violet": "#a98bf0",
};

const DEMO_RULES = [
  {
    name: "demo banner background gradient",
    test: (s) =>
      /repeating-linear-gradient\(135deg,\s*rgba\(244,183,64,\.08\)/.test(s.replace(/\s+/g, "")),
  },
  {
    name: "demo banner border uses --fm-line",
    test: (s) => /\.fm-demo-banner[\s\S]*border-bottom:\s*1px\s+solid\s+var\(--fm-line\)/.test(s),
  },
  {
    name: "demo banner strong color #f7cd7a",
    test: (s) => /--fm-amber-strong:\s*#f7cd7a/i.test(s) || /\.fm-demo-banner[\s\S]*#f7cd7a/i.test(s),
  },
];

const varRe = /(--fm-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
const found = new Map();
let m;
while ((m = varRe.exec(css)) !== null) {
  found.set(m[1], m[2].trim());
}

let diffs = 0;
console.log("=== §1 CSS variable diff ===");
for (const [key, expected] of Object.entries(EXPECTED)) {
  const actual = found.get(key);
  if (!actual) {
    console.log(`MISSING  ${key}  (expected ${expected})`);
    diffs++;
    continue;
  }
  const norm = actual.toLowerCase().replace(/\s+/g, "");
  const expNorm = expected.toLowerCase();
  if (norm !== expNorm) {
    console.log(`DRIFT    ${key}`);
    console.log(`         expected: ${expected}`);
    console.log(`         actual:   ${actual}`);
    diffs++;
  } else {
    console.log(`OK       ${key} = ${expected}`);
  }
}

console.log("\n=== §1 demo banner rules ===");
for (const rule of DEMO_RULES) {
  const ok = rule.test(css);
  console.log(`${ok ? "OK" : "DRIFT"}   ${rule.name}`);
  if (!ok) diffs++;
}

console.log(`\nTotal diffs: ${diffs}`);
process.exit(diffs === 0 ? 0 : 1);
