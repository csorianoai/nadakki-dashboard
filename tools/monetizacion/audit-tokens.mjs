/**
 * Phase 0.5 — Monetización design token + layout color audit.
 *
 * Pass 1: §1 HANDOFF hex vs tokens.css custom properties.
 * Pass 2: layout CSS must not contain raw #rrggbb or rgba( — only var(--fm-*).
 *
 * Usage: node tools/monetizacion/audit-tokens.mjs [path/to/tokens.css]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const tokensPath = resolve(process.argv[2] ?? "components/credit-hub/monetizacion/shell/tokens.css");
const css = readFileSync(tokensPath, "utf8");

const MONETIZACION_CSS_ROOT = join(repoRoot, "components/credit-hub/monetizacion");
const TOKENS_BASENAME = "tokens.css";

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

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGBA_RE = /rgba\s*\(/gi;

function collectCssFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectCssFiles(full, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".css") && entry.name !== TOKENS_BASENAME) {
      acc.push(full);
    }
  }
  return acc;
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function auditLayoutCss() {
  let violations = 0;
  let scanned = 0;

  console.log("\n=== Layout CSS raw color audit (no #hex, no rgba) ===");

  if (!statSync(MONETIZACION_CSS_ROOT, { throwIfNoEntry: false })?.isDirectory()) {
    console.log("SKIP     monetizacion CSS root not found");
    return 0;
  }

  const layoutFiles = collectCssFiles(MONETIZACION_CSS_ROOT).sort();

  if (layoutFiles.length === 0) {
    console.log("OK       no layout CSS files found (tokens-only)");
    return 0;
  }

  for (const file of layoutFiles) {
    scanned++;
    const rel = relative(repoRoot, file).replace(/\\/g, "/");
    const content = stripCssComments(readFileSync(file, "utf8"));
    const lines = content.split("\n");

    const hexHits = [];
    const rgbaHits = [];

    lines.forEach((line, idx) => {
      for (const match of line.matchAll(HEX_RE)) {
        hexHits.push({ line: idx + 1, value: match[0], text: line.trim() });
      }
      for (const match of line.matchAll(RGBA_RE)) {
        rgbaHits.push({ line: idx + 1, value: match[0], text: line.trim() });
      }
    });

    if (hexHits.length === 0 && rgbaHits.length === 0) {
      console.log(`OK       ${rel}`);
      continue;
    }

    console.log(`DRIFT    ${rel}`);
    for (const hit of [...hexHits, ...rgbaHits]) {
      console.log(`         L${hit.line}: ${hit.text}`);
      violations++;
    }
  }

  console.log(`\nLayout files scanned: ${scanned}`);
  console.log(`Layout raw color violations: ${violations}`);
  return violations;
}

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

const layoutViolations = auditLayoutCss();

console.log(`\n§1 token diffs: ${diffs}`);
console.log(`Layout raw color violations: ${layoutViolations}`);
console.log(`Total failures: ${diffs + layoutViolations}`);
process.exit(diffs + layoutViolations === 0 ? 0 : 1);
