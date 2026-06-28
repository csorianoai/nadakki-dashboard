/**
 * Data honesty taxonomy for Credit Hub redesign.
 * Every KPI/tile/panel must declare its truth level.
 */
export type DataTruthLevel = "REAL" | "SANDBOX" | "DEMO" | "ROADMAP";

export const DATA_TRUTH_LABELS: Record<DataTruthLevel, string> = {
  REAL: "Real",
  SANDBOX: "Sandbox",
  DEMO: "Demo",
  ROADMAP: "Roadmap",
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
};
