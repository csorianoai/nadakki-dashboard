"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { QueueTable } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { PRIORITY_STYLE } from "@/lib/credit-hub/bank/bankFormat";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

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
  onViewAll,
}: {
  items: BankQueueItem[];
  pending: number;
  onViewAll?: () => void;
}) {
  const counts = priorityCounts(items);

  return (
    <section data-testid="bank-decision-queue-spotlight" className="mb-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="ch-eyebrow" style={{ color: "var(--ch-bank-accent-text, var(--ch-persona-text))" }}>
              FUNCIÓN ESTRELLA
            </span>
            <h2 className="ch-serif" style={{ margin: 0, fontSize: 19, letterSpacing: "-0.01em" }}>
              Cola de decisión
            </h2>
            <DataTruthBadge level="REAL" />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ch-text-3)" }}>
            {pending} en cola · ordenadas por prioridad y score · solo tu cartera asignada
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
          const n = counts[p] ?? 0;
          return (
            <span
              key={p}
              className="ch-chip"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: s.c,
                background: s.bg,
                borderColor: s.bd,
              }}
            >
              <span className="ch-dot" style={{ background: s.c }} />
              {p} · {n}
            </span>
          );
        })}
        <span className="ch-chip persona" style={{ fontSize: 10 }}>
          Aislamiento activo
        </span>
      </div>

      {items.length === 0 ? (
        <div className="ch-card p-6">
          <EmptyStateRich variant="empty" title="Cola vacía" description="No hay solicitudes pendientes de decisión." />
        </div>
      ) : (
        <div className="ch-card ch-card-spotlight overflow-x-auto" data-testid="bank-decision-queue">
          <div className="ch-card-h">
            <div>
              <div className="ch-card-title">Solicitudes que requieren revisión humana</div>
              <div className="ch-card-sub">Prioridad · solicitante · score · riesgo</div>
            </div>
            <span className="ch-mono" style={{ fontSize: 12, color: "var(--ch-text-3)" }}>
              {items.length} / {pending}
            </span>
          </div>
          <QueueTable items={items} variant="dashboard" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderTop: "1px solid var(--ch-line-subtle)",
              fontSize: 11.5,
              color: "var(--ch-text-3)",
            }}
          >
            <span className="ch-mono">{items.length} de {pending} visibles</span>
            <Link href="/credit-hub/bank/applications" style={{ color: "var(--ch-accent)", fontWeight: 500 }}>
              Abrir bandeja completa →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
