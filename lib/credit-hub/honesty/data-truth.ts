/**
 * Data honesty taxonomy for Credit Hub redesign.
 * Every KPI/tile/panel must declare its truth level.
 *
 * Finance Cockpit v3.1 adds DERIVED, ESTIMATED, NONE for cockpit data_source mapping.
 */
export type DataTruthLevel =
  | "REAL"
  | "SANDBOX"
  | "DEMO"
  | "ROADMAP"
  | "DERIVED"
  | "ESTIMATED"
  | "NONE";

export const DATA_TRUTH_LABELS: Record<DataTruthLevel, string> = {
  REAL: "Real",
  SANDBOX: "Sandbox",
  DEMO: "Demo",
  ROADMAP: "Roadmap",
  DERIVED: "Derivado",
  ESTIMATED: "est.",
  NONE: "sin data",
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
    bg: "var(--ch-accent-soft)",
    color: "var(--ch-accent-text)",
    border: "var(--ch-accent-line)",
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
  ESTIMATED: {
    bg: "rgba(249, 115, 22, 0.14)",
    color: "#c2410c",
    border: "#f97316",
  },
  NONE: {
    bg: "rgba(107, 114, 128, 0.12)",
    color: "#6b7280",
    border: "#9ca3af",
  },
};
