import type { Proyecto } from "@/lib/projects/types";

/** Acentos Blueprint vivo — alinea con sidebar PencilRuler / dorado obra. */
export const BP_ACCENTS = {
  primary: "#f59e0b",
  glow: "#fbbf24",
  deep: "#b45309",
  grid: "rgba(245, 158, 11, 0.12)",
};

export function parseProjectsList(raw: unknown): Proyecto[] {
  if (Array.isArray(raw)) return raw as Proyecto[];
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const k of ["items", "data", "proyectos", "results"] as const) {
    const v = o[k];
    if (Array.isArray(v)) return v as Proyecto[];
  }
  return [];
}

/** Presupuesto de negocio: si el número es muy grande → millones USD aprox */
export function formatBudgetMillionsUsd(p: Proyecto): string {
  const n = p.preliminary_budget_minor_units;
  const cur = p.budget_currency?.trim() || "USD";
  if (n == null || Number.isNaN(Number(n))) return "—";
  const abs = Number(n);
  let millions = abs;
  if (abs >= 1_000_000) millions = abs / 1_000_000;
  else if (abs >= 10_000) millions = abs / 1_000_000;
  return `$${millions >= 100 ? millions.toFixed(0) : millions.toFixed(1)}M ${cur}`;
}

export function displayProjectName(row: Proyecto): string {
  const nombre = (row as Proyecto & { nombre?: string | null }).nombre;
  if (typeof nombre === "string" && nombre.trim()) return nombre.trim();
  return row.name ?? row.title ?? `Proyecto ${row.id.slice(0, 8)}`;
}

export function sumBudgetMinor(rows: Proyecto[]): number {
  let t = 0;
  for (const r of rows) {
    const n = r.preliminary_budget_minor_units;
    if (typeof n === "number" && !Number.isNaN(n)) t += n;
  }
  return t;
}

export function aggregateBudgetMillions(rows: Proyecto[]): string {
  const raw = sumBudgetMinor(rows);
  if (raw <= 0) return "—";
  const m = raw >= 1_000_000 ? raw / 1_000_000 : raw >= 1000 ? raw / 1000 / 1000 : raw / 1_000_000;
  return `$${m >= 10 ? Math.round(m) : Number(m.toFixed(1))}M`;
}

export function proyectoStateBadgeStatus(
  state: string | null | undefined,
): "active" | "inactive" | "warning" | "error" | "loading" {
  const s = (state ?? "").toUpperCase();
  if (s === "ACTIVE" || s === "FINANCE_REVIEW") return "active";
  if (s === "ON_HOLD") return "warning";
  if (s === "CERRADO") return "inactive";
  if (s === "INTAKE" || s === "SCOPING" || s === "PLANNING") return "loading";
  return "inactive";
}

export function countByProjectState(rows: Proyecto[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = typeof r.state === "string" && r.state.trim() ? r.state : "—";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function averageViability(rows: Proyecto[]): number | null {
  const vals = rows
    .map((r) => r.viability_score)
    .filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function coerceNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/,/g, ""));
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

/** Normaliza colecciones WBS/escenarios desde payload desconocido */
export function asObjectArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  if (!payload || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  const inner =
    (o.items as unknown) ??
    (o.tasks as unknown) ??
    (o.nodes as unknown) ??
    (o.phases as unknown) ??
    (o.data as unknown);
  return Array.isArray(inner) ? (inner.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
}
