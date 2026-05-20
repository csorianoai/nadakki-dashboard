"use client";

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BankAnalytics } from "@/types/bank-analytics";

const COLORS: Record<string, string> = {
  Approved: "#22c55e",
  Declined: "#ef4444",
  Pending: "#facc15",
  Withdrawn: "#94a3b8",
};

export function DecisionSkeleton() {
  return (
    <div
      className="h-[300px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
      aria-hidden
      data-testid="decision-chart-skeleton"
    />
  );
}

interface DecisionDistributionProps {
  decision: BankAnalytics["decisionDistribution"];
  loading: boolean;
}

export function DecisionDistribution({ decision, loading }: DecisionDistributionProps) {
  const sliceData = loading
    ? []
    : [
        { key: "approved", name: "Approved", value: decision.approved, fill: COLORS.Approved },
        { key: "declined", name: "Declined", value: decision.declined, fill: COLORS.Declined },
        { key: "pending", name: "Pending", value: decision.pending, fill: COLORS.Pending },
        { key: "withdrawn", name: "Withdrawn", value: decision.withdrawn, fill: COLORS.Withdrawn },
      ].filter((d) => Number.isFinite(d.value) && d.value > 0);

  const totalVolume = sliceData.reduce((acc, d) => acc + (d.value as number), 0);

  if (loading) {
    return <DecisionSkeleton />;
  }

  if (!sliceData.length) {
    return (
      <p className="text-sm text-gray-500" data-testid="decision-chart-empty">
        Sin decisiones clasificadas en este periodo.
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:p-4"
      data-testid="decision-distribution"
    >
      <h3 className="mb-3 text-lg font-semibold text-white">Decisiones históricas</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart
          accessibilityLayer
          aria-label="Distribución agregada de decisiones sin datos personales identificables"
        >
          <Tooltip
            formatter={(value: unknown, name) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              const pct = totalVolume ? (v / totalVolume) * 100 : 0;
              return [`${v.toLocaleString("es-DO")} (${pct.toFixed(1)}%)`, String(name)];
            }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(8,11,26,0.98)",
              color: "#f4f4f5",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
          <Pie
            data={sliceData}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={94}
            paddingAngle={2}
          >
            {sliceData.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} stroke="#0f172a" strokeWidth={1} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
