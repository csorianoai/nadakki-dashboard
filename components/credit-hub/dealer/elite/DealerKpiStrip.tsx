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
import { formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";

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
  locale = "es",
  weekCount,
  banks,
}: {
  stats?: CreditStats;
  summary?: DashboardSummaryPayload;
  pipelineAmount: number;
  /** Moneda del tenant. `null` cuando el branding no la trae: sin moneda, sin importe. */
  currency: string | null;
  locale?: string;
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

  const demoTrend = [3, 4, 5, 6, 7, 8];

  const cards = useMemo(
    () => [
      {
        label: "Solicitudes activas",
        value: active,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: `+${Math.max(weekCount, 0)} en pipeline` },
        icon: Activity,
        trendDemo: true,
        trendColor: "var(--ch-text-3)",
        trendValues: [...demoTrend, active || 1],
      },
      {
        label: "Enviadas a bancos",
        value: submitted,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: `+${weekCount} esta semana` },
        icon: Send,
        trendDemo: true,
        trendColor: "var(--ch-info)",
      },
      {
        label: "Ofertas recibidas",
        value: offersTotal || "—",
        truth: summary ? ("REAL" as const) : ("ROADMAP" as const),
        delta: offersTotal ? { direction: "up" as const, label: "de tus bancos" } : undefined,
        icon: Zap,
        trendDemo: !summary,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Tasa de aprobación",
        value: approvalPct ?? "—",
        unit: approvalPct != null ? "%" : undefined,
        truth: "REAL" as const,
        delta: approvalPct != null ? { direction: "up" as const, label: "objetivo 62%" } : undefined,
        icon: Percent,
        accent: true,
        trendDemo: true,
        trendColor: "var(--ch-success)",
      },
      {
        label: "Tiempo a 1ª oferta",
        value: avgTimeToOffer(banks),
        truth: banks?.length ? ("REAL" as const) : ("DEMO" as const),
        delta: banks?.length ? { direction: "down" as const, label: "promedio ranking" } : undefined,
        icon: Clock,
        trendDemo: !banks?.length,
        trendColor: "var(--ch-info)",
      },
      {
        label: "Monto en pipeline",
        // La moneda ya va DENTRO del importe formateado por Intl; no hay `unit`
        // con un simbolo escrito a mano. Se pierde la notacion compacta (1,2M)
        // a cambio de que la moneda sea la del tenant.
        value: formatDealerMoney(pipelineAmount, currency, locale),
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: "en evaluación" },
        icon: Banknote,
        trendDemo: true,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Tasa de cierre",
        value: closeRate ?? "—",
        unit: closeRate != null ? "%" : undefined,
        truth: summary ? ("REAL" as const) : ("DEMO" as const),
        delta: closeRate != null ? { direction: "up" as const, label: "aceptada→fondeada" } : undefined,
        icon: Target,
        trendDemo: !summary,
        trendColor: "var(--ch-success)",
      },
      {
        label: "APR promedio obtenido",
        value: avgAprFromBanks(banks),
        truth: banks?.length ? ("REAL" as const) : ("DEMO" as const),
        delta: banks?.length ? { direction: "down" as const, label: "mejor para cliente" } : undefined,
        icon: TrendingUp,
        trendDemo: !banks?.length,
        trendColor: "var(--ch-info)",
      },
    ],
    [active, submitted, offersTotal, approvalPct, banks, pipelineAmount, currency, locale, weekCount, summary, closeRate],
  );

  return (
    <section data-testid="dealer-kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[26px]">
      {cards.map((c) => (
        <MetricCard key={c.label} {...c} />
      ))}
    </section>
  );
}
