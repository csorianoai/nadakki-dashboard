/**
 * Data honesty taxonomy for Credit Hub redesign.
 * Every KPI/tile/panel must declare its truth level.
 *
 * Finance Cockpit v3.5: 7 cockpit data_source states mapped to badge levels.
 */
export type DataTruthLevel =
  | "REAL"
  | "SANDBOX"
  | "DEMO"
  | "ROADMAP"
  | "DERIVED"
  | "PARTIAL"
  | "NONE"
  | "STALE"
  | "ERROR";

export const DATA_TRUTH_LABELS: Record<DataTruthLevel, string> = {
  REAL: "Real",
  SANDBOX: "Sandbox",
  DEMO: "Demo",
  ROADMAP: "Roadmap",
  DERIVED: "Derivado",
  PARTIAL: "parcial",
  NONE: "sin data",
  STALE: "obsoleto",
  ERROR: "error",
};

export const DATA_TRUTH_STYLES: Record<
  DataTruthLevel,
  { bg: string; color: string; border: string }
> = {
  REAL: {
    bg: "var(--ch-success-soft)",
    color: "var(--ch-success-text)",
    border: "var(--ch-success)",
  },
  SANDBOX: {
    bg: "var(--ch-info-soft)",
    color: "var(--ch-info-text)",
    border: "var(--ch-info)",
  },
  DEMO: {
    bg: "rgba(234, 179, 8, 0.14)",
    color: "#a16207",
    border: "#eab308",
  },
  ROADMAP: {
    bg: "var(--ch-surface-3)",
    color: "var(--ch-text-3)",
    border: "var(--ch-line-2)",
  },
  DERIVED: {
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#1d4ed8",
    border: "#3b82f6",
  },
  PARTIAL: {
    bg: "rgba(249, 115, 22, 0.14)",
    color: "#c2410c",
    border: "#f97316",
  },
  NONE: {
    bg: "rgba(107, 114, 128, 0.12)",
    color: "#6b7280",
    border: "#9ca3af",
  },
  STALE: {
    bg: "rgba(139, 92, 246, 0.14)",
    color: "#6d28d9",
    border: "#8b5cf6",
  },
  ERROR: {
    bg: "rgba(239, 68, 68, 0.14)",
    color: "#b91c1c",
    border: "#ef4444",
  },
};
