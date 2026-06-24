"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select } from "@/components/forge";
import {
  ContableApiError,
  getGastosMonitor,
  listPeriodos,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { GastosMonitorReport, PeriodoContable, GastoMonitor } from "@/types/contable";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  return n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TendenciaIcon({ tendencia }: { tendencia: GastoMonitor["tendencia"] }) {
  if (tendencia === "up") return <ArrowUpRight className="h-4 w-4 text-rose-400" />;
  if (tendencia === "down") return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
  return <Minus className="h-4 w-4 text-zinc-400" />;
}

export function MonitorGastosClient() {
  const tenantId = useContableTenantId();
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<GastosMonitorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    void listPeriodos(tenantId, new Date().getFullYear()).then((p) => {
      setPeriodos(p);
      if (p[0]) setPeriodoId(p[0].id);
    });
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !periodoId) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await getGastosMonitor(tenantId, periodoId));
    } catch (e) {
      if (e instanceof ContableApiError && (e.status === 404 || e.status === 400)) {
        setReport(null);
        setError(null);
      } else {
        const msg = e instanceof ContableApiError ? e.message : "Error cargando monitor de gastos";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, periodoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = report?.gastos?.map((g) => ({
    name: g.nombre.length > 15 ? g.nombre.slice(0, 15) + "..." : g.nombre,
    actual: g.periodo_actual,
    anterior: g.periodo_anterior,
  })) ?? [];

  return (
    <ContablePageShell
      title="Monitor de Gastos"
      description="Seguimiento de gastos con alertas de variación vs período anterior."
      icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
    >
      <div className="mb-4 max-w-xs">
        <Select
          label="Periodo"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodos.map((p) => ({ value: p.id, label: `${p.label} (${p.status})` }))}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando monitor de gastos...
        </div>
      ) : !report && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-zinc-400 text-sm">No hay datos disponibles para este período.</p>
          <p className="text-zinc-500 text-xs mt-1">Crea períodos y asientos para ver los reportes.</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Gastos</p>
              <p className="mt-1 font-mono text-2xl font-bold text-white">{fmt(report.total_gastos)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Variación vs anterior</p>
              <p className={cn(
                "mt-1 font-mono text-2xl font-bold",
                report.variacion_total_pct > 0 ? "text-rose-300" : report.variacion_total_pct < 0 ? "text-emerald-300" : "text-zinc-300",
              )}>
                {report.variacion_total_pct > 0 ? "+" : ""}{report.variacion_total_pct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Alertas activas</p>
              <p className={cn(
                "mt-1 font-mono text-2xl font-bold",
                (report?.alertas_count ?? 0) > 0 ? "text-rose-300" : "text-emerald-300",
              )}>
                {report?.alertas_count ?? 0}
              </p>
            </div>
          </div>

          {/* Line chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-sm font-bold text-white">Gastos: período actual vs anterior</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(value: number) => [fmt(value), ""]}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Período actual" />
                  <Line type="monotone" dataKey="anterior" stroke="#71717a" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="Período anterior" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gastos table */}
          {(report?.gastos?.length ?? 0) > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cuenta</th>
                    <th className="px-4 py-3 text-right">Período actual</th>
                    <th className="px-4 py-3 text-right">Período anterior</th>
                    <th className="px-4 py-3 text-right">Variación</th>
                    <th className="px-4 py-3 text-center">Tendencia</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.gastos?.map((g) => (
                    <tr key={g.cuenta_id} className="border-b border-white/5">
                      <td className="px-4 py-2 font-mono text-xs">{g.codigo}</td>
                      <td className="px-4 py-2">{g.nombre}</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(g.periodo_actual)}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-400">{fmt(g.periodo_anterior)}</td>
                      <td className={cn(
                        "px-4 py-2 text-right font-mono",
                        g.variacion_pct > 0 ? "text-rose-300" : g.variacion_pct < 0 ? "text-emerald-300" : "text-zinc-400",
                      )}>
                        {g.variacion_pct > 0 ? "+" : ""}{g.variacion_pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-center"><TendenciaIcon tendencia={g.tendencia} /></td>
                      <td className="px-4 py-2">
                        {g.alerta && (
                          <span className="inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-200 ring-1 ring-rose-400/30">
                            ALERTA
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </ContablePageShell>
  );
}
