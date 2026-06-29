"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { AlertCard } from "@/components/credit-hub/elite/AlertCard";
import { RiskScoreChip } from "@/components/credit-hub/elite/RiskScoreChip";
import { SLAChip } from "@/components/credit-hub/elite/SLAChip";
import { PRIORITY_STYLE } from "@/lib/credit-hub/bank/bankFormat";
import { chMoney } from "@/lib/credit-hub/ch-base";
import { shortFolio } from "@/lib/credit-hub/honesty/humanize-applicant";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

const SLA_HOURS = 6;

function slaMinutesRemaining(createdAt: string | null): number | null {
  if (!createdAt) return null;
  const deadline = new Date(createdAt).getTime() + SLA_HOURS * 60 * 60 * 1000;
  return Math.round((deadline - Date.now()) / 60000);
}

function priorityCounts(items: BankQueueItem[]): Record<string, number> {
  const counts: Record<string, number> = { ALTA: 0, MEDIA: 0, BAJA: 0 };
  for (const item of items) {
    counts[item.priority] = (counts[item.priority] ?? 0) + 1;
  }
  return counts;
}

export function BankDecisionQueueSpotlight({
  items,
  pending,
  counterOffers,
  onViewAll,
}: {
  items: BankQueueItem[];
  pending: number;
  counterOffers: number;
  onViewAll?: () => void;
}) {
  const counts = priorityCounts(items);

  const alerts = useMemo(() => {
    const list: { severity: "high" | "medium" | "low"; title: string; body: string }[] = [];
    const critical = items.filter((i) => {
      const m = slaMinutesRemaining(i.created_at);
      return m != null && m < 15;
    });
    if (critical.length) {
      list.push({
        severity: "high",
        title: "SLA crítico (<15 min)",
        body: `${critical.length} solicitud(es) requieren decisión inmediata`,
      });
    }
    if (counterOffers > 0) {
      list.push({
        severity: "medium",
        title: "Contraofertas sin respuesta",
        body: `${counterOffers} contraoferta(s) activa(s) en cola`,
      });
    }
    list.push({
      severity: "medium",
      title: "Meta de aprobación en riesgo",
      body: "Objetivos DEMO — revisar pacing del mes",
    });
    list.push({
      severity: "low",
      title: "Solicitudes sin asignar",
      body: "Asignación de analista ROADMAP — usar bandeja completa",
    });
    return list;
  }, [items, counterOffers]);

  return (
    <section data-testid="bank-decision-queue-spotlight" className="mb-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="ch-eyebrow" style={{ color: "var(--ch-bank-accent-text, var(--ch-persona-text))" }}>
              COLA DE SOLICITUDES
            </span>
            <h2 className="ch-serif" style={{ margin: 0, fontSize: 19, letterSpacing: "-0.01em" }}>
              Revisión humana priorizada
            </h2>
            <DataTruthBadge level="REAL" />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ch-text-3)" }}>
            {pending} en cola · folio · dealer · score · SLA · asignación
          </p>
        </div>
        <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={onViewAll}>
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(["ALTA", "MEDIA", "BAJA"] as const).map((p) => {
          const s = PRIORITY_STYLE[p];
          return (
            <span
              key={p}
              className="ch-chip"
              style={{ fontSize: 10, fontWeight: 700, color: s.c, background: s.bg, borderColor: s.bd }}
            >
              {p} · {counts[p] ?? 0}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3">
        {items.length === 0 ? (
          <div className="ch-card p-6">
            <EmptyStateRich variant="empty" title="Cola vacía" description="No hay solicitudes pendientes de decisión." />
          </div>
        ) : (
          <div className="ch-card ch-card-spotlight overflow-x-auto" data-testid="bank-decision-queue">
            <div className="ch-card-h">
              <div>
                <div className="ch-card-title">Solicitudes en cola</div>
                <div className="ch-card-sub">{items.length} de {pending} visibles</div>
              </div>
            </div>
            <table className="ch-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Dealer</th>
                  <th className="ch-num">Monto</th>
                  <th className="ch-num">Score</th>
                  <th>SLA</th>
                  <th>Asignación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const sla = slaMinutesRemaining(a.created_at);
                  return (
                    <tr key={a.application_id} className="ch-click">
                      <td>
                        <div className="ch-mono font-semibold">{shortFolio(a.application_id)}</div>
                        <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>{a.applicant_name ?? "—"}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{a.dealer_name ?? "—"}</td>
                      <td className="ch-num">{chMoney(a.requested_amount)}</td>
                      <td className="ch-num">
                        <RiskScoreChip score={a.score} />
                      </td>
                      <td>
                        <SLAChip minutesRemaining={sla} />
                      </td>
                      <td>
                        <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled title="ROADMAP">
                          Asignar
                        </button>
                      </td>
                      <td>
                        <Link
                          href={`/credit-hub/bank/applications/${a.application_id}`}
                          className="ch-btn ch-btn-secondary ch-btn-sm"
                        >
                          Revisar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--ch-line-subtle)",
                fontSize: 11.5,
                textAlign: "right",
              }}
            >
              <Link href="/credit-hub/bank/applications" style={{ color: "var(--ch-accent)", fontWeight: 500 }}>
                Abrir bandeja completa →
              </Link>
            </div>
          </div>
        )}

        <aside>
          <h3 className="ch-serif" style={{ margin: "0 0 10px", fontSize: 16 }}>
            Alertas inteligentes
          </h3>
          <div className="space-y-2">
            {alerts.map((a) => (
              <AlertCard key={a.title} {...a} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
