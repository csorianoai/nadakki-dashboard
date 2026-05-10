/**
 * Regenerate TOKENS.md autogen region from tokens.css + tailwind.config.js hints.
 * Idempotent: stable ordering. Usage: node tools/docs/build-tokens-md.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const TOKENS_CSS = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "tokens.css");
const TAILWIND = path.join(ROOT, "tailwind.config.js");
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

/** Split block into sections by `/* ─── NAME` comments */
function parseSections(block) {
  const lines = block.split(/\r?\n/);
  const sections = [];
  let current = { title: "BASE", vars: [] };
  const sectionRe = /\/\*\s*─+\s*(.+?)\s*─+\s*\*\//;
  for (const line of lines) {
    const sm = line.match(sectionRe);
    if (sm) {
      if (current.vars.length || current.title !== "BASE") sections.push(current);
      current = { title: sm[1].trim().split("(")[0].trim().toUpperCase(), vars: [] };
      continue;
    }
    const vm = line.match(/--([\w-]+)\s*:\s*([^;]+);/);
    if (vm && vm[1].startsWith("forge-")) {
      current.vars.push({ name: vm[1], value: vm[2].trim() });
    }
  }
  sections.push(current);
  return sections;
}

function svgSwatch(value) {
  const hex = value.match(/#([0-9a-fA-F]{3,8})\b/);
  if (!hex) return "—";
  const c = hex[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="${c}"/></svg>`;
}

function tailwindHint(name) {
  const n = name.replace(/^forge-/, "");
  const [family, ...restParts] = n.split("-");
  const rest = restParts.join("-");
  if (family === "brand" && /^\d+$/.test(rest))
    return `\`text-forgeBrand-${rest}\` / \`bg-forgeBrand-${rest}\` / \`border-forgeBrand-${rest}\``;
  if (family === "gray" && /^\d+$/.test(rest))
    return `\`text-forgeGray-${rest}\` / \`border-forgeGray-${rest}\``;
  if (family === "surface" && rest) return `\`bg-forgeSurface-${rest}\``;
  if (["success", "warning", "danger", "info", "neutral"].includes(family) && /^\d+$/.test(rest))
    return `\`text-forge${family[0].toUpperCase() + family.slice(1)}-${rest}\``;
  if (family === "viz" && /^\d+$/.test(rest)) return `\`fill-forgeViz-${rest}\``;
  if (family === "accent" && rest) return `\`text-forgeAccent-${rest}\``;
  if (family === "text" && rest) return `\`text-[length:var(--forge-text-${rest})]\``;
  if (family === "space" && rest) return `\`p-[length:var(--forge-space-${rest})]\` (arbitrary)`;
  if (family === "radius" && rest) return `\`rounded-forge-${rest}\``;
  if (family === "shadow" && rest) return `\`shadow-forge-${rest}\` (if mapped)`;
  if (family === "border" && rest) return "border + `var()`";
  if (family === "font") return "`font-sans` / `font-display` / `font-forgeMono`";
  if (family === "bp") return "reference breakpoints (CSS only)";
  if (family === "weight" || family === "leading" || family === "tracking" || family === "ease" || family === "duration")
    return "composition / motion tokens";
  return "`tailwind.config.js`";
}

function readTailwindSnippet() {
  if (!fs.existsSync(TAILWIND)) return "_tailwind.config.js not found_";
  const t = fs.readFileSync(TAILWIND, "utf8");
  const m = t.match(/forgeBrand:\s*\{[^}]+\}/s);
  return m ? `\`${m[0].slice(0, 400)}…\`` : "(see `tailwind.config.js` theme.extend.colors)";
}

function buildMarkdown(sections) {
  const iso = new Date().toISOString().slice(0, 10);
  let md = `## Auto-generated token reference\n\n`;
  md += `**Generated from \`tokens.css\` on ${iso}.** Do not edit this block by hand. Regenerate: \`npm run docs:tokens\`.\n\n`;
  md += `### Tailwind bridge (excerpt)\n\n`;
  md += readTailwindSnippet();
  md += `\n\n### BEFORE / AFTER (migration)\n\n`;
  md += `| BEFORE (legacy) | AFTER (v3.2) |\n|-----------------|-------------|\n`;
  md += `| \`bg-forge-bg\` on new bank surfaces | \`bg-forgeSurface-page\` / \`bg-forgeSurface-card\` |\n`;
  md += `| Arbitrary hex in JSX | \`text-forgeBrand-600\` / chart \`fill-forgeViz-*\` |\n`;
  md += `| \`rounded-2xl\` on cards | \`rounded-forge-lg\` (max 8px policy) |\n\n`;

  const sorted = [...sections].sort((a, b) => a.title.localeCompare(b.title));
  for (const sec of sorted) {
    const vars = [...sec.vars].sort((a, b) => a.name.localeCompare(b.name));
    if (!vars.length) continue;
    md += `### ${sec.title}\n\n`;
    md += `| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |\n`;
    md += `|--------|----------|-------|--------------------|-------------|----------|\n`;
    for (const v of vars) {
      const sw = svgSwatch(v.value).replace(/\|/g, "\\|");
      const safeVal = v.value.replace(/\|/g, "\\|").replace(/\n/g, " ");
      const tw = tailwindHint(v.name).replace(/\|/g, "\\|");
      md += `| ${sw} | \`--${v.name}\` | ${safeVal} | ${tw} | Semantic usage for **${sec.title}** group. | Outside \`.forge-app\` without legacy fallbacks. |\n`;
    }
    md += "\n";
  }
  md += `### Notes\n\n`;
  md += `- Tenant overrides and dormant dealer blocks live **outside** this autogen slice — see source \`tokens.css\`.\n`;
  md += `- Phase 7.2 Case B: legacy \`styles/forge-tokens.css\` + Tailwind PERMANENT ALIASES remain until \`components/credit-hub/**\` migrates.\n`;
  return md;
}

function main() {
  const css = fs.readFileSync(TOKENS_CSS, "utf8");
  const block = extractForgeAppBlock(css);
  const sections = parseSections(block);
  const generated = buildMarkdown(sections);
  let md = fs.readFileSync(TOKENS_MD, "utf8");
  if (!md.includes(MARK_START) || !md.includes(MARK_END)) {
    throw new Error(`TOKENS.md must contain ${MARK_START} and ${MARK_END}`);
  }
  const before = md.slice(0, md.indexOf(MARK_START) + MARK_START.length);
  const after = md.slice(md.indexOf(MARK_END));
  md = `${before}\n\n${generated}\n\n${after}`;
  fs.writeFileSync(TOKENS_MD, md, "utf8");
  const n = sections.reduce((a, s) => a + s.vars.length, 0);
  console.log("Wrote TOKENS.md autogen:", n, "variables,", sections.length, "raw sections");
}

main();
