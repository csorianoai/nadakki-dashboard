/**
 * Regenerate the auto-generated token tables in TOKENS.md from tokens.css.
 * Usage: node tools/docs/build-tokens-md.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const TOKENS_CSS = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "tokens.css");
const TOKENS_MD = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "TOKENS.md");

const MARK_START = "<!-- AUTOGEN:TOKENS START -->";
const MARK_END = "<!-- AUTOGEN:TOKENS END -->";

function extractForgeAppBlock(css) {
  const start = css.indexOf(".forge-app {");
  if (start === -1) throw new Error("tokens.css: missing .forge-app { block");
  let i = start + ".forge-app {".length;
  let depth = 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  return css.slice(start + ".forge-app {".length, i - 1);
}

function parseVars(block) {
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    const name = m[1];
    if (!name.startsWith("forge-")) continue;
    out.push({ css: `--${name}`, name, value: m[2].trim() });
  }
  return out;
}

function tailwindHint(cssName) {
  const n = cssName.replace(/^--forge-/, "");
  const parts = n.split("-");
  const family = parts[0];
  const rest = parts.slice(1).join("-");
  if (!family) return "`tailwind.config.js` theme.extend";
  if (family === "brand" && /^\d+$/.test(rest))
    return `\`text-forgeBrand-${rest}\`, \`bg-forgeBrand-${rest}\`, \`border-forgeBrand-${rest}\``;
  if (family === "ink" && /^\d+$/.test(rest)) return `\`text-forgeInk-${rest}\`, \`border-forgeInk-${rest}\``;
  if (family === "surface" && rest) return `\`bg-forgeSurface-${rest}\``;
  if (["success", "warning", "danger", "info", "neutral"].includes(family) && /^\d+$/.test(rest))
    return `\`text-forge${family.charAt(0).toUpperCase() + family.slice(1)}-${rest}\` (semantic)`;
  if (family === "viz" && /^\d+$/.test(rest)) return `\`fill-forgeViz-${rest}\` / chart tokens`;
  if (family === "accent" && rest) return `\`text-forgeAccent-${rest}\``;
  if (family === "text" && rest) return `font-size: \`text-[length:var(--forge-text-${rest})]\` pattern`;
  if (family === "space" && rest) return `spacing scale → Tailwind \`forge\` spacing plugin or arbitrary \`p-[length:var(--forge-space-${rest})]\``;
  if (family === "radius" && rest) return `\`rounded-forge-${rest}\` (see \`tailwind.config.js\`)`;
  if (family === "shadow" && rest) return `\`shadow-forge-${rest}\` if mapped; else raw \`var()\``;
  if (family === "border" && rest) return `border utilities + \`var()\``;
  if (family === "font") return `next/font → \`font-sans\` / \`font-display\` / \`font-forgeMono\``;
  if (family === "bp") return `reference only (media queries in CSS)`;
  return "`tailwind.config.js` theme.extend";
}

function groupVars(rows) {
  const groups = new Map();
  for (const r of rows) {
    const sub = r.name.replace(/^forge-/, "");
    const key = sub.split("-")[0] || "misc";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildMarkdown(rows) {
  const iso = new Date().toISOString().slice(0, 10);
  const grouped = groupVars(rows);
  let md = `## Auto-generated reference (\`.forge-app\` defaults)\n\n`;
  md += `**Generated from \`tokens.css\` on ${iso}.** Do not edit this section by hand. Regenerate with \`npm run docs:tokens\`.\n\n`;
  md += `| CSS variable | Value (source) | Typical Tailwind / usage |\n`;
  md += `|--------------|----------------|---------------------------|\n`;
  for (const [, list] of grouped) {
    for (const r of list) {
      const safeVal = r.value.replace(/\|/g, "\\|").replace(/\n/g, " ");
      md += `| \`${r.css}\` | ${safeVal} | ${tailwindHint(r.css)} |\n`;
    }
  }
  md += `\n### When NOT to use these rows alone\n\n`;
  md += `Tenant overrides (e.g. \`[data-tenant="credicefi"]\`) and dormant dealer blocks **redefine** some of the same names — read the source \`tokens.css\` for override sections. Legacy dual-var colors live in \`tailwind.config.js\` + \`styles/forge-tokens.css\` per Phase 7.2 Case B.\n`;
  return md;
}

function main() {
  const css = fs.readFileSync(TOKENS_CSS, "utf8");
  const block = extractForgeAppBlock(css);
  const rows = parseVars(block);
  const generated = buildMarkdown(rows);
  let md = fs.readFileSync(TOKENS_MD, "utf8");
  if (!md.includes(MARK_START) || !md.includes(MARK_END)) {
    throw new Error(
      `TOKENS.md must contain ${MARK_START} and ${MARK_END} (add markers once; this script replaces the region between them).`
    );
  }
  const before = md.slice(0, md.indexOf(MARK_START) + MARK_START.length);
  const after = md.slice(md.indexOf(MARK_END));
  md = `${before}\n\n${generated}\n\n${after}`;
  fs.writeFileSync(TOKENS_MD, md, "utf8");
  console.log("Wrote", TOKENS_MD, `(${rows.length} variables from .forge-app block)`);
}

main();
