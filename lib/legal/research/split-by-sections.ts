/**
 * Splits senior `respuesta` markdown by canonical section headers from senior_prompt_builder.
 * Missing sections are omitted — never fabricate block content.
 */

export type SectionedResponse = {
  conclusion?: string;
  hechos?: string;
  analisis?: string;
  recomendacion?: string;
  limites?: string;
  /** Full markdown when no canonical headers are present (fallback). */
  fallbackDocument?: string;
  hasCanonicalHeaders: boolean;
};

type SectionKey = keyof Omit<SectionedResponse, "fallbackDocument" | "hasCanonicalHeaders">;

const SECTIONS: { key: SectionKey; titles: string[] }[] = [
  { key: "conclusion", titles: ["conclusión", "conclusion"] },
  { key: "hechos", titles: ["hechos y supuestos", "hechos y supuesto"] },
  { key: "analisis", titles: ["análisis normativo", "analisis normativo"] },
  { key: "recomendacion", titles: ["recomendación", "recomendacion"] },
  { key: "limites", titles: ["límites y advertencias", "limites y advertencias"] },
];

function normalizeHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchSectionTitle(heading: string): SectionKey | null {
  const h = normalizeHeading(heading);
  for (const section of SECTIONS) {
    if (section.titles.some((t) => h === t || h.startsWith(`${t} `))) {
      return section.key;
    }
  }
  return null;
}

/** Parses `| concepto | valor |` tables or leading `clave: valor` lines — never regex on prose. */
export function parseConclusionChips(sectionMd: string): { label: string; value: string }[] | null {
  const trimmed = sectionMd.trim();
  if (!trimmed) return null;

  const lines = trimmed.split("\n");
  const first = lines[0]?.trim() ?? "";

  if (first.startsWith("|") && first.includes("|")) {
    const rows = lines.filter((l) => l.trim().startsWith("|") && !/^\|\s*[-:]+\s*\|/.test(l.trim()));
    if (rows.length < 2) return null;
    const headerCells = rows[0]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (headerCells.length < 2) return null;
    const chips: { label: string; value: string }[] = [];
    for (const row of rows.slice(1)) {
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length >= 2) {
        chips.push({ label: cells[0], value: cells[1] });
      }
    }
    return chips.length > 0 ? chips : null;
  }

  const kvLines: { label: string; value: string }[] = [];
  for (const line of lines) {
    if (!line.trim()) break;
    const idx = line.indexOf(":");
    if (idx <= 0) break;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!label || !value) break;
    kvLines.push({ label, value });
  }
  return kvLines.length > 0 ? kvLines : null;
}

/** Strips structured chip prefix from conclusion body for markdown render. */
export function stripConclusionStructuredPrefix(sectionMd: string): string {
  const trimmed = sectionMd.trim();
  if (!trimmed) return trimmed;

  const lines = trimmed.split("\n");
  const first = lines[0]?.trim() ?? "";

  if (first.startsWith("|")) {
    let i = 0;
    while (i < lines.length && (lines[i]?.trim().startsWith("|") || lines[i]?.trim() === "")) {
      if (lines[i]?.trim().startsWith("|")) i++;
      else if (lines[i]?.trim() === "") {
        i++;
        break;
      } else break;
    }
    return lines.slice(i).join("\n").trim();
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]?.trim() ?? "";
    if (!line) break;
    if (line.includes(":") && line.indexOf(":") > 0) {
      i++;
      continue;
    }
    break;
  }
  if (i > 0 && i < lines.length) return lines.slice(i).join("\n").trim();
  if (i > 0 && i === lines.length) return "";
  return trimmed;
}

export function splitBySections(markdown: string): SectionedResponse {
  const text = markdown ?? "";
  if (!text.trim()) {
    return { hasCanonicalHeaders: false, fallbackDocument: text };
  }

  const headerRe = /^##\s+(.+?)\s*$/gm;
  const matches: { index: number; end: number; key: SectionKey; rawTitle: string }[] = [];
  let m: RegExpExecArray | null;

  while ((m = headerRe.exec(text)) !== null) {
    const key = matchSectionTitle(m[1] ?? "");
    if (key) {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        key,
        rawTitle: m[1] ?? "",
      });
    }
  }

  if (matches.length === 0) {
    return { hasCanonicalHeaders: false, fallbackDocument: text };
  }

  const result: SectionedResponse = { hasCanonicalHeaders: true };
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const body = text.slice(cur.end, next ? next.index : text.length).trim();
    if (body) {
      result[cur.key] = body;
    }
  }

  return result;
}
