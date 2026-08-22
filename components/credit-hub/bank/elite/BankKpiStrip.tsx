"use client";

import { useMemo } from "react";
import {
  Activity,
  Banknote,
  CheckCircle2,
  Clock,
  Gavel,
  Percent,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { useAuctionIntel } from "@/lib/credit-hub/hooks/useAuctionIntel";
import {
  CH_DEFAULT_CURRENCY_SYMBOL,
  formatCompactMoneySuffix,
} from "@/lib/credit-hub/utils/currency";

function formatCompactMoney(amount: number): string {
  return formatCompactMoneySuffix(amount);
}

function decidedTodayCount(queue: BankQueueItem[]): number {
  const today = new Date().toDateString();
  return queue.filter((q) => {
    const decided = q.bank_decision || q.state === "decided" || q.state === "DECIDED";
    if (!decided || !q.created_at) return false;
    return new Date(q.created_at).toDateString() === today;
  }).length;
}

export function BankKpiStrip({
  analytics,
  queue,
  pending,
  topQueueCount,
  analyticsUnavailable,
  onQueueClick,
}: {
  analytics?: BankDashboardAnalytics;
  queue: BankQueueItem[];
  pending: number;
  topQueueCount: number;
  analyticsUnavailable?: boolean;
  onQueueClick?: () => void;
}) {
  const auctionQuery = useAuctionIntel();
  const cohort = analytics?.cohort_analysis ?? [];
  const volumeTrend = cohort.map((c) => c.applications);
  const approvalTrend = cohort.map((c) => +(c.approval_rate * 100).toFixed(1));

  const evaluatedAmount = useMemo(
    () => queue.filter((q) => !q.bank_decision).reduce((s, q) => {
      // FE-MONTO M1: Skip applications with no requested_amount in sum
      const amount = q.requested_amount ? Number(q.requested_amount) : 0;
      return s + amount;
    }, 0),
    [queue],
  );

  const decidedToday = decidedTodayCount(queue);
  const lookToBook = auctionQuery.data?.look_to_book;
  const conversionPct = lookToBook != null ? Math.round(lookToBook * 100) : null;

  const cards = useMemo(
    () => [
      {
        label: "En cola",
        value: pending,
        truth: "REAL" as const,
        delta: { direction: "flat" as const, label: `${topQueueCount} en spotlight` },
        icon: Activity,
        trendValues: volumeTrend.length ? volumeTrend : undefined,
        trendDemo: !volumeTrend.length,
        trendColor: "var(--ch-bank-accent, var(--ch-info))",
        onClick: onQueueClick,
      },
      {
        label: "Pendientes de decisión",
        value: topQueueCount,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: "priorizadas" },
        icon: Gavel,
        trendDemo: true,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Decididas hoy",
        value: decidedToday,
        truth: "REAL" as const,
        delta: decidedToday ? { direction: "up" as const, label: "hoy" } : { direction: "flat" as const, label: "sin cierres hoy" },
        icon: CheckCircle2,
        trendDemo: true,
        trendColor: "var(--ch-success)",
      },
      {
        label: "Tasa de aprobación",
        value: analytics && !analyticsUnavailable ? (analytics.approval_rate * 100).toFixed(0) : "—",
        unit: analytics && !analyticsUnavailable ? "%" : undefined,
        truth: analytics && !analyticsUnavailable ? ("REAL" as const) : ("ROADMAP" as const),
        delta: analytics && !analyticsUnavailable ? { direction: "up" as const, label: "meta 75%" } : undefined,
        icon: Percent,
        accent: true,
        trendValues: approvalTrend.length && !analyticsUnavailable ? approvalTrend : undefined,
        trendDemo: !approvalTrend.length || !!analyticsUnavailable,
        trendColor: "var(--ch-success)",
      },
      {
        label: "Tiempo prom. decisión",
        value: analyticsUnavailable ? "—" : (analytics?.avg_decision_time_hours ?? "—"),
        unit: analytics?.avg_decision_time_hours != null && !analyticsUnavailable ? "h" : undefined,
        truth:
          analytics?.avg_decision_time_hours != null && !analyticsUnavailable
            ? ("REAL" as const)
            : ("ROADMAP" as const),
        delta: { direction: "down" as const, label: "meta ≤ 6 h" },
        icon: Clock,
        trendDemo: analytics?.avg_decision_time_hours == null || !!analyticsUnavailable,
        trendColor: "var(--ch-bank-accent, var(--ch-info))",
      },
      {
        label: "Monto evaluado",
        value: evaluatedAmount ? formatCompactMoney(evaluatedAmount) : "—",
        unit: evaluatedAmount ? CH_DEFAULT_CURRENCY_SYMBOL : undefined,
        truth: "REAL" as const,
        delta: { direction: "up" as const, label: "en cola activa" },
        icon: Banknote,
        trendDemo: !evaluatedAmount,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Conversión oferta→aceptada",
        value: conversionPct ?? "—",
        unit: conversionPct != null ? "%" : undefined,
        truth: conversionPct != null && !auctionQuery.isError ? ("REAL" as const) : ("DEMO" as const),
        delta: { direction: "up" as const, label: "look-to-book subasta" },
        icon: TrendingUp,
        trendDemo: conversionPct == null,
        trendColor: "var(--ch-info)",
      },
    ],
    [
      pending,
      topQueueCount,
      decidedToday,
      analytics,
      volumeTrend,
      approvalTrend,
      evaluatedAmount,
      conversionPct,
      auctionQuery.isError,
      analyticsUnavailable,
      onQueueClick,
    ],
  );

  return (
    <section data-testid="bank-kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[26px]">
      {cards.map((c) => (
        <MetricCard key={c.label} {...c} />
      ))}
    </section>
  );
}
