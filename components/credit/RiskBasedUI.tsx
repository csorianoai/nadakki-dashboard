"use client";

import React from "react";
import { useRiskBased } from "@/hooks/useRiskBased";

export interface RiskBasedUIProps {
  applicationId: string;
  tenantId: string;
  /** Readiness 0–100 (same heuristic as calculateApplicationHealthScore). */
  score: number;
}

const TIER_THEME: Record<string, string> = {
  LOW_RISK: "border-emerald-400/35 bg-emerald-950/20 text-emerald-50",
  MEDIUM_RISK: "border-amber-400/35 bg-amber-950/25 text-amber-50",
  HIGH_RISK: "border-orange-500/35 bg-orange-950/35 text-orange-50",
  DECLINED: "border-rose-500/35 bg-rose-950/30 text-rose-50",
};

/**
 * Applies dealer-facing tone + playbook copy per META T6.5 risk lane.
 *
 * Bands:
 * - LOW_RISK (≥80): flujo corto tipo “single-screen”
 * - MEDIUM_RISK (60–79): estipulaciones + educación
 * - HIGH_RISK (40–59): guiar contraoferta / co-deudor / enganche / alternativas
 * - DECLINED (<40): motivos sintéticos, apelaciones, rutas de reintento controlado
 */
export function RiskBasedUI({ applicationId, tenantId, score }: RiskBasedUIProps): React.ReactElement {
  const { tier, title, summary, bullets, footer, explanationLine } = useRiskBased({
    score,
  });

  void applicationId;
  void tenantId;

  const badgeClass = `${TIER_THEME[tier]} inline-flex rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide`;

  return (
    <section
      className={`rounded-2xl border bg-gradient-to-br p-5 sm:p-6 ${
        tier === "LOW_RISK"
          ? "border-emerald-500/30 from-emerald-950/30 to-slate-950"
          : tier === "MEDIUM_RISK"
            ? "border-amber-500/35 from-amber-950/20 to-slate-950"
            : tier === "HIGH_RISK"
              ? "border-orange-500/30 from-orange-950/35 to-slate-950"
              : "border-rose-600/35 from-rose-950/30 to-slate-950"
      }`}
      data-testid="risk-based-ui-root"
      data-tier={tier}
      aria-labelledby="risk-tier-title"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Experiencia según salud expediente · T6.5
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={badgeClass} data-role="risk-badge">
          {tier.replace(/_/g, " ")}
        </span>
        <h2 id="risk-tier-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
      </div>
      <p className="mt-2 text-xs text-violet-200/90">{explanationLine}</p>
      <p className="mt-4 text-sm text-slate-200">{summary}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-100">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {footer ? <p className="mt-4 text-[11px] text-slate-400">{footer}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {tier !== "DECLINED" ? (
          <button
            type="button"
            className="min-h-[40px] rounded-lg border border-white/15 px-3 text-xs font-medium text-white hover:bg-white/5"
            data-testid="risk-action-primary"
          >
            Registrar decisión rápida
          </button>
        ) : null}
        <button
          type="button"
          className={`min-h-[40px] rounded-lg border px-3 text-xs font-medium hover:bg-white/5 ${
            tier === "DECLINED" ? "border-rose-500/35 text-rose-100" : "border-white/15 text-white"
          }`}
          data-testid="risk-action-secondary"
        >
          Exportar síntesis (mock)
        </button>
      </div>
    </section>
  );
}
