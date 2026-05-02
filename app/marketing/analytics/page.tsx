"use client";

/**
 * Marketing analytics — same-origin /analytics/* (proxied). Datos desde SQLite (overview + series).
 * Sin gráficos demostrativos inventados: lo no expuesto por API se oculta o se etiqueta claramente.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  RefreshCw,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

type MetricBlock = { current?: number; previous?: number; change?: number; trend?: string };

type OverviewPayload = {
  tenant_id?: string;
  period?: string;
  data_source?: string;
  mau?: MetricBlock;
  dau?: MetricBlock;
  new_users?: MetricBlock;
  stickiness?: MetricBlock;
  daily_sessions?: MetricBlock;
  sessions_per_mau?: MetricBlock;
  active_campaigns?: number;
  total_revenue?: MetricBlock;
  top_campaigns?: Array<{
    id?: string;
    name?: string;
    status?: string;
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
    revenue?: number;
    ctr?: number;
    conversion_rate?: number;
  }>;
};

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function TrendMini({ m }: { m?: MetricBlock }) {
  if (m?.change == null) return null;
  const up = m.change > 0;
  const down = m.change < 0;
  return (
    <span
      className={`text-xs flex items-center gap-0.5 ${up ? "text-emerald-400" : down ? "text-red-400" : "text-gray-500"}`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : down ? <TrendingDown className="w-3 h-3" /> : null}
      {m.change}%
    </span>
  );
}

export default function AnalyticsPage() {
  const { tenantId } = useTenant();
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [perfSeries, setPerfSeries] = useState<{ date: string; value: number }[]>([]);

  const load = useCallback(async () => {
    if (!tenantId) {
      setOverview(null);
      setPerfSeries([]);
      setError("Selecciona un tenant para ver analítica.");
      setLoading(false);
      return;
    }
    setError(null);
    const qs = new URLSearchParams({
      tenant_id: tenantId,
      period: dateRange,
    });
    try {
      const [ovRes, perfRes] = await Promise.all([
        fetch(`/analytics/overview?${qs.toString()}`, {
          headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
        }),
        fetch(
          `/analytics/performance?${new URLSearchParams({
            tenant_id: tenantId,
            period: dateRange,
            metric: "sessions",
          }).toString()}`,
          { headers: { Accept: "application/json", "X-Tenant-ID": tenantId } }
        ),
      ]);
      if (!ovRes.ok) {
        setError(`Overview: HTTP ${ovRes.status}`);
        setOverview(null);
      } else {
        const json = (await ovRes.json()) as OverviewPayload;
        setOverview(json);
      }
      if (perfRes.ok) {
        const pj = (await perfRes.json()) as { data?: { date: string; value: number }[] };
        const rows = Array.isArray(pj.data) ? pj.data.map((d) => ({ date: d.date, value: d.value })) : [];
        setPerfSeries(rows);
      } else {
        setPerfSeries([]);
      }
    } catch (e) {
      setError((e as Error)?.message ?? "Error de red");
      setOverview(null);
      setPerfSeries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, dateRange]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    void load();
  };

  const top = overview?.top_campaigns ?? [];
  const totals = top.reduce(
    (acc, c) => {
      acc.sent += Number(c.sent ?? 0);
      acc.opened += Number(c.opened ?? 0);
      acc.clicked += Number(c.clicked ?? 0);
      acc.converted += Number(c.converted ?? 0);
      return acc;
    },
    { sent: 0, opened: 0, clicked: 0, converted: 0 }
  );
  const funnelSteps =
    totals.sent > 0
      ? [
          { label: "Enviados (top campañas)", value: totals.sent, pct: 100 },
          {
            label: "Abiertos",
            value: totals.opened,
            pct: Math.min(100, Math.round((totals.opened / totals.sent) * 1000) / 10),
          },
          {
            label: "Clicks",
            value: totals.clicked,
            pct: Math.min(100, Math.round((totals.clicked / totals.sent) * 1000) / 10),
          },
          {
            label: "Conversiones",
            value: totals.converted,
            pct: Math.min(100, Math.round((totals.converted / totals.sent) * 1000) / 10),
          },
        ]
      : [];

  const dataSource = overview?.data_source ?? "unknown";
  const sourceLabel =
    dataSource === "database"
      ? "Fuente: base de datos (métricas diarias y campañas del tenant)."
      : dataSource === "fallback"
        ? "Fuente: respaldo del servidor (sin lectura completa de BD para este período)."
        : `Fuente: ${dataSource}`;

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <span className="text-sm text-gray-400">Analytics</span>
      </NavigationBar>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white m-0">Analytics</h1>
          <p className="text-gray-400 mt-1 m-0">Métricas reales del backend (sin datos de demostración).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || !tenantId}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error ? (
        <GlassCard className="p-4 mb-6 border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-100/90 text-sm m-0">{error}</p>
        </GlassCard>
      ) : null}

      <GlassCard className="p-4 mb-6 border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <BarChart3 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{sourceLabel}</span>
        </div>
      </GlassCard>

      {overview ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-violet-400" />
                <TrendMini m={overview.mau} />
              </div>
              <div className="text-2xl font-bold text-white">{formatNum(overview.mau?.current ?? 0)}</div>
              <div className="text-sm text-gray-400">MAU (estim.)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <TrendMini m={overview.dau} />
              </div>
              <div className="text-2xl font-bold text-white">{formatNum(overview.dau?.current ?? 0)}</div>
              <div className="text-sm text-gray-400">DAU (prom.)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <TrendMini m={overview.daily_sessions} />
              </div>
              <div className="text-2xl font-bold text-white">{formatNum(overview.daily_sessions?.current ?? 0)}</div>
              <div className="text-sm text-gray-400">Sesiones (prom.)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <TrendMini m={overview.new_users} />
              </div>
              <div className="text-2xl font-bold text-white">{formatNum(overview.new_users?.current ?? 0)}</div>
              <div className="text-sm text-gray-400">Nuevos usuarios</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-2xl font-bold text-white">{overview.active_campaigns ?? 0}</div>
              <div className="text-sm text-gray-400">Campañas activas (muestra)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Ingresos</span>
                <TrendMini m={overview.total_revenue} />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNum(overview.total_revenue?.current ?? 0)}
              </div>
              <div className="text-sm text-gray-400">Suma período (daily_metrics)</div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 m-0">Sesiones por día</h3>
              {perfSeries.length === 0 ? (
                <p className="text-gray-500 text-sm m-0">No hay puntos en daily_metrics para este período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={perfSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid #333" }} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Sesiones" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 m-0">Embudo agregado (muestra de campañas)</h3>
              {funnelSteps.length === 0 ? (
                <p className="text-gray-500 text-sm m-0">
                  Sin campañas en la muestra o métricas en cero. Los envíos reales aparecen cuando hay campañas con
                  métricas en BD.
                </p>
              ) : (
                <div className="space-y-4">
                  {funnelSteps.map((step, i) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{step.label}</span>
                        <span className="text-white">
                          {step.value.toLocaleString()} ({step.pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, step.pct)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className="h-full rounded-full bg-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard className="p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 m-0">Campañas (muestra desde BD)</h3>
            {top.length === 0 ? (
              <p className="text-gray-500 text-sm m-0">No hay filas de campaña para este tenant.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-sm text-gray-400">Campaña</th>
                      <th className="text-left p-3 text-sm text-gray-400">Estado</th>
                      <th className="text-right p-3 text-sm text-gray-400">Enviados</th>
                      <th className="text-right p-3 text-sm text-gray-400">Abierto %</th>
                      <th className="text-right p-3 text-sm text-gray-400">CTR %</th>
                      <th className="text-right p-3 text-sm text-gray-400">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((c) => {
                      const sent = Number(c.sent ?? 0);
                      const opened = Number(c.opened ?? 0);
                      const openPct = sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0;
                      return (
                        <tr key={String(c.id ?? c.name)} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white font-medium">{String(c.name ?? "—")}</td>
                          <td className="p-3 text-gray-400 text-sm">{String(c.status ?? "—")}</td>
                          <td className="p-3 text-right text-gray-300">{sent.toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-300">{openPct}%</td>
                          <td className="p-3 text-right text-gray-300">{Number(c.ctr ?? 0)}%</td>
                          <td className="p-3 text-right text-gray-300">{Number(c.conversion_rate ?? 0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      ) : (
        <GlassCard className="p-8 text-center text-gray-400">Sin datos de overview.</GlassCard>
      )}
    </div>
  );
}
