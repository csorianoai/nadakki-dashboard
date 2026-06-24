"use client";

import { useCallback, useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button, Input } from "@/components/forge";
import { ContableApiError, getEstadoResultados } from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { EstadoResultadosReport } from "@/types/contable";
import { cn } from "@/lib/utils";

const COLORS = {
  ingresos: "#10b981",
  costos: "#f59e0b",
  gastos: "#ef4444",
  utilidad: "#6366f1",
};

function fmt(n: number): string {
  return n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function margenColor(pct: number): string {
  if (pct >= 20) return "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40";
  if (pct >= 10) return "bg-amber-500/20 text-amber-200 ring-amber-400/40";
  return "bg-rose-500/20 text-rose-200 ring-rose-400/40";
}

export function EstadoResultadosClient() {
  const tenantId = useContableTenantId();
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<EstadoResultadosReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEstadoResultados(tenantId, desde, hasta);
      setReport(data);
    } catch (e) {
      if (e instanceof ContableApiError && (e.status === 404 || e.status === 400)) {
        setReport(null);
        setError(null);
      } else {
        const msg = e instanceof ContableApiError ? e.message : "Error generando reporte";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, desde, hasta]);

  const barData = report
    ? [
        { name: "Ingresos", value: report.total_ingresos },
        { name: "Costos", value: report.total_costos },
        { name: "Gastos", value: report.total_gastos },
      ]
    : [];

  const pieData = report?.gastos.length
    ? report.gastos.map((g) => ({ name: g.nombre, value: Math.abs(g.total) }))
    : [];

  const barColors = [COLORS.ingresos, COLORS.costos, COLORS.gastos];

  return (
    <ContablePageShell
      title="Estado de Resultados"
      description="Ingresos, costos, gastos y utilidad neta del período seleccionado."
      icon={<TrendingUp className="h-10 w-10" aria-hidden />}
    >
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Button onClick={() => void generate()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generar reporte
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-zinc-400 text-sm">No hay datos disponibles para este período.</p>
          <p className="text-zinc-500 text-xs mt-1">Crea períodos y asientos para ver el estado de resultados.</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Badges de margen */}
          <div className="flex flex-wrap gap-3">
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1", margenColor(report.margen_bruto_pct))}>
              Margen bruto: {report.margen_bruto_pct.toFixed(1)}%
            </span>
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1", margenColor(report.margen_neto_pct))}>
              Margen neto: {report.margen_neto_pct.toFixed(1)}%
            </span>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {barData.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-bold text-white">Ingresos vs Costos vs Gastos</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                      formatter={(value: number) => [fmt(value), "Monto"]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={barColors[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {pieData.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="mb-3 text-sm font-bold text-white">Distribución de gastos</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={false}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={["#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                      formatter={(value: number) => [fmt(value), "Monto"]}
                    />
                    <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabla resumen */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {report.ingresos.map((r) => (
                  <tr key={r.codigo} className="border-b border-white/5">
                    <td className="px-4 py-2 text-emerald-200">{r.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(r.total)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-500/5 font-bold text-emerald-200">
                  <td className="px-4 py-2" colSpan={2}>Total Ingresos</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(report.total_ingresos)}</td>
                </tr>

                {report.costos.map((r) => (
                  <tr key={r.codigo} className="border-b border-white/5">
                    <td className="px-4 py-2 text-amber-200">{r.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(r.total)}</td>
                  </tr>
                ))}
                <tr className="bg-amber-500/5 font-bold text-amber-200">
                  <td className="px-4 py-2" colSpan={2}>Total Costos</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(report.total_costos)}</td>
                </tr>

                <tr className="bg-indigo-500/5 font-bold text-indigo-200">
                  <td className="px-4 py-2" colSpan={2}>Utilidad Bruta</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(report.utilidad_bruta)}</td>
                </tr>

                {report.gastos.map((r) => (
                  <tr key={r.codigo} className="border-b border-white/5">
                    <td className="px-4 py-2 text-rose-200">{r.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(r.total)}</td>
                  </tr>
                ))}
                <tr className="bg-rose-500/5 font-bold text-rose-200">
                  <td className="px-4 py-2" colSpan={2}>Total Gastos</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(report.total_gastos)}</td>
                </tr>

                <tr className="bg-indigo-500/10 text-lg font-bold text-indigo-100">
                  <td className="px-4 py-3" colSpan={2}>Utilidad Neta</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(report.utilidad_neta)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ContablePageShell>
  );
}
