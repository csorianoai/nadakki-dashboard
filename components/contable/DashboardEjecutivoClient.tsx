"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  RefreshCw,
  Loader2,
  Activity,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Button, Select } from "@/components/forge";
import {
  ContableApiError,
  getEstadoResultados,
  getSituacionFinanciera,
  getGastosMonitor,
  getSugerenciasAgente,
  listPeriodos,
} from "@/app/hooks/contable";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import GlassCard from "@/components/ui/GlassCard";
import type {
  EstadoResultadosReport,
  SituacionFinancieraReport,
  GastosMonitorReport,
  AgenteSugerenciasResponse,
  PeriodoContable,
} from "@/types/contable";
import { cn } from "@/lib/utils";

// ── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  ingresos: "#10b981",
  costos: "#f59e0b",
  gastos: "#ef4444",
  utilidad: "#6366f1",
  activo: "#10b981",
  pasivo: "#f59e0b",
  patrimonio: "#6366f1",
  chart: ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

// ── Sub-components ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; color: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/20 bg-zinc-900/95 p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-zinc-300">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-mono font-semibold text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  title,
  value,
  changePct,
  icon: Icon,
  borderColor,
  valueColor,
  subtitle,
}: {
  title: string;
  value: string;
  changePct?: number;
  icon: React.ElementType;
  borderColor: string;
  valueColor: string;
  subtitle?: string;
}) {
  const isPositive = (changePct ?? 0) >= 0;
  return (
    <div className={cn("rounded-xl border p-5 bg-white/[0.02]", borderColor)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{title}</p>
          <p className={cn("mt-1 font-mono text-2xl font-bold", valueColor)}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      {changePct !== undefined && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-semibold", isPositive ? "text-emerald-400" : "text-rose-400")}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(changePct).toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  );
}

function HealthScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500";
  const label = score >= 70 ? "BUENO" : score >= 40 ? "REGULAR" : "CRÍTICO";
  const textColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="h-3 w-full rounded-full bg-white/10">
          <div className={cn("h-3 rounded-full transition-all", color)} style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
      </div>
      <span className={cn("font-mono text-lg font-bold", textColor)}>{score}/100</span>
      <span className={cn("text-xs font-bold", textColor)}>{label}</span>
    </div>
  );
}

function TendenciaIcon({ tendencia }: { tendencia: "up" | "down" | "stable" }) {
  if (tendencia === "up") return <ArrowUpRight className="h-4 w-4 text-rose-400" />;
  if (tendencia === "down") return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
  return <Minus className="h-4 w-4 text-zinc-400" />;
}

// ── Main component ──────────────────────────────────────────────────────────

export function DashboardEjecutivoClient() {
  const tenantId = useContableTenantId();
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [estadoResultados, setEstadoResultados] = useState<EstadoResultadosReport | null>(null);
  const [situacionFinanciera, setSituacionFinanciera] = useState<SituacionFinancieraReport | null>(null);
  const [gastosMonitor, setGastosMonitor] = useState<GastosMonitorReport | null>(null);
  const [agenteIA, setAgenteIA] = useState<AgenteSugerenciasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load periodos on mount
  useEffect(() => {
    if (!tenantId) return;
    void listPeriodos(tenantId, new Date().getFullYear())
      .then((p) => {
        setPeriodos(p);
        const open = p.find((x) => x.status === "open") ?? p[0];
        if (open) setPeriodoId(open.id);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [tenantId]);

  // Derive dates from selected period
  const selectedPeriodo = periodos.find((p) => p.id === periodoId);

  const loadReports = useCallback(async () => {
    if (!tenantId || !periodoId || !selectedPeriodo) return;
    setLoading(true);

    const desde = selectedPeriodo.fecha_inicio;
    const hasta = selectedPeriodo.fecha_fin;
    const fecha = hasta;

    const [erResult, sfResult, gmResult] = await Promise.allSettled([
      getEstadoResultados(tenantId, desde, hasta),
      getSituacionFinanciera(tenantId, fecha),
      getGastosMonitor(tenantId, periodoId),
    ]);

    setEstadoResultados(erResult.status === "fulfilled" ? erResult.value : null);
    setSituacionFinanciera(sfResult.status === "fulfilled" ? sfResult.value : null);
    setGastosMonitor(gmResult.status === "fulfilled" ? gmResult.value : null);
    setLoading(false);
    setLastUpdated(new Date());

    // Load IA separately (slower)
    setLoadingIA(true);
    try {
      setAgenteIA(await getSugerenciasAgente(tenantId, periodoId));
    } catch {
      setAgenteIA(null);
    } finally {
      setLoadingIA(false);
    }
  }, [tenantId, periodoId, selectedPeriodo]);

  useEffect(() => {
    if (periodoId && selectedPeriodo) {
      void loadReports();
    }
  }, [periodoId, selectedPeriodo, loadReports]);

  // ── Derived data ────────────────────────────────────────────────────────

  const er = estadoResultados;
  const sf = situacionFinanciera;
  const gm = gastosMonitor;

  const margenNeto = er?.margen_neto_pct ?? 0;
  const margenColor = margenNeto >= 20 ? "border-emerald-500/20" : margenNeto >= 10 ? "border-amber-500/20" : "border-rose-500/20";
  const margenValueColor = margenNeto >= 20 ? "text-emerald-200" : margenNeto >= 10 ? "text-amber-200" : "text-rose-200";

  // Area chart data — build from ingresos/gastos rows or simple summary
  const areaData = er
    ? [
        {
          name: selectedPeriodo?.label ?? "Período",
          Ingresos: er.total_ingresos,
          Gastos: er.total_gastos,
          "Utilidad Neta": er.utilidad_neta,
        },
      ]
    : [];

  // Bar chart data
  const barData = er
    ? [
        { name: "Ingresos", value: er.total_ingresos },
        { name: "Costos", value: er.total_costos },
        { name: "Gastos", value: er.total_gastos },
      ]
    : [];

  const barColors = [COLORS.ingresos, COLORS.costos, COLORS.gastos];

  // Pie chart data from gastos breakdown
  const pieData = er?.gastos?.length
    ? er.gastos.map((g) => ({ name: g.nombre, value: Math.abs(g.total) }))
    : [];

  // Balance sheet data
  const activosTotal = sf?.activos?.total ?? 0;
  const pasivosTotal = sf?.pasivos?.total ?? 0;
  const patrimonioTotal = sf?.patrimonio?.total ?? 0;
  const activosCorrPct = activosTotal > 0 ? ((sf?.activos?.corriente ?? 0) / activosTotal) * 100 : 0;
  const pasivosCorrPct = pasivosTotal > 0 ? ((sf?.pasivos?.corriente ?? 0) / pasivosTotal) * 100 : 0;

  // ── Empty state ───────────────────────────────────────────────────────

  const hasNoData = !loading && !er && !sf && !gm;

  if (!tenantId) return null;

  if (hasNoData && periodos.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <GlassCard hover={false} className="p-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BarChart3 className="mb-4 h-16 w-16 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-300">Sin datos financieros todavía</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              Crea un período contable y registra algunos asientos para ver el dashboard ejecutivo con análisis completo.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/contable/periodos">
                <Button>Crear Período</Button>
              </Link>
              <Link href="/contable/asientos/nuevo">
                <Button variant="secondary">Registrar Asiento</Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      {/* S1 — Header */}
      <GlassCard hover={false} className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400/90">Contable</p>
          <h1 className="text-2xl font-bold text-white">Dashboard Ejecutivo Financiero</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Análisis completo de rendimiento financiero
            {lastUpdated && (
              <span className="ml-2 text-zinc-600">
                — actualizado {lastUpdated.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              label="Período"
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              options={periodos.map((p) => ({ value: p.id, label: `${p.label} (${p.status})` }))}
            />
          </div>
          <Button variant="secondary" onClick={() => void loadReports()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Cargando dashboard ejecutivo...</span>
        </div>
      ) : (
        <>
          {/* S2 — KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Ingresos"
              value={fmt(er?.total_ingresos ?? 0)}
              icon={DollarSign}
              borderColor="border-emerald-500/20"
              valueColor="text-emerald-200"
              subtitle={selectedPeriodo?.label}
            />
            <KpiCard
              title="Gastos"
              value={fmt(er?.total_gastos ?? 0)}
              changePct={gm?.variacion_total_pct}
              icon={AlertTriangle}
              borderColor="border-amber-500/20"
              valueColor="text-amber-200"
            />
            <KpiCard
              title="Utilidad Neta"
              value={fmt(er?.utilidad_neta ?? 0)}
              icon={TrendingUp}
              borderColor="border-indigo-500/20"
              valueColor="text-indigo-200"
            />
            <KpiCard
              title="Margen Neto"
              value={`${margenNeto.toFixed(1)}%`}
              icon={Target}
              borderColor={margenColor}
              valueColor={margenValueColor}
            />
          </div>

          {/* S3 — Area chart */}
          {areaData.length > 0 && (
            <GlassCard hover={false} className="p-5">
              <h3 className="mb-4 text-sm font-bold text-white">Resumen financiero del período</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 11 }} />
                  <Area type="monotone" dataKey="Ingresos" stroke={COLORS.ingresos} fill={COLORS.ingresos} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="Gastos" stroke={COLORS.gastos} fill={COLORS.gastos} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="Utilidad Neta" stroke={COLORS.utilidad} fill={COLORS.utilidad} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* S4 — Bar chart + Pie chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            {barData.length > 0 && (
              <GlassCard hover={false} className="p-5">
                <h3 className="mb-4 text-sm font-bold text-white">Ingresos vs Costos vs Gastos</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={barColors[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}

            {pieData.length > 0 && (
              <GlassCard hover={false} className="p-5">
                <h3 className="mb-4 text-sm font-bold text-white">Distribución de gastos</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={false} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS.chart[i % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 11 }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </GlassCard>
            )}

            {pieData.length === 0 && barData.length > 0 && (
              <GlassCard hover={false} className="flex items-center justify-center p-5">
                <p className="text-sm text-zinc-500">Sin desglose de gastos disponible para este período.</p>
              </GlassCard>
            )}
          </div>

          {/* S5 — Balance Sheet Summary */}
          {sf && (
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <GlassCard hover={false} className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Total Activos</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-100">{fmt(activosTotal)}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${activosCorrPct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Corriente: {activosCorrPct.toFixed(0)}% · No corriente: {(100 - activosCorrPct).toFixed(0)}%
                  </p>
                </GlassCard>
                <GlassCard hover={false} className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Total Pasivos</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-amber-100">{fmt(pasivosTotal)}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${pasivosCorrPct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Corriente: {pasivosCorrPct.toFixed(0)}% · No corriente: {(100 - pasivosCorrPct).toFixed(0)}%
                  </p>
                </GlassCard>
                <GlassCard hover={false} className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Total Patrimonio</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-indigo-100">{fmt(patrimonioTotal)}</p>
                </GlassCard>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold",
                  sf?.ecuacion_cuadra
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200",
                )}
              >
                {sf?.ecuacion_cuadra ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                Ecuación contable: Activos ({fmt(activosTotal)}) = Pasivos ({fmt(pasivosTotal)}) + Patrimonio ({fmt(patrimonioTotal)})
                {sf?.ecuacion_cuadra ? " ✓" : " — NO CUADRA"}
              </div>
            </div>
          )}

          {/* S6 — Monitor de gastos */}
          {gm && (gm.gastos?.length ?? 0) > 0 && (
            <GlassCard hover={false} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  <AlertTriangle className="mr-2 inline h-4 w-4 text-amber-400" />
                  Monitor de Gastos — Alertas y Variaciones
                </h3>
                <span className={cn("text-xs font-bold", (gm.alertas_count ?? 0) > 0 ? "text-rose-400" : "text-emerald-400")}>
                  {gm.alertas_count ?? 0} alerta{(gm.alertas_count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                      <th className="px-4 py-3">Cuenta</th>
                      <th className="px-4 py-3 text-right">Actual</th>
                      <th className="px-4 py-3 text-right">Anterior</th>
                      <th className="px-4 py-3 text-right">Var%</th>
                      <th className="px-4 py-3 text-center">Tendencia</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gm.gastos?.map((g) => (
                      <tr key={g.cuenta_id} className="border-b border-white/5">
                        <td className="px-4 py-2">
                          <span className="font-mono text-xs text-zinc-500 mr-2">{g.codigo}</span>
                          {g.nombre}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">{fmt(g.periodo_actual)}</td>
                        <td className="px-4 py-2 text-right font-mono text-zinc-400">{fmt(g.periodo_anterior)}</td>
                        <td
                          className={cn(
                            "px-4 py-2 text-right font-mono",
                            g.variacion_pct > 0 ? "text-rose-300" : g.variacion_pct < 0 ? "text-emerald-300" : "text-zinc-400",
                          )}
                        >
                          {fmtPct(g.variacion_pct)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <TendenciaIcon tendencia={g.tendencia} />
                        </td>
                        <td className="px-4 py-2">
                          {g.alerta ? (
                            <span className="inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-200 ring-1 ring-rose-400/30">
                              ALERTA
                            </span>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500/60" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* S7 — Consultor IA */}
          <GlassCard hover={false} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Consultor IA — Salud Financiera</h3>
            </div>

            {loadingIA ? (
              <div className="flex items-center gap-2 py-6 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Analizando salud financiera...</span>
              </div>
            ) : agenteIA ? (
              <div className="space-y-4">
                <HealthScoreBar score={agenteIA.score_salud_financiera} />

                {agenteIA.resumen_ejecutivo && (
                  <p className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm italic text-zinc-300">
                    &ldquo;{agenteIA.resumen_ejecutivo}&rdquo;
                  </p>
                )}

                {(agenteIA.sugerencias?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sugerencias prioritarias</p>
                    {agenteIA.sugerencias.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-3 py-2 text-xs",
                          s.prioridad === "alta"
                            ? "border-rose-500/20 bg-rose-500/5"
                            : s.prioridad === "media"
                              ? "border-amber-500/20 bg-amber-500/5"
                              : "border-emerald-500/20 bg-emerald-500/5",
                        )}
                      >
                        <span className="mt-0.5">
                          {s.prioridad === "alta" ? "🔴" : s.prioridad === "media" ? "🟡" : "🟢"}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{s.titulo}</p>
                          <p className="mt-0.5 text-zinc-400">{s.accion_sugerida}</p>
                          {s.impacto_estimado_dop != null && (
                            <p className="mt-1 font-mono text-zinc-500">Impacto estimado: {fmt(s.impacto_estimado_dop)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <Link href="/contable/agente-ia" className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                      Ver análisis completo →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-4 text-sm text-zinc-500">Análisis de IA no disponible todavía para este período.</p>
            )}
          </GlassCard>

          {/* S8 — Quick actions */}
          <GlassCard hover={false} className="p-5">
            <h3 className="mb-3 text-sm font-bold text-white">Acciones Rápidas</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/contable/asientos/nuevo">
                <Button>Crear Asiento</Button>
              </Link>
              <Link href="/contable/libro-mayor">
                <Button variant="secondary">Ver Mayor</Button>
              </Link>
              <Link href="/contable/balance-comprobacion">
                <Button variant="secondary">Balance Comprobación</Button>
              </Link>
              <Link href="/contable/estado-resultados">
                <Button variant="secondary">Estado de Resultados</Button>
              </Link>
              <Link href="/contable/situacion-financiera">
                <Button variant="secondary">Situación Financiera</Button>
              </Link>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
