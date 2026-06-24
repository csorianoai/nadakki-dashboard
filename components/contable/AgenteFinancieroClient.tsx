"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button, Select } from "@/components/forge";
import {
  ContableApiError,
  getSugerenciasAgente,
  listPeriodos,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { AgenteSugerenciasResponse, PeriodoContable, SugerenciaFinanciera } from "@/types/contable";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

function scoreBgColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

const TIPO_STYLES: Record<SugerenciaFinanciera["tipo"], { label: string; cls: string }> = {
  reduccion_gasto: { label: "REDUCIR GASTO", cls: "bg-rose-500/15 text-rose-200 ring-rose-400/30" },
  aumento_ingreso: { label: "AUMENTAR INGRESO", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" },
  optimizacion: { label: "OPTIMIZAR", cls: "bg-sky-500/15 text-sky-200 ring-sky-400/30" },
  alerta: { label: "ALERTA", cls: "bg-amber-500/15 text-amber-200 ring-amber-400/30" },
};

const PRIORIDAD_STYLES: Record<SugerenciaFinanciera["prioridad"], { label: string; cls: string }> = {
  alta: { label: "ALTA", cls: "bg-rose-500/15 text-rose-200 ring-rose-400/30" },
  media: { label: "MEDIA", cls: "bg-amber-500/15 text-amber-200 ring-amber-400/30" },
  baja: { label: "BAJA", cls: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30" },
};

function fmt(n: number): string {
  return n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AgenteFinancieroClient() {
  const tenantId = useContableTenantId();
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<AgenteSugerenciasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
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
    setUnavailable(false);
    try {
      setReport(await getSugerenciasAgente(tenantId, periodoId));
    } catch (e) {
      if (e instanceof ContableApiError && (e.status === 404 || e.status === 501)) {
        setReport(null);
        setUnavailable(true);
      } else if (e instanceof ContableApiError && e.status === 400) {
        setReport(null);
        setError(null);
      } else {
        const msg = e instanceof ContableApiError ? e.message : "Error generando análisis";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, periodoId]);

  useEffect(() => {
    if (periodoId) void load();
  }, [periodoId, load]);

  return (
    <ContablePageShell
      title="Consultor Financiero IA"
      description="Análisis inteligente de tus finanzas con sugerencias accionables."
      icon={<Sparkles className="h-10 w-10" aria-hidden />}
      actions={
        <Button variant="secondary" disabled={loading || !periodoId} onClick={() => void load()}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Regenerar análisis
        </Button>
      }
    >
      <div className="mb-4 max-w-xs">
        <Select
          label="Periodo a analizar"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodos.map((p) => ({ value: p.id, label: `${p.label} (${p.status})` }))}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-zinc-300 text-sm">El agente está analizando tus finanzas...</p>
          <p className="text-zinc-500 text-xs mt-1">Esto puede tomar unos segundos.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {unavailable && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm">El análisis IA estará disponible cuando haya suficientes datos contables registrados.</p>
          <p className="text-zinc-500 text-xs mt-1">Crea asientos para que el agente pueda analizar tus finanzas.</p>
        </div>
      )}

      {!report && !loading && !error && !unavailable && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-zinc-400 text-sm">Selecciona un período para generar el análisis.</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          {/* Score de salud financiera */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Salud Financiera</p>
                <p className={cn("font-mono text-5xl font-bold", scoreColor(report.score_salud_financiera))}>
                  {report.score_salud_financiera}
                </p>
                <p className="text-xs text-zinc-500 mt-1">de 100</p>
              </div>
              <div className="flex-1">
                <div className="h-3 w-full rounded-full bg-zinc-800">
                  <div
                    className={cn("h-3 rounded-full transition-all", scoreBgColor(report.score_salud_financiera))}
                    style={{ width: `${Math.min(100, Math.max(0, report.score_salud_financiera))}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
                  <span>0</span>
                  <span>40</span>
                  <span>70</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen ejecutivo */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400 mb-2">Resumen ejecutivo</h3>
            <p className="text-sm text-zinc-200 leading-relaxed">{report.resumen_ejecutivo}</p>
          </div>

          {/* Sugerencias */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Sugerencias ({report.sugerencias.length})</h3>
            {report.sugerencias.length === 0 && (
              <p className="text-sm text-zinc-500">No hay sugerencias para este período.</p>
            )}
            {report.sugerencias.map((s) => {
              const tipo = TIPO_STYLES[s.tipo];
              const prioridad = PRIORIDAD_STYLES[s.prioridad];
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1", tipo.cls)}>
                      {tipo.label}
                    </span>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1", prioridad.cls)}>
                      {prioridad.label}
                    </span>
                    {s.impacto_estimado_dop != null && (
                      <span className="text-xs text-zinc-400">
                        Impacto: <span className="font-mono font-semibold text-emerald-300">DOP {fmt(s.impacto_estimado_dop)}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{s.titulo}</h4>
                  <p className="mt-1 text-sm text-zinc-400">{s.descripcion}</p>
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Acción sugerida</p>
                    <p className="text-sm text-emerald-100">{s.accion_sugerida}</p>
                  </div>
                  {s.cuenta_relacionada && (
                    <p className="mt-2 text-xs text-zinc-500">Cuenta relacionada: {s.cuenta_relacionada}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ContablePageShell>
  );
}
