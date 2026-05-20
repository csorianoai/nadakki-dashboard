"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DealerAnalytics } from "@/types/dealer-analytics";

type BucketTab = "amount" | "term" | "risk";

export function ApprovalRateSkeleton() {
  return (
    <div className="h-[280px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" aria-hidden data-testid="approval-rate-skeleton" />
  );
}

interface ApprovalRateByBucketProps {
  approval: DealerAnalytics["approvalRateByBucket"];
  loading: boolean;
}

export function ApprovalRateByBucket({ approval, loading }: ApprovalRateByBucketProps) {
  const [tab, setTab] = useState<BucketTab>("amount");

  const rows = useMemo(() => {
    if (tab === "amount") {
      return approval.byAmount.map((b) => ({ label: b.range, rate: b.rate, count: b.count }));
    }
    if (tab === "term") {
      return approval.byTerm.map((b) => ({ label: b.range, rate: b.rate, count: b.count }));
    }
    return approval.byRiskTier.map((b) => ({ label: b.tier, rate: b.rate, count: b.count }));
  }, [approval, tab]);

  if (loading) {
    return <ApprovalRateSkeleton />;
  }

  if (
    approval.byAmount.length === 0 &&
    approval.byTerm.length === 0 &&
    approval.byRiskTier.length === 0
  ) {
    return (
      <p className="text-sm text-gray-500" data-testid="approval-empty-all">
        Sin segmentos para tasas.
      </p>
    );
  }

  const tabs: { id: BucketTab; label: string }[] = [
    { id: "amount", label: "Por monto" },
    { id: "term", label: "Por plazo" },
    { id: "risk", label: "Por riesgo" },
  ];

  return (
    <div className="w-full space-y-3" data-testid="approval-rate-by-bucket">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Segmentación de tasas">
        {tabs.map((t) => {
          const pressed = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={pressed}
              data-testid={`approval-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                pressed ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100" : "border-white/15 text-gray-400 hover:border-white/30 hover:text-white",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 40, left: 0 }} accessibilityLayer aria-label="Tasa de aprobación por cubeta">
          <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#a3a3a3", fontSize: 10 }} angle={-20} textAnchor="end" height={64} interval={0} />
          <YAxis stroke="#737373" tick={{ fill: "#a3a3a3", fontSize: 11 }} domain={[0, "auto"]} unit=" %" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null;
              const row = payload[0].payload as { label: string; rate: number; count: number };
              return (
                <div className="rounded-lg border border-white/12 bg-neutral-950/95 px-3 py-2 text-xs backdrop-blur">
                  <div className="font-semibold text-white">{row.label}</div>
                  <div className="text-gray-300">Tasa {row.rate.toFixed(1)}%</div>
                  <div className="text-gray-500">Cantidad {row.count.toLocaleString("es-DO")}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="rate" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
