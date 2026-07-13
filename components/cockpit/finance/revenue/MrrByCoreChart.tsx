"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { CORE_COLOR_FALLBACK } from "@/lib/cockpit/core-registry";
import type { PlatformCoreCode } from "@/lib/cockpit/core-registry";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import { formatCockpitMoney } from "@/lib/cockpit/finance-v3/format";
import type { MrrByCoreEnvelope } from "@/lib/cockpit/finance-v3/contracts/finance";

export function MrrByCoreChart({
  envelope,
  locale,
  currency,
}: {
  envelope: MrrByCoreEnvelope;
  locale: string;
  currency: string;
}) {
  const badge = cockpitDataSourceToBadgeLevel(envelope.data_source);
  const chartData = envelope.data.cores.map((c) => ({
    name: c.display_name,
    mrr: c.mrr,
    fill:
      c.color_hex ??
      CORE_COLOR_FALLBACK[c.core_code as PlatformCoreCode] ??
      "#6366f1",
  }));

  return (
    <div className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4" data-testid="mrr-by-core-chart">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-cockpit-text">MRR por core</h2>
        <DataTruthBadge level={badge} />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) =>
                formatCockpitMoney(v, locale, currency, envelope.data_source)
              }
              contentStyle={{ background: "#1e1e2e", border: "1px solid #334155" }}
            />
            <Bar dataKey="mrr" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
