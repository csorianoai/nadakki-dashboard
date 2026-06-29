"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import type { DashboardSummaryPayload } from "@/lib/credit-hub/types/analytics";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { humanizeApplicant, shortFolio } from "@/lib/credit-hub/honesty/humanize-applicant";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";

interface Stage {
  key: string;
  label: string;
  count: number;
  pct: number;
  color: string;
}

function buildStages(counts: Record<string, number>): Stage[] {
  const draft = counts.DRAFT ?? 0;
  const sent = (counts.RECEIVED ?? 0) + (counts["ACTIVE:BANK_SUBMITTED"] ?? 0);
  const review = Object.entries(counts)
    .filter(([k]) => k.startsWith("ACTIVE") && k !== "ACTIVE:BANK_SUBMITTED")
    .reduce((s, [, v]) => s + v, 0);
  const offers = counts.OFFERED ?? 0;
  const accepted = counts.APPROVED ?? 0;
  const funded = counts.FUNDED ?? 0;

  const raw = [
    { key: "draft", label: "Borrador", count: draft, color: "var(--ch-text-4)" },
    { key: "sent", label: "Enviada", count: sent, color: "var(--ch-info)" },
    { key: "review", label: "En revisión", count: review, color: "var(--ch-warning)" },
    { key: "offers", label: "Con ofertas", count: offers, color: "var(--ch-warning)" },
    { key: "accepted", label: "Aceptada", count: accepted, color: "var(--ch-success)" },
    { key: "funded", label: "Fondeada", count: funded, color: "var(--ch-success)" },
  ];

  return raw.map((stage, i) => {
    const prev = i > 0 ? raw[i - 1]!.count : stage.count;
    const pct = prev > 0 ? Math.round((stage.count / prev) * 100) : stage.count > 0 ? 100 : 0;
    return { ...stage, pct };
  });
}

export function DealerPipelineRail({
  summary,
  applications,
  currency,
}: {
  summary?: DashboardSummaryPayload;
  applications: CreditApplication[];
  currency: string;
}) {
  const counts = summary?.applications_by_display_status ?? {};
  const stages = useMemo(() => buildStages(counts), [counts]);
  const max = Math.max(...stages.map((s) => s.count), 1);

  const pendingOffers = applications.filter((a) => ["offered", "counter_offer", "approved"].includes(a.status));
  const drafts = applications.filter((a) => a.status === "draft").length;

  const pullThrough =
    counts.RECEIVED || counts["ACTIVE:BANK_SUBMITTED"]
      ? Math.round(((counts.FUNDED ?? 0) / ((counts.RECEIVED ?? 0) + sentFallback(counts))) * 100)
      : null;

  const closeRate =
    (counts.APPROVED ?? 0) + (counts.FUNDED ?? 0) > 0
      ? Math.round(((counts.FUNDED ?? 0) / ((counts.APPROVED ?? 0) + (counts.FUNDED ?? 0))) * 100)
      : null;

  return (
    <section data-testid="dealer-pipeline-rail" className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 mb-[26px]">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
            Pipeline de solicitudes
          </h2>
          <DataTruthBadge level={summary ? "REAL" : "DEMO"} />
          <span style={{ fontSize: 12, color: "var(--ch-text-3)" }}>Mes en curso · conversión por etapa</span>
        </div>
        <div className="ch-card" style={{ padding: "16px 18px" }}>
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span style={{ width: 96, fontSize: 12, textAlign: "right", color: "var(--ch-text-2)" }}>{stage.label}</span>
                <div style={{ flex: 1, height: 22, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max((stage.count / max) * 100, stage.count ? 3 : 0)}%`, height: "100%", background: stage.color, opacity: 0.85 }} />
                </div>
                <span className="ch-mono" style={{ width: 72, fontSize: 12, fontWeight: 600, textAlign: "right" }}>
                  {stage.count} ({stage.pct}%)
                </span>
              </div>
            ))}
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--ch-text-3)" }}>
            {pullThrough != null ? `${pullThrough}% pull-through de enviadas a fondeadas` : "Pull-through disponible con display_status"}
            {closeRate != null ? ` · ${closeRate}% cierre aceptada→fondeo` : ""}
          </p>
        </div>
      </div>

      <aside className="space-y-2">
        {[
          { n: pendingOffers.length, label: "Ofertas por decidir", demo: false },
          { n: Math.min(pendingOffers.length + 2, 5), label: "Documentos solicitados", demo: true },
          { n: Math.min(pendingOffers.length + 3, 7), label: "Estipulaciones pendientes", demo: true },
        ].map((item) => (
          <div key={item.label} className="ch-card" style={{ padding: "12px 14px" }}>
            <div className="ch-mono text-xl font-bold">{item.n}</div>
            <div style={{ fontSize: 12, color: "var(--ch-text-2)" }}>{item.label}</div>
            {item.demo ? <DataTruthBadge level="DEMO" className="mt-1" /> : null}
          </div>
        ))}

        <div className="ch-card" style={{ padding: "12px 14px" }}>
          <div className="ch-eyebrow mb-2">Ofertas por decidir</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {pendingOffers.slice(0, 4).map((app) => {
              const h = humanizeApplicant(app, currency);
              return (
                <li key={app.application_id} style={{ marginBottom: 8 }}>
                  <Link href={dealerDetailHref(app.application_id)} className="block no-underline text-inherit">
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{shortFolio(app.application_id)} · {h.primaryLabel}</div>
                    <span className="ch-chip" style={{ fontSize: 10, marginTop: 4, background: "var(--ch-warning-soft)", color: "var(--ch-warning-text)" }}>
                      decidir
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {drafts > 0 ? (
            <p style={{ fontSize: 11, color: "var(--ch-info-text)", marginTop: 8 }}>{drafts} borradores sin enviar</p>
          ) : null}
        </div>
      </aside>
    </section>
  );
}

function sentFallback(counts: Record<string, number>): number {
  return (counts.RECEIVED ?? 0) + (counts["ACTIVE:BANK_SUBMITTED"] ?? 0) || 1;
}
