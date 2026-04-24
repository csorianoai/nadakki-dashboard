import type { ParsedAgentRegistrySummary } from "@/types/agent-registry";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** Prefer nested `data` when present (common API envelope). */
export function unwrapSummaryPayload(json: unknown): Record<string, unknown> | null {
  const top = asRecord(json);
  if (!top) return null;
  const data = top.data;
  const inner = asRecord(data);
  if (inner) return inner;
  return top;
}

function num(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

/**
 * Parses registry summary JSON into a stable shape.
 * Prefers `executable_agents` for the headline count; falls back to `official_total`.
 * Returns null if no usable count field exists.
 */
export function parseAgentRegistrySummary(json: unknown): ParsedAgentRegistrySummary | null {
  const o = unwrapSummaryPayload(json);
  if (!o) return null;

  const executable = num(o, [
    "executable_agents",
    "executableAgents",
    "executable",
    "executable_count",
    "executableCount",
  ]);
  const official = num(o, ["official_total", "officialTotal", "official", "official_count"]);

  let displayCount: number;
  let countKind: ParsedAgentRegistrySummary["countKind"];
  if (executable !== undefined) {
    displayCount = executable;
    countKind = "executable";
  } else if (official !== undefined) {
    displayCount = official;
    countKind = "official";
  } else {
    return null;
  }

  const surface = num(o, [
    "total_declared_surface",
    "totalDeclaredSurface",
    "declared_surface_total",
    "declaredSurfaceTotal",
    "surface_total",
    "surfaceTotal",
  ]);

  return {
    displayCount,
    countKind,
    live: num(o, ["live", "live_agents", "liveAgents"]),
    feature_flagged: num(o, ["feature_flagged", "featureFlagged", "flagged", "feature_flagged_count"]),
    duplicate: num(o, ["duplicate", "duplicates", "duplicate_agents", "duplicateAgents"]),
    hidden: num(o, ["hidden", "hidden_agents", "hiddenAgents"]),
    broken: num(o, ["broken", "broken_agents", "brokenAgents"]),
    totalDeclaredSurface: surface,
  };
}

/** Multiline tooltip for accessibility (title) or native tooltip. */
export function buildAgentRegistryTooltip(s: ParsedAgentRegistrySummary): string {
  const lines: string[] = [];
  const headline =
    s.countKind === "executable"
      ? `${s.displayCount} executable agents`
      : `${s.displayCount} official total`;
  lines.push(headline);
  lines.push("");
  const add = (label: string, v?: number) => {
    if (v !== undefined) lines.push(`${label}: ${v}`);
  };
  add("live", s.live);
  add("feature_flagged", s.feature_flagged);
  add("duplicate", s.duplicate);
  add("hidden", s.hidden);
  add("broken", s.broken);
  add("total declared surface", s.totalDeclaredSurface);
  return lines.join("\n");
}
