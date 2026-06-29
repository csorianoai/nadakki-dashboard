"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Clock,
  FileCheck,
  Gavel,
  Percent,
  Scale,
} from "lucide-react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import {
  classifyDefaultPredictionTrust,
  formatDefaultPredictionDisplay,
} from "@/lib/credit-hub/bank/bankFormat";

function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}

export function BankKpiStrip({
  analytics,
  pending,
  topQueueCount,
  counterOffers,
  onQueueClick,
}: {
  analytics?: BankDashboardAnalytics;
  pending: number;
  topQueueCount: number;
  counterOffers: number;
  onQueueClick?: () => void;
}) {
  const cohort = analytics?.cohort_analysis ?? [];
  const volumeTrend = cohort.map((c) => c.applications);
  const approvalTrend = cohort.map((c) => +(c.approval_rate * 100).toFixed(1));
  const demoTrend = [3, 4, 5, 6, 7, 8];

  const defaultDisplay = analytics
    ? formatDefaultPredictionDisplay(
        analytics.default_prediction.predicted_default_rate,
        analytics.default_prediction.predicted_default_count,
        analytics.total_applications,
      )
    : null;
  const defaultTrust =
    analytics && defaultDisplay
      ? classifyDefaultPredictionTrust(
          defaultDisplay,
          analytics.default_prediction.predicted_default_count,
          analytics.total_applications,
        )
      : null;

  const cards = useMemo(
    () => [
      {
        label: "En cola",
        value: pending,
        truth: "REAL" as const,
        delta: { direction: "flat" as const, label: `${topQueueCount} priorizadas` },
        icon: Activity,
        trendValues: volumeTrend.length ? volumeTrend : undefined,
        trendDemo: !volumeTrend.length,
        trendColor: "var(--ch-bank-accent, var(--ch-info))",
        onClick: onQueueClick,
      },
      {
        label: "Decisiones pendientes",
        value: topQueueCount,
        truth: "REAL" as const,
        delta: pending > topQueueCount ? { direction: "up" as const, label: `${pending - topQueueCount} en bandeja` } : undefined,
        icon: Gavel,
        trendDemo: true,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Contraofertas activas",
        value: counterOffers || "—",
        truth: counterOffers ? ("REAL" as const) : ("ROADMAP" as const),
        delta: counterOffers ? { direction: "up" as const, label: "desde cola" } : undefined,
        icon: Scale,
        trendDemo: !counterOffers,
        trendColor: "var(--ch-info)",
      },
      {
        label: "Tasa de aprobación",
        value: analytics ? (analytics.approval_rate * 100).toFixed(0) : "—",
        unit: analytics ? "%" : undefined,
        truth: "REAL" as const,
        delta: analytics ? { direction: "up" as const, label: "meta 75%" } : undefined,
        icon: Percent,
        accent: true,
        trendValues: approvalTrend.length ? approvalTrend : undefined,
        trendDemo: !approvalTrend.length,
        trendColor: "var(--ch-success)",
      },
      {
        label: "Tiempo prom. decisión",
        value: analytics?.avg_decision_time_hours ?? "—",
        unit: analytics?.avg_decision_time_hours != null ? "h" : undefined,
        truth: "ROADMAP" as const,
        delta: { direction: "down" as const, label: "meta ≤ 6 h" },
        icon: Clock,
        trendDemo: true,
        trendColor: "var(--ch-bank-accent, var(--ch-info))",
      },
      {
        label: "Volumen cartera",
        value: analytics ? formatCompactMoney(analytics.portfolio_value) : "—",
        unit: analytics ? "MX$" : undefined,
        truth: "REAL" as const,
        delta: analytics ? { direction: "up" as const, label: "cartera viva" } : undefined,
        icon: Banknote,
        trendValues: volumeTrend.length ? volumeTrend : undefined,
        trendDemo: !volumeTrend.length,
        trendColor: "var(--ch-warning)",
      },
      {
        label: "Solicitudes totales",
        value: analytics?.total_applications ?? "—",
        truth: "REAL" as const,
        delta: analytics ? { direction: "up" as const, label: "periodo dashboard" } : undefined,
        icon: FileCheck,
        trendValues: volumeTrend.length ? volumeTrend : undefined,
        trendDemo: !volumeTrend.length,
        trendColor: "var(--ch-text-3)",
      },
      {
        label: "Default predicho",
        value: defaultDisplay?.percentLabel ?? "—",
        unit: defaultDisplay ? "%" : undefined,
        truth: defaultTrust?.level ?? ("ROADMAP" as const),
        delta: defaultTrust ? { direction: "flat" as const, label: defaultTrust.contextNote.slice(0, 42) + (defaultTrust.contextNote.length > 42 ? "…" : "") } : undefined,
        icon: AlertTriangle,
        trendDemo: !analytics,
        trendColor: "var(--ch-danger)",
      },
    ],
    [
      pending,
      topQueueCount,
      counterOffers,
      analytics,
      volumeTrend,
      approvalTrend,
      defaultDisplay,
      defaultTrust,
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
