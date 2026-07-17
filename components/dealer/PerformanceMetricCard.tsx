"use client";

import type { PerformanceMetric } from "@/lib/dealer/insights-mock";

export function PerformanceMetricCard({ metric }: { metric: PerformanceMetric }) {
  const max = Math.max(...metric.sparkline, 1);

  return (
    <div className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">{metric.label}</p>
      <p className="mt-2 font-manrope text-2xl font-extrabold text-nk-fg">
        {metric.value.toLocaleString("en-US")}
        {metric.unit ? (
          <span className="ml-1 text-sm font-medium text-nk-fg-muted">{metric.unit}</span>
        ) : null}
      </p>
      {metric.changePct !== undefined ? (
        <p className="mt-1 text-xs font-semibold text-green-600">📈 +{metric.changePct}% vs mes anterior</p>
      ) : null}
      {metric.benchmark ? (
        <p className="mt-1 text-xs text-nk-fg-muted">📊 {metric.benchmark}</p>
      ) : null}
      <svg viewBox="0 0 80 24" className="mt-3 h-6 w-full text-brand-2" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={metric.sparkline
            .map((v, i) => `${(i / (metric.sparkline.length - 1)) * 80},${24 - (v / max) * 20}`)
            .join(" ")}
        />
      </svg>
    </div>
  );
}
