import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueSortKey } from "@/lib/credit-hub/types/bank-views";

export const PRIORITY_RANK: Record<BankQueueItem["priority"], number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

export const PRIORITY_STYLE: Record<BankQueueItem["priority"], { c: string; bg: string; bd: string }> = {
  ALTA: { c: "var(--ch-accent-text)", bg: "var(--ch-accent-soft)", bd: "var(--ch-accent-line)" },
  MEDIA: { c: "var(--ch-persona-text)", bg: "var(--ch-persona-soft)", bd: "color-mix(in oklab, var(--ch-persona) 30%, transparent)" },
  BAJA: { c: "var(--ch-text-3)", bg: "var(--ch-surface-3)", bd: "var(--ch-line-2)" },
};

export const STATE_LABEL: Record<string, [string, "warning" | "info" | "success" | "neutral"]> = {
  submitted: ["Pendiente", "warning"],
  SUBMITTED: ["Pendiente", "warning"],
  claimed: ["En revisión", "info"],
  CLAIMED: ["En revisión", "info"],
  decided: ["Decidida", "success"],
  DECIDED: ["Decidida", "success"],
  expired: ["Expirada", "neutral"],
};

export function chRelTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const m = Math.round((now.getTime() - d.getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return `hace ${days} d`;
}

export function sortQueueItems(items: BankQueueItem[], sortKey: BankQueueSortKey, sortDir: "asc" | "desc"): BankQueueItem[] {
  const copy = [...items];
  copy.sort((x, y) => {
    let d = 0;
    if (sortKey === "priority") d = PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.score - x.score;
    else if (sortKey === "applicant_name") d = (x.applicant_name ?? "").localeCompare(y.applicant_name ?? "");
    else if (sortKey === "created_at") d = new Date(y.created_at ?? 0).getTime() - new Date(x.created_at ?? 0).getTime();
    else d = Number(x[sortKey as keyof BankQueueItem] ?? 0) - Number(y[sortKey as keyof BankQueueItem] ?? 0);
    return sortDir === "asc" ? d : -d;
  });
  return copy;
}

export function pendingQueueCount(analytics?: { applications_by_status: Record<string, number> }, queue?: BankQueueItem[]): number {
  if (analytics?.applications_by_status) {
    const s = analytics.applications_by_status;
    return (s.submitted ?? s.SUBMITTED ?? 0) + (s.claimed ?? s.CLAIMED ?? 0);
  }
  return queue?.filter((a) => !a.bank_decision && a.state !== "decided" && a.state !== "DECIDED").length ?? 0;
}

export const SCORE_BANDS = [
  { range: "300-579", label: "Crítico", color: "var(--ch-risk-critical)" },
  { range: "580-669", label: "Alto", color: "var(--ch-risk-high)" },
  { range: "670-739", label: "Medio", color: "var(--ch-risk-medium)" },
  { range: "740-799", label: "Bajo", color: "var(--ch-risk-low)" },
  { range: "800-850", label: "Muy bajo", color: "var(--ch-risk-low)" },
] as const;

export const BANK_NAV_ROUTES: Record<string, string> = {
  panel: "/credit-hub/bank",
  bandeja: "/credit-hub/bank/applications",
  escalaciones: "/credit-hub/bank/escalations",
  analitica: "/credit-hub/bank/analytics",
  auditoria: "/credit-hub/bank/audit",
  cumplimiento: "/credit-hub/bank/compliance",
};

export function pathnameToBankNavId(pathname: string): string {
  if (pathname.includes("/bank/applications")) return "bandeja";
  if (pathname.includes("/bank/escalations")) return "escalaciones";
  if (pathname.includes("/bank/analytics")) return "analitica";
  if (pathname.includes("/bank/audit")) return "auditoria";
  if (pathname.includes("/bank/compliance")) return "cumplimiento";
  return "panel";
}

export function bankTrailForPath(pathname: string): string[] {
  if (pathname.includes("/applications/") && !pathname.endsWith("/applications")) return ["Credit Hub", "Bandeja", "Detalle"];
  if (pathname.includes("/applications")) return ["Credit Hub", "Bandeja"];
  if (pathname.includes("/analytics")) return ["Credit Hub", "Analítica"];
  if (pathname.includes("/audit")) return ["Credit Hub", "Auditoría"];
  if (pathname.includes("/compliance")) return ["Credit Hub", "Cumplimiento"];
  return ["Credit Hub", "Panel"];
}

const COMPLIANCE_HERO_BY_JURISDICTION: Record<string, string> = {
  DO: "Perfil Ley 172-13 (República Dominicana)",
  MX: "Perfil CNBV (México)",
  CO: "Perfil SFC (Colombia)",
};

/** Maps tenant country_code (no `jurisdiction` field on TenantBankingConfig) to compliance hero title. */
export function complianceHeroTitle(jurisdictionCode: string | undefined, institutionName: string): string {
  const code = jurisdictionCode?.trim().toUpperCase();
  if (code && COMPLIANCE_HERO_BY_JURISDICTION[code]) {
    return COMPLIANCE_HERO_BY_JURISDICTION[code]!;
  }
  return `Perfil Regulatorio — ${institutionName}`;
}

import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";

export interface DefaultPredictionDisplay {
  percentLabel: string;
  isExtreme: boolean;
  extremeTooltip: string;
}

export interface DefaultPredictionTrust {
  level: DataTruthLevel;
  contextNote: string;
}

/**
 * Backend returns predicted_default_rate as 0–1 decimal (bank_analytics.py).
 * Missing analysis scores are counted as 0, inflating rate toward 100%.
 */
export function formatDefaultPredictionDisplay(
  predictedDefaultRate: number,
  predictedDefaultCount: number,
  totalApplications: number,
): DefaultPredictionDisplay {
  const rate = predictedDefaultRate > 1 ? predictedDefaultRate / 100 : predictedDefaultRate;
  const percentLabel = (rate * 100).toFixed(1);
  const isExtreme =
    rate >= 0.95 ||
    (totalApplications > 0 && predictedDefaultCount >= totalApplications);

  return {
    percentLabel,
    isExtreme,
    extremeTooltip:
      "Predicción extrema — requiere revisión del motor (score ausente se cuenta como 0 en backend)",
  };
}

/**
 * Default prediction hits a REAL analytics endpoint, but `score < 600` treats
 * missing scores as 0 — on nadakki-demo / E2E payloads without analysis.score
 * the rate inflates to ~100% (same class of artifact as inflated approval rates).
 */
export function classifyDefaultPredictionTrust(
  display: DefaultPredictionDisplay,
  predictedDefaultCount: number,
  totalApplications: number,
): DefaultPredictionTrust {
  if (display.isExtreme) {
    return {
      level: "DEMO",
      contextNote:
        "Artefacto demo: sin score en payload todo cuenta como riesgo — no usar para decisiones.",
    };
  }
  if (totalApplications > 0 && predictedDefaultCount / totalApplications >= 0.5) {
    return {
      level: "DEMO",
      contextNote: "Tasa elevada sobre cartera demo — validar scores antes de confiar en el KPI.",
    };
  }
  return {
    level: "REAL",
    contextNote: "Regla heurística score < 600 sobre muestra del dashboard (máx. 500 apps).",
  };
}
