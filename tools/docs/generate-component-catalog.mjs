/**
 * Appends Phase 8 primitive catalog sections to COMPONENTS.md (run once per refresh).
 * Usage: node tools/docs/generate-component-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const UI = path.join(ROOT, "components", "forge", "ui");
const LAYOUT = path.join(ROOT, "components", "forge", "layout");
const COMPONENTS = path.join(ROOT, "app", "(forge)", "credit-hub", "_design", "COMPONENTS.md");
const ASSETS = "./_assets/components";

function lineCount(p) {
  return fs.readFileSync(p, "utf8").split(/\r?\n/).length;
}

/** Pull first exported interface *Props block (heuristic). */
function extractPropsInterface(src) {
  const m = src.match(/export interface (\w+Props)\s*\{([^}]*)\}/s);
  if (!m) return null;
  const body = m[2]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"))
    .slice(0, 24)
    .join("\n");
  return { name: m[1], body };
}

function shotLinks(base, isLayout) {
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const map = {
    Button: ["button/variants-default.png", "button/variants-loading.png", "button/variants-disabled.png", "button/iconbutton.png", "button/focus-surfaces.png"],
    DataTable: [
      "datatable/density-comfortable-mode-data.png",
      "datatable/density-compact-mode-data.png",
      "datatable/sorted-asc.png",
      "datatable/bulk-action-bar.png",
      "datatable/empty-success-tone.png",
    ],
    CommandPalette: ["command-palette/open.png"],
  };
  const imgs = map[base];
  if (!imgs) {
    if (base === "Sidebar" || base === "Topbar") return [`layout/sidebar-topbar-kpi.png`];
    const sec = {
      Input: "form-controls",
      Select: "form-controls",
      Checkbox: "form-controls",
      Tabs: "tabs",
      Card: "cards-badges-empty",
      EmptyState: "cards-badges-empty",
      Badge: "cards-badges-empty",
      StatusPill: "cards-badges-empty",
      Skeleton: "skeleton-avatar",
      Avatar: "skeleton-avatar",
      EvidenceCard: "evidence-audit",
      AuditTimeline: "evidence-audit",
      Modal: "overlays",
      Drawer: "overlays",
      Toast: "overlays",
      ConsentCapture: "consent-capture",
    }[base];
    if (sec) return [`${sec}/section.png`];
    return [];
  }
  return imgs;
}

function sectionFor(base, relPath) {
  const full = path.join(ROOT, "components", "forge", relPath);
  const src = fs.readFileSync(full, "utf8");
  const lines = lineCount(full);
  const props = extractPropsInterface(src);
  const shots = shotLinks(base);
  const rel = `components/forge/${relPath.replace(/\\/g, "/")}`;
  const heading = base;
  let md = `\n## ${heading}\n\n`;
  md += `**File:** \`${rel}\` · **Lines:** ${lines}\n\n`;
  md += `**Purpose:** Forge design-system primitive \`${base}\` — see barrel export in \`components/forge/index.ts\`. `;
  md += `Legacy \`components/credit-hub/**\` is **out of scope** for this catalog (Phase 7.2 Case B).\n\n`;
  if (props) {
    md += `**Primary props interface:** \`${props.name}\`\n\n\`\`\`ts\n${props.body}\n\`\`\`\n\n`;
  } else {
    md += `**Props:** See source for \`export interface …Props\` and runtime props.\n\n`;
  }
  md += `### Variants & states (preview)\n\n`;
  md += `Captured from [\`/credit-hub/preview\`](../preview) — regenerate via \`npm run docs:components\`.\n\n`;
  if (shots.length) {
    for (const s of shots) {
      md += `![${base}](${ASSETS}/${s})\n\n`;
    }
  } else {
    md += `_No dedicated capture slice yet — use full preview section or add capture mapping in \`generate-component-catalog.mjs\`._\n\n`;
  }
  md += `### DO / DON'T (from Phase 5 polish)\n\n`;
  md += `- **DO:** compose with tokens from [\`TOKENS.md\`](./TOKENS.md); meet focus-ring / target-size patterns in this file’s earlier sections.\n`;
  md += `- **DON'T:** add tooltips; ship \`framer-motion\` on new surfaces; hardcode tenant marketing strings in primitives.\n\n`;
  md += `### Accessibility\n\n`;
  md += `- Keyboard: focus order follows DOM; interactive cells use native controls or \`role\` + key handlers where applicable.\n`;
  md += `- See **Lighthouse accessibility** section above for gate hygiene.\n\n`;
  md += `### Minimal example\n\n\`\`\`tsx\nimport { ${base === "Toast" ? "ForgeToaster, toast" : base} } from \"@/components/forge\";\n\`\`\`\n\n`;
  md += `### Related\n\n`;
  md += `- [\`POLISH.md\`](./POLISH.md) Phase 5 Items 2–5 · [\`MIGRATION.md\`](./MIGRATION.md)\n\n`;
  md += `### Compose vs extend\n\n`;
  md += `- **Compose** in page/feature modules under \`components/forge/credit-hub/**\`.\n`;
  md += `- **Extend** the primitive only when a new variant is reusable across personas (then update preview + this doc).\n\n`;
  md += `---\n`;
  return md;
}

function main() {
  const uiFiles = fs.readdirSync(UI).filter((f) => f.endsWith(".tsx"));
  const layoutFiles = fs.readdirSync(LAYOUT).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  let catalog = `\n\n<!-- PHASE8_PRIMITIVE_CATALOG_START -->\n\n`;
  catalog += `> **Primitive catalog (scaffold):** Regenerate with \`node tools/docs/generate-component-catalog.mjs\`. Keep each \`## Name\` heading aligned with the source file basename for \`docs:validate --strict\`.\n\n`;
  for (const f of uiFiles.sort()) {
    catalog += sectionFor(path.basename(f, ".tsx"), path.join("ui", f));
  }
  for (const f of layoutFiles.sort()) {
    catalog += sectionFor(path.basename(f, path.extname(f)), path.join("layout", f));
  }
  catalog += `\n<!-- PHASE8_PRIMITIVE_CATALOG_END -->\n`;

  let doc = fs.readFileSync(COMPONENTS, "utf8");
  const START = "<!-- PHASE8_PRIMITIVE_CATALOG_START -->";
  const END = "<!-- PHASE8_PRIMITIVE_CATALOG_END -->";
  if (doc.includes(START) && doc.includes(END)) {
    doc = doc.slice(0, doc.indexOf(START)) + catalog.trim() + "\n" + doc.slice(doc.indexOf(END) + END.length);
  } else {
    doc = doc.trimEnd() + "\n" + catalog;
  }
  fs.writeFileSync(COMPONENTS, doc, "utf8");
  console.log("Updated COMPONENTS.md primitive catalog.");
}

main();
