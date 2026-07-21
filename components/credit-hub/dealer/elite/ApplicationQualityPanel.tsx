"use client";

import { useMemo } from "react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

function completeness(app: CreditApplication): { score: number; missing: string[] } {
  const missing: string[] = [];
  const h = humanizeApplicant(app, "DOP");
  if (!h.hasClientData) missing.push("Nombre del cliente");
  if (!app.vehicle_make && !app.vehicle_model) missing.push("Vehículo");
  if (!app.monthly_income) missing.push("Ingreso mensual");
  if (!app.applicant_phone) missing.push("Teléfono");
  const fields = 4;
  const score = Math.round(((fields - missing.length) / fields) * 100);
  return { score: Math.max(0, score), missing };
}

export function ApplicationQualityPanel({
  applications,
  currency,
}: {
  applications: CreditApplication[];
  currency: string;
}) {
  const active = applications.filter((a) => a.status !== "draft" && a.status !== "rejected");
  const summary = useMemo(() => {
    if (!active.length) return { avg: 0, incomplete: 0, ready: 0 };
    let total = 0;
    let incomplete = 0;
    let ready = 0;
    for (const app of active) {
      const c = completeness(app);
      total += c.score;
      if (c.score >= 85) ready += 1;
      else incomplete += 1;
    }
    return { avg: Math.round(total / active.length), incomplete, ready };
  }, [active]);

  const worst = useMemo(() => {
    return [...active]
      .map((app) => ({ app, ...completeness(app) }))
      .filter((x) => x.missing.length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [active]);

  return (
    <section className="mb-[26px]" data-testid="application-quality">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Calidad del expediente
        </h2>
        <DataTruthBadge level="REAL" />
      </div>
      <div className="ch-card" style={{ padding: 16 }}>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="ch-eyebrow">Completitud prom.</div>
            <div className="ch-mono text-2xl font-bold">{summary.avg}%</div>
          </div>
          <div>
            <div className="ch-eyebrow">Lista para banco</div>
            <div className="ch-mono text-2xl font-bold" style={{ color: "var(--ch-success-text)" }}>
              {summary.ready}
            </div>
          </div>
          <div>
            <div className="ch-eyebrow">Riesgo incompleta</div>
            <div className="ch-mono text-2xl font-bold" style={{ color: "var(--ch-warning-text)" }}>
              {summary.incomplete}
            </div>
          </div>
        </div>
        {worst.length ? (
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--ch-text-2)" }}>
            {worst.map(({ app, missing }) => {
              const h = humanizeApplicant(app, currency);
              return (
                <li key={app.application_id}>
                  {h.primaryLabel}: falta {missing.join(", ")}
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "var(--ch-text-3)" }}>Expedientes en buen estado.</p>
        )}
      </div>
    </section>
  );
}
