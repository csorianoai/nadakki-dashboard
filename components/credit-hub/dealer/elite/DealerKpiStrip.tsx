"use client";

import { useMemo } from "react";
import {
  Activity,
  Banknote,
  Clock,
  Percent,
  Send,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import type { CreditStats } from "@/lib/credit-hub/types/creditCore";
import type { DashboardSummaryPayload } from "@/lib/credit-hub/types/analytics";
import type { BankRankingRow } from "@/lib/credit-hub/types/analytics";
import { activePipelineCountFromStats } from "@/lib/credit-hub/dealer/dealer-pipeline-metrics";

function formatCompactMoney(amount: number, currency: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}

function avgAprFromBanks(banks: BankRankingRow[] | undefined): string {
  if (!banks?.length) return "—";
  const vals = banks.map((b) => b.avg_apr).filter((v): v is number => v != null && v > 0);
  if (!vals.length) return "—";
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return `${(avg < 1 ? avg * 100 : avg).toFixed(1)}%`;
}

function avgTimeToOffer(banks: BankRankingRow[] | undefined): string {
  if (!banks?.length) return "—";
  const vals = banks.map((b) => b.avg_response_hours).filter((v): v is number => v != null);
  if (!vals.length) return "—";
  const h = vals.reduce((a, b) => a + b, 0) / vals.length;
  return `${h.toFixed(1)}h`;
}

export function DealerKpiStrip({
  stats,
  summary,
  pipelineAmount,
  currency,
  weekCount,
  banks,
}: {
  stats?: CreditStats;
  summary?: DashboardSummaryPayload;
  pipelineAmount: number;
  currency: string;
  weekCount: number;
  banks?: BankRankingRow[];
}) {
  const active = activePipelineCountFromStats(stats);
  const submitted = stats?.submitted_applications ?? 0;
  const offersTotal = summary?.offers_total ?? 0;
  const approvalPct = stats?.approval_rate != null ? Math.round(stats.approval_rate * 100) : null;

  const funded = summary?.applications_by_display_status?.FUNDED ?? 0;
  const approved = summary?.applications_by_display_status?.APPROVED ?? 0;
  const closeRate = approved + funded > 0 ? Math.round((funded / (approved + funded)) * 100) : null;

  // Sin serie histórica real: ninguna tarjeta dibuja mini-tendencias ilustrativas (DB-CODEX-16 paso 9).
  const cards = useMemo(
    () => [
      {
        label: "Solicitudes activas",
        value: active,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: `+${Math.max(weekCount, 0)} en pipeline` },
        icon: Activity,
        trendColor: "var(--ch-text-3)",
      },
      {
        label: "Enviadas a bancos",
        value: submitted,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: `+${weekCount} esta semana` },
        icon: Send,
        trendColor: "var(--ch-info)",
      },
      {
        label: "Ofertas recibidas",
        value: offersTotal || "—",
        truth: summary ? ("REAL" as const) : ("ROADMAP" as const),
        delta: offersTotal ? { direction: "up" as const, label: "de tus bancos" } : undefined,
        icon: Zap,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Tasa de aprobación",
        value: approvalPct ?? "—",
        unit: approvalPct != null ? "%" : undefined,
        truth: "REAL" as const,
        icon: Percent,
        accent: true,
        trendColor: "var(--ch-success)",
      },
      {
        label: "Tiempo a 1ª oferta",
        value: avgTimeToOffer(banks),
        truth: banks?.length ? ("REAL" as const) : ("NONE" as const),
        delta: banks?.length ? { direction: "down" as const, label: "promedio ranking" } : undefined,
        icon: Clock,
        trendColor: "var(--ch-info)",
      },
      {
        label: "Monto en pipeline",
        value: formatCompactMoney(pipelineAmount, currency),
        unit: currency === "DOP" ? "RD$" : currency,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: "en evaluación" },
        icon: Banknote,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Tasa de cierre",
        value: closeRate ?? "—",
        unit: closeRate != null ? "%" : undefined,
        truth: summary ? ("REAL" as const) : ("NONE" as const),
        delta: closeRate != null ? { direction: "up" as const, label: "aceptada→fondeada" } : undefined,
        icon: Target,
        trendColor: "var(--ch-success)",
      },
      {
        label: "APR promedio obtenido",
        value: avgAprFromBanks(banks),
        truth: banks?.length ? ("REAL" as const) : ("NONE" as const),
        delta: banks?.length ? { direction: "down" as const, label: "mejor para cliente" } : undefined,
        icon: TrendingUp,
        trendColor: "var(--ch-info)",
      },
    ],
    [active, submitted, offersTotal, approvalPct, banks, pipelineAmount, currency, weekCount, summary, closeRate],
  );

  return (
    <section data-testid="dealer-kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[26px]">
      {cards.map((c) => (
        <MetricCard key={c.label} {...c} />
      ))}
    </section>
  );
}
