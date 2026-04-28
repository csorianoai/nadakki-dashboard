"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AmortizationRow } from "@/lib/credit/simulation/amortization";

interface Props {
  rows: AmortizationRow[];
  title: string;
  labelBalance: string;
  labelCumInterest: string;
  labelCumPrincipal: string;
}

export function AmortizationChart({ rows, title, labelBalance, labelCumInterest, labelCumPrincipal }: Props) {
  if (!rows.length) return null;

  const data = rows.map((r) => ({
    mes: r.month,
    saldo: Math.round(r.balance),
    intereses: Math.round(r.cumulativeInterest),
    principal: Math.round(r.cumulativePrincipal),
  }));

  return (
    <div className="rounded-xl border border-forge-border bg-forge-surface-elevated/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-forge-text">{title}</h3>
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => value.toLocaleString("es-DO")}
              labelFormatter={(l) => `Mes ${l}`}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            />
            <Legend />
            <Line type="monotone" dataKey="saldo" name={labelBalance} stroke="#38bdf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="intereses" name={labelCumInterest} stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="principal" name={labelCumPrincipal} stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
