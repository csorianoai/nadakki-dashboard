"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import type { BankRankingRow } from "@/lib/credit-hub/types/analytics";
import { AreaChart } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { AlertCard } from "@/components/credit-hub/elite/AlertCard";
import { humanizeApplicant, shortFolio } from "@/lib/credit-hub/honesty/humanize-applicant";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { lenderDisplayName } from "@/lib/credit-hub/dealer/lender-display";

export function DealerTrendsAlerts({
  applications,
  currency,
  approvalRate,
  pipelineAmountLabel,
  banks,
}: {
  applications: CreditApplication[];
  currency: string;
  approvalRate?: number | null;
  pipelineAmountLabel: string;
  banks?: BankRankingRow[];
}) {
  const approvalSeries = useMemo(() => {
    const base = approvalRate != null ? approvalRate * 100 : 67;
    return [base - 4, base - 2, base - 1, base, base + 1, base, base];
  }, [approvalRate]);

  const pendingOffers = applications.filter((a) => ["offered", "counter_offer"].includes(a.status));
  const drafts = applications.filter((a) => a.status === "draft").length;

  const alerts = useMemo(() => {
    const list: { severity: "high" | "medium" | "low"; title: string; body: string; href?: string }[] = [];
    if (pendingOffers[0]) {
      const h = humanizeApplicant(pendingOffers[0], currency);
      list.push({
        severity: "high",
        title: "Oferta por expirar pronto",
        body: `${shortFolio(pendingOffers[0].application_id)} · ${h.primaryLabel} — revisa comparador`,
        href: dealerDetailHref(pendingOffers[0].application_id),
      });
    }
    list.push({
      severity: "medium",
      title: "Documentos solicitados",
      body: "Bancos esperan comprobantes en solicitudes activas",
    });
    list.push({
      severity: "medium",
      title: "Meta de volumen en riesgo",
      body: "67% alcanzado con 8 días restantes (objetivos DEMO)",
    });
    if (drafts > 0) {
      list.push({
        severity: "low",
        title: `${drafts} borradores sin enviar`,
        body: "Envíalos a bancos para activar la subasta",
        href: "/credit-hub/dealer/applications/new/applicant",
      });
    }
    return list;
  }, [pendingOffers, currency, drafts]);

  return (
    <section data-testid="dealer-trends-alerts" className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 mb-[26px]">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="ch-eyebrow">TENDENCIAS</span>
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
            Desempeño en el tiempo
          </h2>
          <DataTruthBadge level="DEMO" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="ch-card p-4">
            <div className="ch-card-title mb-1">Tasa de aprobación {approvalRate != null ? `${Math.round(approvalRate * 100)}%` : "—"}</div>
            <div className="ch-card-sub mb-3">Serie diaria ilustrativa</div>
            <AreaChart data={approvalSeries} color="var(--ch-success)" />
          </div>
          <div className="ch-card p-4">
            <div className="ch-card-title mb-1">Valor del pipeline {pipelineAmountLabel}</div>
            <div className="ch-card-sub mb-3">Mensual · en evaluación</div>
            <AreaChart data={[18, 20, 22, 21, 24, 24.6]} color="var(--ch-warning)" />
          </div>
        </div>
        <div className="ch-card p-4">
          <div className="ch-card-title mb-3">Tiempo a oferta por banco</div>
          <div className="space-y-2">
            {(banks ?? []).slice(0, 4).map((b, i) => {
              const h = b.avg_response_hours ?? 0;
              const colors = ["var(--ch-success)", "var(--ch-info)", "var(--ch-warning)", "var(--ch-danger)"];
              const pct = Math.min((h / 5) * 100, 100);
              return (
                <div key={b.lender_code} className="flex items-center gap-3">
                  <span style={{ width: 120, fontSize: 12 }}>{lenderDisplayName(b.lender_code)}</span>
                  <div style={{ flex: 1, height: 8, background: "var(--ch-surface-3)", borderRadius: 4 }}>
                    <div style={{ width: `${100 - pct}%`, height: "100%", background: colors[i] ?? "var(--ch-text-3)", borderRadius: 4 }} />
                  </div>
                  <span className="ch-mono text-xs">{h ? `${h}h` : "—"}</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--ch-text-3)", marginTop: 10 }}>Más corto gana la subasta</p>
        </div>
      </div>

      <div>
        <h2 className="ch-serif" style={{ margin: "0 0 12px", fontSize: 17 }}>
          Alertas
        </h2>
        <div className="space-y-2">
          {alerts.map((a) => (
            <AlertCard key={a.title} {...a} />
          ))}
        </div>
      </div>
    </section>
  );
}
