"use client";

import { useEffect, useState, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchExpedientes,
  fetchExpediente,
  fetchExportacionesGlobal,
  fetchTimeline,
  fetchNotas,
  fetchKpisEjecutivo,
  fetchAlertasEjecutivo,
  fetchResumenPortafolio,
  fetchReporteIndividual,
  fetchComparativoExpVsPortafolio,
  fetchComparativoPeriodos,
  fetchExportStatus,
  fetchExportHistorial,
  downloadCsvBatch,
  downloadPdfBatch,
  downloadSnapshot,
  type Expediente,
  type Exportacion,
  type KpisEjecutivo,
  type AlertaEjecutiva,
  type ResumenPortafolio,
  type ReporteIndividual,
  type ComparativoExpVsPortafolio,
  type ComparativoPeriodos,
  type ExportStatus,
} from "@/lib/api/sic";
import { LoadingSic, ErrorSic } from "@/components/sic/EstadosSic";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Download,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  FileOutput,
  GitCompare,
} from "lucide-react";

type TabId = "ejecutivo" | "individual" | "portafolio" | "exportaciones" | "comparativos";

const TAB_CONFIG: { id: TabId; label: string }[] = [
  { id: "ejecutivo", label: "Resumen ejecutivo" },
  { id: "individual", label: "Reporte individual" },
  { id: "portafolio", label: "Portafolio" },
  { id: "exportaciones", label: "Exportaciones" },
  { id: "comparativos", label: "Comparativos" },
];

const ACCENT = "#0ea5e9";
const RISK_COLORS: Record<string, string> = {
  BAJO: "#22c55e",
  MEDIO: "#eab308",
  ALTO: "#f97316",
  CRITICO: "#ef4444",
};
const STATUS_COLORS: Record<string, string> = {
  APROBADO: "#22c55e",
  RECHAZADO: "#ef4444",
  REVISION_MANUAL: "#eab308",
  PENDIENTE: "#64748b",
  EN_REVISION_ANALISTA: "#eab308",
  EN_ANALISIS_IA: "#0ea5e9",
  EN_COMITE: "#8b5cf6",
  REQUIERE_INFORMACION: "#f97316",
  EN_VALIDACION: "#64748b",
};

function getRiskLevel(conf: number | undefined): string {
  const c = conf ?? 0;
  if (c >= 0.7) return "BAJO";
  if (c >= 0.5) return "MEDIO";
  if (c >= 0.3) return "ALTO";
  return "CRITICO";
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        background: "rgba(26,31,46,0.98)",
        borderColor: "rgba(55,65,81,0.6)",
      }}
    >
      <dt className="text-slate-500 text-xs uppercase font-600">{label}</dt>
      <dd className="text-slate-100 text-xl font-700 mt-1">{value}</dd>
    </div>
  );
}

// Mock fallback expedientes for when API fails
function mockExpedientes(): Expediente[] {
  const base = [
    { referencia_cliente: "CLI-001", estado_expediente: "EN_REVISION_ANALISTA", decision_actual: "APROBADO", confianza_decision: 0.85, fecha_creacion: "2025-02-25" },
    { referencia_cliente: "CLI-002", estado_expediente: "EN_COMITE", decision_actual: "RECHAZADO", confianza_decision: 0.72, fecha_creacion: "2025-02-24" },
    { referencia_cliente: "CLI-003", estado_expediente: "APROBADO", decision_actual: "APROBADO", confianza_decision: 0.91, fecha_creacion: "2025-02-23" },
    { referencia_cliente: "CLI-004", estado_expediente: "EN_ANALISIS_IA", decision_actual: "Pendiente", confianza_decision: 0.65, fecha_creacion: "2025-02-26" },
    { referencia_cliente: "CLI-005", estado_expediente: "RECHAZADO", decision_actual: "RECHAZADO", confianza_decision: 0.58, fecha_creacion: "2025-02-22" },
    { referencia_cliente: "CLI-006", estado_expediente: "EN_VALIDACION", decision_actual: "Pendiente", confianza_decision: 0.4, fecha_creacion: "2025-02-26" },
    { referencia_cliente: "CLI-007", estado_expediente: "EN_REVISION_ANALISTA", decision_actual: "APROBADO", confianza_decision: 0.88, fecha_creacion: "2025-02-25" },
    { referencia_cliente: "CLI-008", estado_expediente: "REQUIERE_INFORMACION", decision_actual: "RECHAZADO", confianza_decision: 0.45, fecha_creacion: "2025-02-24" },
  ];
  return base.map((e, i) => ({
    ...e,
    expediente_id: `EXP-MOCK-${String(i + 1).padStart(4, "0")}`,
  })) as Expediente[];
}

// Mock weekly volume (8 weeks)
function mockWeeklyVolume() {
  const weeks: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeks.push(`S${i}`);
  }
  return weeks.map((w, i) => ({
    semana: w,
    volumen: Math.floor(12 + Math.random() * 8 + i * 0.5),
  }));
}

// Mock 12-week volume trend
function mockVolumeTrend() {
  return Array.from({ length: 12 }, (_, i) => ({
    semana: `W${12 - i}`,
    volumen: Math.floor(15 + Math.random() * 12 - i * 0.3),
  }));
}

export default function SicReportesPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [activeTab, setActiveTab] = useState<TabId>("ejecutivo");
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "mock">("api");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exps, exts] = await Promise.all([
        fetchExpedientes(tenant).catch(() => mockExpedientes()),
        fetchExportacionesGlobal(tenant, 10).catch(() => []),
      ]);
      setExpedientes(Array.isArray(exps) && exps.length > 0 ? exps : mockExpedientes());
      setExportaciones(Array.isArray(exts) ? exts : []);
      setDataSource(Array.isArray(exps) && exps.length > 0 ? "api" : "mock");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setExpedientes(mockExpedientes());
      setExportaciones([]);
      setDataSource("mock");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side aggregations (fallback when backend KPIs unavailable)
  const aprobados = expedientes.filter((e) => e.estado_expediente === "APROBADO").length;
  const rechazados = expedientes.filter((e) => e.estado_expediente === "RECHAZADO").length;
  const enRevision = expedientes.filter((e) =>
    ["EN_REVISION_ANALISTA", "EN_ANALISIS_IA", "EN_COMITE", "REQUIERE_INFORMACION"].includes(
      e.estado_expediente || ""
    )
  ).length;
  const scores = expedientes
    .map((e) => (e.confianza_decision ?? 0) > 0 ? (e.confianza_decision ?? 0) : null)
    .filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "—";
  const riskCounts = expedientes.reduce<Record<string, number>>((acc, e) => {
    const r = getRiskLevel(e.confianza_decision);
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  const riskDistribution = ["BAJO", "MEDIO", "ALTO", "CRITICO"].map((r) => ({
    name: r,
    value: riskCounts[r] ?? 0,
    color: RISK_COLORS[r],
  })).filter((d) => d.value > 0);
  const top5Risk = [...expedientes]
    .sort((a, b) => (a.confianza_decision ?? 1) - (b.confianza_decision ?? 1))
    .slice(0, 5);

  const weeklyVolume = expedientes.length > 0
    ? (() => {
        const byWeek: Record<string, number> = {};
        expedientes.forEach((e) => {
          const d = e.fecha_creacion || "";
          const week = d.slice(0, 10);
          byWeek[week] = (byWeek[week] ?? 0) + 1;
        });
        const keys = Object.keys(byWeek).sort();
        if (keys.length < 2) return mockWeeklyVolume();
        return keys.slice(-8).map((k) => ({ semana: k.slice(5), volumen: byWeek[k] }));
      })()
    : mockWeeklyVolume();

  if (loading && expedientes.length === 0) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando reportes" mensaje="Obteniendo expedientes y exportaciones..." />
      </div>
    );
  }

  return (
    <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Hub de Reportes SIC</h1>
            <p className="text-slate-500 text-sm m-0">
              Reportes ejecutivos, individuales, portafolio, exportaciones y comparativos
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dataSource === "mock" && (
              <span className="text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10">
                Usando datos de respaldo
              </span>
            )}
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-slate-600 bg-slate-800/60 text-slate-300 text-sm hover:bg-slate-700/60"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorSic titulo="Error al cargar datos" mensaje={error}>
              <button
                onClick={loadData}
                className="mt-2 px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30"
              >
                Reintentar
              </button>
            </ErrorSic>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-600 transition-colors ${
                activeTab === t.id
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:border-slate-600"
              }`}
              style={
                activeTab === t.id
                  ? { background: ACCENT, borderColor: ACCENT }
                  : { background: "rgba(26,31,46,0.6)", borderColor: "rgba(55,65,81,0.6)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "ejecutivo" && (
          <TabResumenEjecutivo
            tenant={tenant}
            expedientes={expedientes}
            aprobados={aprobados}
            rechazados={rechazados}
            enRevision={enRevision}
            avgScore={avgScore}
            riskDistribution={riskDistribution}
            top5Risk={top5Risk}
            weeklyVolume={weeklyVolume}
          />
        )}
        {activeTab === "individual" && (
          <TabReporteIndividual expedientes={expedientes} tenant={tenant} loading={loading} onRetry={loadData} />
        )}
        {activeTab === "portafolio" && (
          <TabPortafolio tenant={tenant} expedientes={expedientes} weeklyVolume={weeklyVolume} mockVolumeTrend={mockVolumeTrend} />
        )}
        {activeTab === "exportaciones" && (
          <TabExportaciones exportaciones={exportaciones} tenant={tenant} onRetry={loadData} />
        )}
        {activeTab === "comparativos" && (
          <TabComparativos expedientes={expedientes} tenant={tenant} />
        )}
    </div>
  );
}

// ——— TAB 1: Resumen Ejecutivo ———
function TabResumenEjecutivo({
  tenant,
  expedientes,
  aprobados,
  rechazados,
  enRevision,
  avgScore,
  riskDistribution,
  top5Risk,
  weeklyVolume,
}: {
  tenant: string;
  expedientes: Expediente[];
  aprobados: number;
  rechazados: number;
  enRevision: number;
  avgScore: string;
  riskDistribution: { name: string; value: number; color: string }[];
  top5Risk: Expediente[];
  weeklyVolume: { semana: string; volumen: number }[];
}) {
  const [kpis, setKpis] = useState<KpisEjecutivo | null>(null);
  const [alertas, setAlertas] = useState<AlertaEjecutiva[]>([]);
  const [kpiSource, setKpiSource] = useState<"api" | "client">("client");

  useEffect(() => {
    Promise.all([
      fetchKpisEjecutivo(tenant).catch(() => null),
      fetchAlertasEjecutivo(tenant, 5).catch(() => null),
    ]).then(([k, a]) => {
      if (k) {
        setKpis(k);
        setKpiSource("api");
      }
      if (a) setAlertas(a.alertas ?? []);
    });
  }, [tenant]);

  // Use backend KPIs if available, else client-side fallback
  const total = kpis?.total_expedientes ?? expedientes.length;
  const kpiAprobados = kpis?.aprobados ?? aprobados;
  const kpiRechazados = kpis?.rechazados ?? rechazados;
  const kpiRevision = kpis?.revision_manual ?? enRevision;
  const kpiScore = kpis ? kpis.score_promedio.toFixed(2) : avgScore;
  const kpiAlertas = kpis?.alertas_activas ?? expedientes.filter((e) =>
    ["REQUIERE_INFORMACION", "EN_COMITE"].includes(e.estado_expediente || "")
  ).length;
  const kpiTiempo = kpis?.tiempo_promedio_analisis_horas;

  // Build risk distribution from backend KPIs or client-side
  const riskData = riskDistribution;

  return (
    <div className="space-y-6">
      {kpiSource === "api" && (
        <span className="text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10">
          KPIs desde backend
        </span>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <KpiCard label="Total expedientes" value={total} />
        <KpiCard label="Aprobados" value={kpiAprobados} />
        <KpiCard label="Rechazados" value={kpiRechazados} />
        <KpiCard label="En revisión" value={kpiRevision} />
        <KpiCard label="Pendientes" value={kpis?.pendientes ?? "—"} />
        <KpiCard label="Score promedio" value={kpiScore} />
        <KpiCard label="Alertas activas" value={kpiAlertas} />
        <KpiCard label="Tiempo prom. (h)" value={kpiTiempo != null ? kpiTiempo : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Distribución por riesgo</h2>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm py-8 text-center">Sin datos de riesgo</p>
          )}
        </div>
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Volumen semanal (últimas 8)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
              <XAxis dataKey="semana" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar dataKey="volumen" fill={ACCENT} radius={[4, 4, 0, 0]} name="Expedientes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 risk — use backend alertas if available, else client-side */}
      <div
        className="rounded-lg p-4 border"
        style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
      >
        <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Top expedientes de mayor riesgo</h2>
        {alertas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left font-600">Expediente</th>
                  <th className="px-4 py-2 text-left font-600">Cliente</th>
                  <th className="px-4 py-2 text-left font-600">Estado</th>
                  <th className="px-4 py-2 text-right font-600">Score</th>
                  <th className="px-4 py-2 text-left font-600">Nivel</th>
                  <th className="px-4 py-2 text-right font-600">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((a) => (
                  <tr key={a.expediente_id} className="border-b border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{a.expediente_id}</td>
                    <td className="px-4 py-2 text-slate-300">{a.referencia_cliente ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{a.estado ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {a.confidence_score != null ? `${(a.confidence_score * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-600"
                        style={{
                          background: `${RISK_COLORS[a.risk_level.toUpperCase()] ?? "#64748b"}22`,
                          color: RISK_COLORS[a.risk_level.toUpperCase()] ?? "#64748b",
                        }}
                      >
                        {a.risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{a.alert_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : top5Risk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left font-600">Expediente</th>
                  <th className="px-4 py-2 text-left font-600">Cliente</th>
                  <th className="px-4 py-2 text-left font-600">Estado</th>
                  <th className="px-4 py-2 text-right font-600">Score</th>
                  <th className="px-4 py-2 text-left font-600">Nivel</th>
                </tr>
              </thead>
              <tbody>
                {top5Risk.map((e) => (
                  <tr key={e.expediente_id} className="border-b border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{e.expediente_id}</td>
                    <td className="px-4 py-2 text-slate-300">{e.referencia_cliente ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{e.estado_expediente ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {((e.confianza_decision ?? 0) * 100).toFixed(0)}%
                    </td>
                    <td>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-600"
                        style={{
                          background: `${RISK_COLORS[getRiskLevel(e.confianza_decision)]}22`,
                          color: RISK_COLORS[getRiskLevel(e.confianza_decision)],
                        }}
                      >
                        {getRiskLevel(e.confianza_decision)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4">Sin expedientes con datos de riesgo</p>
        )}
      </div>
    </div>
  );
}

// ——— TAB 2: Reporte Individual ———
function TabReporteIndividual({
  expedientes,
  tenant,
  loading,
  onRetry,
}: {
  expedientes: Expediente[];
  tenant: string;
  loading: boolean;
  onRetry: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [report, setReport] = useState<ReporteIndividual | null>(null);
  // Fallback state when backend individual report is unavailable
  const [detalle, setDetalle] = useState<Expediente | null>(null);
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [notas, setNotas] = useState<unknown[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");

  useEffect(() => {
    if (!selectedId) {
      setReport(null);
      setDetalle(null);
      setTimeline([]);
      setNotas([]);
      setSource("fallback");
      return;
    }
    setLoadingDetail(true);

    // Try backend individual report first, fallback to legacy fetch
    fetchReporteIndividual(selectedId, tenant)
      .then((rpt) => {
        if (rpt && !("error" in rpt)) {
          setReport(rpt);
          setSource("backend");
          setDetalle(null);
          setTimeline(rpt.trazabilidad ?? []);
          setNotas(rpt.analyst_notes ?? []);
        } else {
          throw new Error("fallback");
        }
      })
      .catch(() => {
        setReport(null);
        setSource("fallback");
        return Promise.all([
          fetchExpediente(selectedId, tenant).catch(() => null),
          fetchTimeline(selectedId, tenant).catch(() => []),
          fetchNotas(selectedId, tenant).catch(() => []),
        ])
          .then(([exp, tl, nts]) => {
            const resolved = exp ?? expedientes.find((e) => e.expediente_id === selectedId) ?? null;
            setDetalle(resolved);
            setTimeline(Array.isArray(tl) ? tl : []);
            setNotas(Array.isArray(nts) ? nts : []);
          })
          .catch(() => {
            const fallback = expedientes.find((e) => e.expediente_id === selectedId) ?? null;
            setDetalle(fallback);
            setTimeline([]);
            setNotas([]);
          });
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedId, tenant, expedientes]);

  // Normalize data from either backend report or fallback
  const e = report
    ? ({
        expediente_id: report.expediente_id,
        referencia_cliente: report.referencia_cliente,
        estado_expediente: report.estado,
        confianza_decision: report.score_summary?.confidence_score ?? undefined,
        decision_actual: report.decision?.tipo_decision as string ?? report.decision?.decision_actual as string ?? undefined,
        decision_final_humana: report.decision?.decision_final_humana as string ?? undefined,
        override_justificacion: report.decision?.justificacion as string ?? undefined,
        metadata_json: report.metadata,
      } as Expediente)
    : detalle;

  const score = report
    ? (report.score_summary?.confidence_score ?? 0)
    : (e?.confianza_decision ?? 0);
  const scorePct = (score * 100).toFixed(0);
  const scoreColor =
    score >= 0.7 ? "#22c55e" : score >= 0.5 ? "#eab308" : "#ef4444";
  const riskLevel = report?.score_summary?.risk_level ?? getRiskLevel(score);
  const rulesFired = report?.score_summary?.rules_fired ?? [];

  // Income breakdown: prefer backend report, then metadata, then mock
  const incomeBreakdown = report?.income_report && typeof report.income_report === "object"
    ? (report.income_report as { breakdown?: { name: string; value: number }[] })?.breakdown ?? []
    : e?.metadata_json && typeof (e.metadata_json as { income_report?: unknown }).income_report === "object"
      ? (e.metadata_json as { income_report: { breakdown?: { name: string; value: number }[] } }).income_report?.breakdown ?? []
      : [
          { name: "Salario", value: 65 },
          { name: "Otros ingresos", value: 20 },
          { name: "Inversiones", value: 15 },
        ];

  // Outlier flags: prefer backend report, then metadata
  const outlierFlags = report?.outlier_flags
    ? (Array.isArray(report.outlier_flags) ? report.outlier_flags : [])
    : (e?.metadata_json as { income_report?: { outlier_flags?: string[] }; alerts?: string[] })?.income_report?.outlier_flags ??
      (e?.metadata_json as { alerts?: string[] })?.alerts ?? [];
  const hasOutliers = Array.isArray(outlierFlags) ? outlierFlags as string[] : [];

  // Evidence from backend report
  const evidencias = report?.evidencias ?? [];

  // Memo from backend report
  const memo = report?.memo_final;

  return (
    <div className="space-y-6">
      <div
        className="rounded-lg p-4 border"
        style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-slate-400 text-xs uppercase font-600">Seleccionar expediente</h2>
          {source === "backend" && (
            <span className="text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10">
              Reporte completo backend
            </span>
          )}
        </div>
        <select
          value={selectedId}
          onChange={(ev) => setSelectedId(ev.target.value)}
          className="w-full max-w-md px-4 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm outline-none focus:border-cyan-500"
        >
          <option value="">— Seleccione un expediente —</option>
          {expedientes.map((ex) => (
            <option key={ex.expediente_id} value={ex.expediente_id}>
              {ex.expediente_id} — {ex.referencia_cliente ?? "Sin cliente"}
            </option>
          ))}
        </select>
      </div>

      {!selectedId && (
        <div className="py-12 text-center text-slate-500 text-sm">
          Seleccione un expediente para ver el reporte individual
        </div>
      )}

      {selectedId && loadingDetail && (
        <LoadingSic titulo="Cargando detalle" mensaje="Obteniendo datos del expediente..." />
      )}

      {selectedId && !loadingDetail && !e && (
        <div className="py-8 text-center">
          <p className="text-slate-500 text-sm">No se encontraron datos para este expediente.</p>
          <p className="text-slate-600 text-xs mt-1">El backend no respondió y el expediente no existe en la lista local.</p>
        </div>
      )}

      {selectedId && !loadingDetail && e && (
        <div className="space-y-6">
          {/* Score summary */}
          <div
            className="rounded-lg p-4 border"
            style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
          >
            <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Score de decisión</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 rounded-full overflow-hidden bg-slate-700/60">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score * 100}%`, background: scoreColor }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-300 text-sm">{scorePct}% confianza</p>
                  {riskLevel && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-600"
                      style={{
                        background: `${RISK_COLORS[riskLevel.toUpperCase()] ?? "#64748b"}22`,
                        color: RISK_COLORS[riskLevel.toUpperCase()] ?? "#64748b",
                      }}
                    >
                      Riesgo {riskLevel}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="px-3 py-1 rounded font-700 text-sm"
                style={{ background: `${scoreColor}22`, color: scoreColor }}
              >
                {score >= 0.7 ? "Aprobable" : score >= 0.5 ? "Revisar" : "Riesgo alto"}
              </span>
            </div>
            {rulesFired.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs mb-1">Reglas aplicadas:</p>
                <div className="flex flex-wrap gap-1">
                  {rulesFired.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 text-xs">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income breakdown */}
            <div
              className="rounded-lg p-4 border"
              style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
            >
              <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Desglose de ingresos</h2>
              {incomeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={incomeBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} name="%" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm py-4">Datos no disponibles</p>
              )}
            </div>

            {/* Outliers / alerts */}
            <div
              className="rounded-lg p-4 border"
              style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
            >
              <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Alertas y outliers</h2>
              {hasOutliers.length > 0 ? (
                <ul className="space-y-1">
                  {hasOutliers.map((a: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">Sin alertas detectadas</p>
              )}
            </div>
          </div>

          {/* Final decision card */}
          <div
            className="rounded-lg p-4 border"
            style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
          >
            <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Decisión final</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <dt className="text-slate-500 text-xs">Decisión IA</dt>
                <dd className="text-slate-200 font-600">{e.decision_actual ?? report?.decision?.tipo_decision as string ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Decisión humana</dt>
                <dd className="text-slate-200 font-600">{e.decision_final_humana ?? "—"}</dd>
              </div>
              {report?.pipeline_status && (
                <div>
                  <dt className="text-slate-500 text-xs">Estado pipeline</dt>
                  <dd className="text-slate-200 font-600">{report.pipeline_status}</dd>
                </div>
              )}
              {e.override_justificacion && (
                <div className="w-full">
                  <dt className="text-slate-500 text-xs">Justificación override</dt>
                  <dd className="text-slate-300 text-sm">{e.override_justificacion}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Evidencias (from backend report) */}
          {evidencias.length > 0 && (
            <div
              className="rounded-lg p-4 border"
              style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
            >
              <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Evidencias ({evidencias.length})</h2>
              <div className="space-y-2">
                {evidencias.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-slate-300">{ev.titulo as string ?? ev.tipo_evidencia as string ?? "Evidencia"}</span>
                    {ev.severidad && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">
                        {ev.severidad as string}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memo final (from backend report) */}
          {memo && (
            <div
              className="rounded-lg p-4 border"
              style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
            >
              <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Memo final</h2>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">
                {memo.contenido_markdown as string ?? "—"}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                {memo.decision_final && <span>Decisión: {memo.decision_final as string}</span>}
                {memo.generado_por && <span>Por: {memo.generado_por as string}</span>}
                {memo.fecha_generacion && <span>{memo.fecha_generacion as string}</span>}
              </div>
            </div>
          )}

          {/* Pipeline / timeline */}
          <div
            className="rounded-lg p-4 border"
            style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
          >
            <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Trazabilidad del pipeline</h2>
            {timeline.length > 0 ? (
              <ul className="space-y-2">
                {(timeline as { fecha_evento?: string; tipo_evento?: string; detalle?: string; actor_rol?: string }[]).map((ev, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-slate-400">{ev.fecha_evento ?? ""}</span>
                    <span className="text-slate-300">{ev.tipo_evento ?? ev.detalle ?? "—"}</span>
                    {ev.actor_rol && <span className="text-slate-500 text-xs">({ev.actor_rol})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">Sin eventos en timeline</p>
            )}
          </div>

          {notas.length > 0 && (
            <div
              className="rounded-lg p-4 border"
              style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
            >
              <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Notas del analista</h2>
              <ul className="space-y-2">
                {(notas as { contenido?: string; fecha_creacion?: string; rol_usuario?: string }[]).map((n, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    {n.contenido}{" "}
                    <span className="text-slate-500 text-xs">
                      — {n.fecha_creacion}
                      {n.rol_usuario ? ` (${n.rol_usuario})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ——— TAB 3: Portafolio ———
function TabPortafolio({
  tenant,
  expedientes,
  weeklyVolume,
  mockVolumeTrend,
}: {
  tenant: string;
  expedientes: Expediente[];
  weeklyVolume: { semana: string; volumen: number }[];
  mockVolumeTrend: () => { semana: string; volumen: number }[];
}) {
  const [portafolio, setPortafolio] = useState<ResumenPortafolio | null>(null);
  const [portSource, setPortSource] = useState<"api" | "client">("client");

  useEffect(() => {
    fetchResumenPortafolio(tenant)
      .then((p) => {
        if (p) {
          setPortafolio(p);
          setPortSource("api");
        }
      })
      .catch(() => {});
  }, [tenant]);

  // Status distribution: prefer backend, else client-side
  const statusData = portafolio
    ? Object.entries(portafolio.distribucion_estado).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
        color: STATUS_COLORS[name] ?? "#64748b",
      }))
    : (() => {
        const statusCounts = expedientes.reduce<Record<string, number>>((acc, e) => {
          const s = e.estado_expediente ?? "PENDIENTE";
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {});
        return Object.entries(statusCounts).map(([name, value]) => ({
          name: name.replace(/_/g, " "),
          value,
          color: STATUS_COLORS[name] ?? "#64748b",
        }));
      })();

  // Volume trend: prefer backend tendencias, else client-side
  const volumeTrend = portafolio && portafolio.tendencias_volumen.length > 0
    ? portafolio.tendencias_volumen.map((t) => ({ semana: t.mes, volumen: t.total }))
    : expedientes.length >= 6
      ? weeklyVolume.slice(-12)
      : mockVolumeTrend();

  // KPIs: prefer backend
  const total = portafolio?.total_expedientes ?? expedientes.length;
  const avgTime = portafolio?.avg_processing_time_hours != null
    ? `${portafolio.avg_processing_time_hours} h`
    : "—";
  const overrideRate = portafolio?.override_rate_pct != null
    ? `${portafolio.override_rate_pct}%`
    : (() => {
        const conOverride = expedientes.filter((e) => e.decision_final_humana && e.decision_final_humana !== e.decision_actual).length;
        return total > 0 ? `${((conOverride / total) * 100).toFixed(1)}%` : "—";
      })();
  const escalationRate = portafolio?.escalation_rate_pct != null
    ? `${portafolio.escalation_rate_pct}%`
    : (() => {
        const enComite = expedientes.filter((e) => e.estado_expediente === "EN_COMITE").length;
        return total > 0 ? `${((enComite / total) * 100).toFixed(1)}%` : "—";
      })();

  return (
    <div className="space-y-6">
      {portSource === "api" && (
        <span className="text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10">
          Datos de portafolio desde backend
        </span>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Tiempo prom. procesamiento" value={avgTime} />
        <KpiCard label="Tasa override %" value={overrideRate} />
        <KpiCard label="Tasa escalación %" value={escalationRate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Distribución por estado</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm py-8 text-center">Sin datos</p>
          )}
        </div>
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">
            {portafolio ? "Tendencia mensual" : "Volumen tendencia (12 sem)"}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volumeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
              <XAxis dataKey="semana" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
              <Line type="monotone" dataKey="volumen" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT }} name="Expedientes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk distribution from backend */}
      {portafolio && portafolio.distribucion_riesgo && (
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Distribución por riesgo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(portafolio.distribucion_riesgo).map(([level, count]) => (
              <div key={level} className="text-center">
                <span className="text-2xl font-700 text-slate-200">{count}</span>
                <p className="text-slate-500 text-xs uppercase mt-1">{level}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ——— TAB 4: Exportaciones ———
function TabExportaciones({
  exportaciones,
  tenant,
  onRetry,
}: {
  exportaciones: Exportacion[];
  tenant: string;
  onRetry: () => void;
}) {
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [historial, setHistorial] = useState<Exportacion[]>([]);
  const [csvReady, setCsvReady] = useState<boolean | null>(null);
  const [snapshotReady, setSnapshotReady] = useState<boolean | null>(null);
  const [pdfReady, setPdfReady] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchExportStatus(tenant).catch(() => null),
      fetchExportHistorial(tenant, 10).catch(() => null),
    ]).then(([status, hist]) => {
      if (status) {
        setExportStatus(status);
        setPdfReady(status.pdf_enabled);
        setCsvReady(status.csv_enabled);
        setSnapshotReady(status.snapshot_enabled);
      } else {
        setPdfReady(null);
        setCsvReady(null);
        setSnapshotReady(null);
      }
      if (hist?.exportaciones) {
        setHistorial(hist.exportaciones);
      }
    });
  }, [tenant]);

  const handleCsvDownload = async () => {
    setDownloading("csv");
    try {
      const blob = await downloadCsvBatch(tenant);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sic_expedientes_${tenant}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setDownloading(null);
    }
  };

  const handlePdfDownload = async () => {
    setDownloading("pdf");
    try {
      const blob = await downloadPdfBatch(tenant);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sic_reportes_${tenant}_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setDownloading(null);
    }
  };

  const handleSnapshotDownload = async () => {
    setDownloading("snapshot");
    try {
      const data = await downloadSnapshot(tenant);
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sic_snapshot_${tenant}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setDownloading(null);
    }
  };

  // Normalize historial (backend returns tipo/estado/fecha) for table display
  const normalizedHistorial = historial.map((ex) => ({
    ...ex,
    tipo_exportacion: (ex as { tipo?: string }).tipo ?? ex.tipo_exportacion,
    estado_exportacion: (ex as { estado?: string }).estado ?? ex.estado_exportacion,
    fecha_generacion: (ex as { fecha?: string }).fecha ?? ex.fecha_generacion,
  }));
  const displayExports = normalizedHistorial.length > 0 ? normalizedHistorial.slice(0, 5) : exportaciones.slice(0, 5);

  const ActionCard = ({
    icon: Icon,
    title,
    desc,
    ready,
    onClick,
    loadingKey,
  }: {
    icon: React.ElementType;
    title: string;
    desc: string;
    ready: boolean | null;
    onClick?: () => void;
    loadingKey?: string;
  }) => (
    <div
      className={`rounded-lg p-4 border flex items-start gap-3 ${
        ready ? "opacity-100" : "opacity-70"
      }`}
      style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
    >
      <div className="p-2 rounded" style={{ background: "rgba(14,165,233,0.2)" }}>
        <Icon className="w-5 h-5" style={{ color: ACCENT }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-200 font-600 text-sm m-0">{title}</h3>
        <p className="text-slate-500 text-xs m-0 mt-0.5">{desc}</p>
        {ready === false && (
          <span className="inline-block mt-2 text-amber-400 text-xs">Pendiente integración backend</span>
        )}
      </div>
      <button
        disabled={!ready || downloading === loadingKey}
        onClick={onClick}
        className="px-3 py-1.5 rounded text-xs font-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        style={
          ready
            ? { background: ACCENT, color: "#0f172a" }
            : { background: "rgba(55,65,81,0.6)", color: "#94a3b8" }
        }
      >
        {downloading === loadingKey ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {downloading === loadingKey ? "..." : "Exportar"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          icon={FileText}
          title="PDF"
          desc={pdfReady ? "Exportar reporte batch en PDF" : "Exportar reporte en PDF"}
          ready={pdfReady}
          onClick={handlePdfDownload}
          loadingKey="pdf"
        />
        <ActionCard
          icon={FileOutput}
          title="CSV"
          desc="Descargar expedientes en CSV"
          ready={csvReady}
          onClick={handleCsvDownload}
          loadingKey="csv"
        />
        <ActionCard
          icon={BarChart3}
          title="Snapshot"
          desc="Descargar snapshot de portafolio (JSON)"
          ready={snapshotReady}
          onClick={handleSnapshotDownload}
          loadingKey="snapshot"
        />
        <div
          className="rounded-lg p-4 border"
          style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
        >
          <div className="p-2 rounded inline-block" style={{ background: "rgba(14,165,233,0.2)" }}>
            <Download className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <h3 className="text-slate-200 font-600 text-sm mt-2">Por expediente</h3>
          <p className="text-slate-500 text-xs mt-0.5">Use la ficha del expediente para PDF/ZIP por caso</p>
        </div>
      </div>

      <div
        className="rounded-lg p-4 border"
        style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
      >
        <h2 className="text-slate-400 text-xs uppercase font-600 mb-3">Últimas exportaciones</h2>
        {displayExports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left font-600">Fecha</th>
                  <th className="px-4 py-2 text-left font-600">Tipo</th>
                  <th className="px-4 py-2 text-left font-600">Estado</th>
                  <th className="px-4 py-2 text-right font-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {displayExports.map((ex, i) => (
                  <tr key={ex.exportacion_id ?? `export-row-${i}`} className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">{ex.fecha_generacion ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{ex.tipo_exportacion ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{ex.estado_exportacion ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="text-cyan-400 hover:text-cyan-300 text-xs"
                        onClick={() => {}}
                      >
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4">
            Sin exportaciones recientes.
          </p>
        )}
      </div>
    </div>
  );
}

// ——— TAB 5: Comparativos ———
function TabComparativos({ expedientes, tenant }: { expedientes: Expediente[]; tenant: string }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [comparison, setComparison] = useState<ComparativoExpVsPortafolio | null>(null);
  const [compSource, setCompSource] = useState<"api" | "client">("client");
  const [loadingComp, setLoadingComp] = useState(false);

  // Period comparison state
  const [startA, setStartA] = useState<string>("2026-01-01");
  const [endA, setEndA] = useState<string>("2026-01-31");
  const [startB, setStartB] = useState<string>("2026-02-01");
  const [endB, setEndB] = useState<string>("2026-02-28");
  const [periodComp, setPeriodComp] = useState<ComparativoPeriodos | null>(null);
  const [periodSource, setPeriodSource] = useState<"api" | "client">("client");
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  // Fetch expediente-vs-portfolio comparison from backend
  useEffect(() => {
    if (!selectedId) {
      setComparison(null);
      setCompSource("client");
      return;
    }
    setLoadingComp(true);
    fetchComparativoExpVsPortafolio(selectedId, tenant)
      .then((c) => {
        if (c) {
          setComparison(c);
          setCompSource("api");
        } else {
          setComparison(null);
          setCompSource("client");
        }
      })
      .catch(() => {
        setComparison(null);
        setCompSource("client");
      })
      .finally(() => setLoadingComp(false));
  }, [selectedId, tenant]);

  // Fetch period comparison
  const loadPeriodComparison = useCallback(() => {
    setLoadingPeriod(true);
    fetchComparativoPeriodos(tenant, startA, endA, startB, endB)
      .then((p) => {
        if (p) {
          setPeriodComp(p);
          setPeriodSource("api");
        } else {
          setPeriodComp(null);
          setPeriodSource("client");
        }
      })
      .catch(() => {
        setPeriodComp(null);
        setPeriodSource("client");
      })
      .finally(() => setLoadingPeriod(false));
  }, [tenant, startA, endA, startB, endB]);

  // Auto-fetch period comparison on mount
  useEffect(() => {
    loadPeriodComparison();
  }, [loadPeriodComparison]);

  // Client-side fallback for exp-vs-portfolio
  const selected = expedientes.find((e) => e.expediente_id === selectedId);
  const avgScoreClient = expedientes.length > 0
    ? expedientes.reduce((s, e) => s + (e.confianza_decision ?? 0), 0) / expedientes.length
    : 0;
  const selScore = selected?.confianza_decision ?? 0;

  // Build comparison chart data
  const compareData = comparison
    ? [
        {
          metrica: "Score",
          expediente: comparison.expediente.confidence_score * 100,
          portafolio: comparison.portafolio.avg_confidence_score * 100,
        },
        {
          metrica: "Eventos",
          expediente: comparison.expediente.event_count,
          portafolio: comparison.portafolio.avg_event_count,
        },
        {
          metrica: "Tiempo (h)",
          expediente: comparison.expediente.processing_time_hours,
          portafolio: comparison.portafolio.avg_processing_time_hours,
        },
      ]
    : selected
      ? [
          { metrica: "Score", expediente: selScore * 100, portafolio: avgScoreClient * 100 },
        ]
      : [];

  // Client-side period fallback
  const inPeriod = (dateStr: string | undefined, start: string, end: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return d >= start && d <= end;
  };
  const expAClient = expedientes.filter((e) => inPeriod(e.fecha_creacion, startA, endA));
  const expBClient = expedientes.filter((e) => inPeriod(e.fecha_creacion, startB, endB));
  const approvalAClient = expAClient.length > 0
    ? ((expAClient.filter((e) => e.estado_expediente === "APROBADO").length / expAClient.length) * 100).toFixed(1)
    : "—";
  const approvalBClient = expBClient.length > 0
    ? ((expBClient.filter((e) => e.estado_expediente === "APROBADO").length / expBClient.length) * 100).toFixed(1)
    : "—";
  const avgScoreAClient = expAClient.length > 0
    ? (expAClient.reduce((s, e) => s + (e.confianza_decision ?? 0), 0) / expAClient.length).toFixed(2)
    : "—";
  const avgScoreBClient = expBClient.length > 0
    ? (expBClient.reduce((s, e) => s + (e.confianza_decision ?? 0), 0) / expBClient.length).toFixed(2)
    : "—";

  return (
    <div className="space-y-6">
      <div
        className="rounded-lg p-4 border"
        style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-slate-400 text-xs uppercase font-600">Expediente vs promedio portafolio</h2>
          {compSource === "api" && (
            <span className="text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10">
              Desde backend
            </span>
          )}
        </div>
        <select
          value={selectedId}
          onChange={(ev) => setSelectedId(ev.target.value)}
          className="w-full max-w-md px-4 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm mb-4 outline-none focus:border-cyan-500"
        >
          <option value="">— Seleccione expediente —</option>
          {expedientes.map((ex) => (
            <option key={ex.expediente_id} value={ex.expediente_id}>
              {ex.expediente_id} — {ex.referencia_cliente ?? "—"}
            </option>
          ))}
        </select>

        {loadingComp && <LoadingSic titulo="Comparando" mensaje="Obteniendo datos comparativos..." />}

        {!loadingComp && compareData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compareData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.3)" />
                <XAxis dataKey="metrica" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                />
                <Legend />
                <Bar dataKey="expediente" fill={ACCENT} name="Expediente" radius={[4, 4, 0, 0]} />
                <Bar dataKey="portafolio" fill="#64748b" name="Promedio portafolio" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Benchmark badges from backend */}
            {comparison?.benchmark && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-0.5 rounded text-xs font-600 ${
                  comparison.benchmark.confidence === "above_avg"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  Score: {comparison.benchmark.confidence === "above_avg" ? "Sobre promedio" : "Bajo promedio"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-600 ${
                  comparison.benchmark.processing_speed === "faster"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  Velocidad: {comparison.benchmark.processing_speed === "faster" ? "Más rápido" : "Más lento"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-600 ${
                  comparison.benchmark.complexity === "lower"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  Complejidad: {comparison.benchmark.complexity === "higher" ? "Mayor" : "Menor"}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="rounded-lg p-4 border"
        style={{ background: "rgba(26,31,46,0.98)", borderColor: "rgba(55,65,81,0.6)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-slate-400 text-xs uppercase font-600">Comparación por período</h2>
          {periodSource === "api" && (
            <span className="text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10">
              Desde backend
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="text-slate-500 text-xs block mb-1">Período A (inicio)</label>
            <input
              type="date"
              value={startA}
              onChange={(ev) => setStartA(ev.target.value)}
              className="px-3 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs block mb-1">Período A (fin)</label>
            <input
              type="date"
              value={endA}
              onChange={(ev) => setEndA(ev.target.value)}
              className="px-3 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs block mb-1">Período B (inicio)</label>
            <input
              type="date"
              value={startB}
              onChange={(ev) => setStartB(ev.target.value)}
              className="px-3 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs block mb-1">Período B (fin)</label>
            <input
              type="date"
              value={endB}
              onChange={(ev) => setEndB(ev.target.value)}
              className="px-3 py-2 rounded border border-slate-600 bg-slate-800/60 text-slate-200 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPeriodComparison}
              disabled={loadingPeriod}
              className="px-3 py-2 rounded text-sm font-600 flex items-center gap-1"
              style={{ background: ACCENT, color: "#0f172a" }}
            >
              {loadingPeriod ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
              Comparar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                <th className="px-4 py-2 text-left font-600">Métrica</th>
                <th className="px-4 py-2 text-right font-600">Período A</th>
                <th className="px-4 py-2 text-right font-600">Período B</th>
                {periodComp && <th className="px-4 py-2 text-right font-600">Diferencia</th>}
              </tr>
            </thead>
            <tbody>
              {periodComp ? (
                <>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Total expedientes</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.total_expedientes}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.total_expedientes}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.total_expedientes != null
                        ? (periodComp.diferencias.total_expedientes > 0 ? "+" : "") + periodComp.diferencias.total_expedientes
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Tasa aprobación %</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.tasa_aprobacion_pct}%</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.tasa_aprobacion_pct}%</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.tasa_aprobacion_pct != null
                        ? (periodComp.diferencias.tasa_aprobacion_pct > 0 ? "+" : "") + periodComp.diferencias.tasa_aprobacion_pct + "%"
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Score promedio</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.avg_confidence}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.avg_confidence}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.avg_confidence != null
                        ? (periodComp.diferencias.avg_confidence > 0 ? "+" : "") + periodComp.diferencias.avg_confidence
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Aprobados</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.aprobados}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.aprobados}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.aprobados != null
                        ? (periodComp.diferencias.aprobados > 0 ? "+" : "") + periodComp.diferencias.aprobados
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Rechazados</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.rechazados}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.rechazados}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.rechazados != null
                        ? (periodComp.diferencias.rechazados > 0 ? "+" : "") + periodComp.diferencias.rechazados
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Overrides</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_a.overrides}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{periodComp.periodo_b.overrides}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">
                      {periodComp.diferencias.overrides != null
                        ? (periodComp.diferencias.overrides > 0 ? "+" : "") + periodComp.diferencias.overrides
                        : "—"}
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Tasa aprobación %</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{approvalAClient}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{approvalBClient}</td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Score promedio</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{avgScoreAClient}</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">{avgScoreBClient}</td>
                  </tr>
                  <tr className="border-b border-slate-700/40">
                    <td className="px-4 py-2 text-slate-300">Tiempo prom. procesamiento</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">—</td>
                    <td className="px-4 py-2 text-right font-mono text-slate-200">—</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {!periodComp && (
          <p className="text-slate-500 text-xs mt-2">
            Fallback client-side. Haga clic en Comparar para intentar obtener datos del backend.
          </p>
        )}
      </div>
    </div>
  );
}

/* INTEGRATION STATUS — FINAL PASS
 * Real backend endpoints consumed:
 *   - GET /api/v1/sic/expedientes (list)
 *   - GET /api/v1/sic/expedientes/{id} (detail — fallback for individual)
 *   - GET /api/v1/sic/expedientes/{id}/timeline
 *   - GET /api/v1/sic/expedientes/{id}/notas
 *   - GET /api/v1/sic/exportaciones (global list)
 *   - GET /api/v1/sic/reportes/ejecutivo/kpis ← NEW
 *   - GET /api/v1/sic/reportes/ejecutivo/alertas ← NEW
 *   - GET /api/v1/sic/reportes/portafolio/resumen ← NEW
 *   - GET /api/v1/sic/reportes/individual/{id} ← NEW
 *   - GET /api/v1/sic/reportes/comparativos/expediente-vs-portafolio/{id} ← NEW
 *   - GET /api/v1/sic/reportes/comparativos/periodos ← NEW
 *   - GET /api/v1/sic/reportes/exportaciones/status ← NEW
 *   - GET /api/v1/sic/reportes/exportaciones/historial ← NEW
 *   - GET /api/v1/sic/exportaciones/csv ← NEW (real file download)
 *   - GET /api/v1/sic/exportaciones/snapshot ← NEW (real JSON download)
 * Still pending:
 *   - PDF batch export (backend returns pending_integration)
 *   - Income breakdown / outlier flags: still mock when pipeline_log is empty
 *   - concentracion_segmento: backend returns []
 * QA checklist:
 *   [ ] Tab Resumen Ejecutivo: 8 KPIs from backend, donut riesgo, bar volumen, alertas table with backend data
 *   [ ] Tab Reporte Individual: full backend normalized report, score+rules+evidencias+memo+trazabilidad
 *   [ ] Tab Portafolio: 3 KPIs from backend, pie estado from backend, line tendencia from backend, risk distribution card
 *   [ ] Tab Exportaciones: CSV download works, Snapshot download works, PDF disabled if pending, export history from backend
 *   [ ] Tab Comparativos: exp-vs-portfolio from backend with benchmark badges, period comparison from backend with diff column
 *   [ ] Graceful fallback: every tab degrades to client-side if backend is unavailable
 *   [ ] Data source badges: green "Desde backend" / amber "Usando datos de respaldo"
 *   [ ] SicBarraInstitucional visible, retry on error, mock badge when fallback
 */
