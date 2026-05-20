"use client";

import { useMemo } from "react";
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip, LabelList } from "recharts";
import type { DealerAnalytics } from "@/types/dealer-analytics";

export function ConversionFunnelSkeleton() {
  return (
    <div className="h-[320px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" aria-hidden data-testid="conversion-funnel-skeleton" />
  );
}

interface ConversionFunnelProps {
  funnel: DealerAnalytics["conversionFunnel"];
  loading: boolean;
  onStageClick?: (stage: string) => void;
}

function formatDrop(p: number): string {
  return `${(p <= 1 ? p * 100 : p).toFixed(1)}%`;
}

export function ConversionFunnel({ funnel, loading, onStageClick }: ConversionFunnelProps) {
  const chartData = useMemo(
    () => [
      { name: "Started", value: funnel.started, fill: "#34d399" },
      { name: "Submitted", value: funnel.submitted, fill: "#2dd4bf" },
      { name: "Approved", value: funnel.approved, fill: "#06b6d4" },
      { name: "Closed", value: funnel.closed, fill: "#818cf8" },
    ],
    [funnel],
  );

  if (loading) {
    return <ConversionFunnelSkeleton />;
  }

  if (chartData.every((r) => r.value === 0)) {
    return (
      <p className="text-sm text-gray-500" data-testid="conversion-funnel-empty">
        Sin datos de embudo en este periodo.
      </p>
    );
  }

  return (
    <div className="w-full min-w-0" data-testid="conversion-funnel" role="figure" aria-label="Embudo de conversión dealer">
      <ResponsiveContainer width="100%" height={340}>
        <FunnelChart accessibilityLayer aria-label="Gráfico de embudo de cuatro etapas">
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(10,10,12,0.95)",
              color: "#e5e5e5",
            }}
            formatter={(value: unknown) => [Number(value).toLocaleString("es-DO"), "Solicitudes"]}
          />
          <Funnel
            dataKey="value"
            nameKey="name"
            data={chartData}
            isAnimationActive="auto"
            onClick={(payload) => {
              const inner = payload?.payload as { name?: string } | undefined;
              const stage =
                typeof inner?.name === "string" ? inner.name : typeof payload?.name === "string" ? payload.name : "";
              if (stage) onStageClick?.(stage);
            }}
          >
            <LabelList position="inside" fill="#fff" stroke="none" dataKey="name" className="text-[11px]" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400" aria-live="polite">
        {funnel.dropOffPercents.slice(0, 6).map((d) => (
          <span key={d.stage} className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5">
            {d.stage}: {formatDrop(d.dropOff)} caída
          </span>
        ))}
      </div>
    </div>
  );
}
