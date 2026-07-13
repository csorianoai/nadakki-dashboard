"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { CORE_CHIP_DOT } from "@/lib/cockpit/core-registry";
import { formatCurrency } from "@/lib/cockpit/format";
import type { MrrByCoreItem } from "@/lib/cockpit/types-finance";

const GRID = "#1e1e2e";
const AXIS = "#8b8b99";
const TOOLTIP = { background: "#111118", border: "1px solid #1e1e2e", color: "#e5e5ef" };

export function MrrByCoreBar({
  cores,
  isDemo,
  locale,
  currency,
}: {
  cores: MrrByCoreItem[];
  isDemo: boolean;
  locale: string;
  currency: string;
}) {
  const sorted = [...cores].sort((a, b) => b.mrr - a.mrr);
  const money = (n: number) => formatCurrency(n, locale, currency);

  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">MRR por core</h2>
        {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" stroke={AXIS} tick={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="display_name"
            width={120}
            stroke={AXIS}
            tick={{ fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => money(v)} />
          <Bar dataKey="mrr" radius={[0, 4, 4, 0]}>
            {sorted.map((c) => (
              <Cell
                key={c.core_code}
                fill={c.color_hex ?? CORE_CHIP_DOT[c.core_code] ?? "#a78bfa"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
