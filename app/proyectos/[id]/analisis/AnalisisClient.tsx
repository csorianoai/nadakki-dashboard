"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BarChart3, BrainCircuit, Info, Loader2, MapPinned, RefreshCcw, TrendingUp } from "lucide-react";
import { motion } from "@/lib/motion-stub";
import { Button, Input, Select, Skeleton } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import {
  ProjectsCoreMutationError,
  projectsCorePost,
} from "@/components/proyectos/projectsCoreMutationClient";
import { useProyecto } from "@/hooks/projects/useProyectos";

type AnalysisId = "mercado" | "valoracion" | "absorcion";
type ProyectoAnalysisEndpoint = "estudio-mercado" | "valoracion" | "absorcion";

interface ReasonCode {
  code?: string;
  category?: string;
  description?: string;
}

interface AgentDecisionBlock {
  accion?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

interface AgentAnalysisResult {
  status?: string;
  agent_id?: string;
  tenant_id?: string;
  decision_block?: AgentDecisionBlock;
  reason_codes?: ReasonCode[];
  datos_faltantes?: string[];
  requiere_aprobacion_humana?: boolean;
  confidence?: number;
  [key: string]: unknown;
}

interface AgentAnalysisEnvelope {
  success?: boolean;
  agent?: string;
  result?: AgentAnalysisResult;
  execution_id?: string;
  trace_id?: string;
  error?: unknown;
}

interface AnalysisConfig {
  id: AnalysisId;
  endpoint: ProyectoAnalysisEndpoint;
  title: string;
  agent: string;
  description: string;
  icon: typeof BarChart3;
}

const ANALYSES: AnalysisConfig[] = [
  {
    id: "mercado",
    endpoint: "estudio-mercado",
    title: "Estudio de mercado",
    agent: "estudio_mercado_inmobiliario",
    description: "Evalúa zona, tipo de producto, señales de demanda y comparables para orientar posicionamiento.",
    icon: BarChart3,
  },
  {
    id: "valoracion",
    endpoint: "valoracion",
    title: "Valoración territorial",
    agent: "predictor_valorizacion_territorial",
    description: "Proyecta apreciación y sensibilidad territorial en un horizonte de inversión definido.",
    icon: MapPinned,
  },
  {
    id: "absorcion",
    endpoint: "absorcion",
    title: "Absorción de ventas",
    agent: "predictor_absorcion_ventas",
    description: "Estima velocidad comercial a partir de unidades, ritmo histórico y señales del proyecto.",
    icon: TrendingUp,
  },
];

const PRODUCT_OPTIONS = [
  { value: "", label: "Selecciona tipo de producto" },
  { value: "apartamentos", label: "Apartamentos" },
  { value: "villas", label: "Villas" },
  { value: "lotes", label: "Lotes" },
  { value: "hospitality", label: "Hospitality" },
  { value: "comercial", label: "Comercial" },
];

const FIELD_LABELS: Record<string, string> = {
  zona: "Zona",
  tipo_producto: "Tipo de producto",
  unidades: "Unidades",
  ritmo_historico: "Ritmo histórico",
  horizonte_anios: "Horizonte (años)",
  comparables: "Comparables de mercado",
  riesgos: "Riesgos del proyecto",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asEnvelope(value: unknown): AgentAnalysisEnvelope {
  return asRecord(value) as AgentAnalysisEnvelope;
}

function stringField(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberField(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return value.trim();
  }
  return "";
}

function compactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) out[key] = trimmed;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

function confidencePercent(result: AgentAnalysisResult | undefined): string {
  const raw = result?.decision_block?.confidence ?? result?.confidence;
  if (typeof raw !== "number" || Number.isNaN(raw)) return "—";
  const pct = raw <= 1 ? raw * 100 : raw;
  return `${Math.round(pct)}%`;
}

function humanizeKey(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "string") return value;
  return "";
}

function missingHint(field: string): string {
  if (field === "riesgos") return "Añade riesgos en la pestaña Riesgos y vuelve a ejecutar.";
  if (field === "comparables") return "Carga o registra comparables de mercado cuando el endpoint esté disponible.";
  return "Completa este input en la tarjeta y reintenta el análisis.";
}

type RecommendationKind = "GO" | "REVISE" | "NO_GO" | "UNKNOWN";

function normalizeRecommendation(value: string | undefined): RecommendationKind {
  const normalized = (value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(favorable|avanzar|aprobar)/.test(normalized)) return "GO";
  if (/(cautela|revisar|ajustar)/.test(normalized)) return "REVISE";
  if (/(alerta|rechazar|detener)/.test(normalized)) return "NO_GO";
  return "UNKNOWN";
}

function RecommendationBadge({ value }: { value: string | undefined }) {
  const kind = normalizeRecommendation(value);
  const config: Record<RecommendationKind, { label: string; className: string; caption: string }> = {
    GO: {
      label: "FAVORABLE",
      className: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100 shadow-emerald-500/20",
      caption: "Señal analítica",
    },
    REVISE: {
      label: "CAUTELA",
      className: "border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-amber-500/20",
      caption: "Señal analítica",
    },
    NO_GO: {
      label: "ALERTA",
      className: "border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-rose-500/20",
      caption: "Señal analítica",
    },
    UNKNOWN: {
      label: "SIN SEÑAL CONCLUYENTE",
      className: "border-zinc-500/35 bg-zinc-500/10 text-zinc-200 shadow-zinc-500/10",
      caption: "Análisis sin señal suficiente",
    },
  };
  const selected = config[kind];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg ${selected.className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">{selected.caption}</span>
      <span className="font-mono text-xs font-bold">{selected.label}</span>
    </div>
  );
}

function numericPercent(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

function relevanceScore(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

function MarketSourcesCard({ metadata }: { metadata: Record<string, unknown> }) {
  const ragCount = typeof metadata.rag_context_count === "number" ? metadata.rag_context_count : 0;
  const rawSources = Array.isArray(metadata.fuentes_mercado) ? metadata.fuentes_mercado : [];
  const sources = rawSources
    .map((source) => asRecord(source))
    .filter((source) => Object.keys(source).length > 0);

  return (
    <GlassCard hover={false} className="border border-amber-400/25 bg-amber-500/[0.055] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/85">
            Fuentes de mercado utilizadas
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Contextos RAG verificados: <span className="font-mono text-amber-100">{ragCount}</span>
          </p>
        </div>
        <StatusBadge status={sources.length ? "active" : "inactive"} label={sources.length ? "RAG activo" : "Sin RAG"} size="sm" pulse={false} />
      </div>

      {sources.length ? (
        <div className="mt-4 grid gap-3">
          {sources.map((source, idx) => {
            const title =
              typeof source.fuente === "string" && source.fuente.trim()
                ? source.fuente.trim()
                : typeof source.document_titulo === "string" && source.document_titulo.trim()
                  ? source.document_titulo.trim()
                  : `Fuente de mercado ${idx + 1}`;
            const date = typeof source.fecha_dato === "string" && source.fecha_dato.trim() ? source.fecha_dato.trim() : "Fecha no disponible";

            return (
              <div key={`${title}-${idx}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-relaxed text-white">{title}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">fecha_dato: {date}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:min-w-[190px]">
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200/75">Calidad</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-emerald-100">
                        {numericPercent(source.source_quality_score)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/75">Relevancia</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-amber-100">{relevanceScore(source.score)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-4">
          <p className="text-sm leading-relaxed text-zinc-300">
            Este análisis no recibió contexto RAG verificado; la recomendación se basa en los datos del proyecto.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

function MetadataList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return <p className="text-sm text-zinc-500">Sin metadata adicional devuelta por el agente.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => {
        const primitive = formatValue(value);
        return (
          <div key={key} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{humanizeKey(key)}</p>
            {primitive ? (
              <p className="mt-1 text-sm leading-relaxed text-zinc-100">{primitive}</p>
            ) : Array.isArray(value) ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                {value.slice(0, 6).map((item, idx) => (
                  <li key={`${key}-${idx}`} className="rounded-lg bg-black/20 px-2 py-1">
                    {formatValue(item) || "Elemento estructurado"}
                  </li>
                ))}
              </ul>
            ) : (
              <MetadataList data={asRecord(value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReportShell({
  envelope,
  onRetry,
}: {
  envelope: AgentAnalysisEnvelope;
  onRetry: () => void;
}) {
  const result = envelope.result;
  const accion = result?.decision_block?.accion ?? result?.status ?? "sin_accion";
  const missing = result?.datos_faltantes ?? [];
  const insufficient = accion === "datos_insuficientes";
  const metadata = asRecord(result?.decision_block?.metadata);
  const reasons = result?.reason_codes ?? [];
  const hasMissingData = insufficient || missing.length > 0;
  // Señal analítica: prioriza metadata.recomendacion; fallback a accion (retrocompat).
  const recomendacion =
    (typeof metadata.recomendacion === "string" && metadata.recomendacion) || accion;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mt-5 space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <RecommendationBadge value={recomendacion} />
        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 font-mono text-[11px] text-amber-100">
          Confidence {confidencePercent(result)}
        </span>
        <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-100">
          Sujeta a verificación humana
        </span>
        {result?.requiere_aprobacion_humana ? (
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-100">
            Requiere aprobación humana
          </span>
        ) : null}
      </div>

      <MarketSourcesCard metadata={metadata} />

      {hasMissingData ? (
        <GlassCard hover={false} className="border border-amber-400/30 bg-amber-500/[0.08] p-4">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-amber-50">Faltan datos para este análisis</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  El agente respondió correctamente, pero necesita más contexto antes de emitir un análisis final.
                </p>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {(missing.length ? missing : ["datos_operativos"]).map((field) => (
                  <li key={field} className="rounded-xl border border-amber-400/20 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-amber-100">Completa: {humanizeKey(field)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{missingHint(field)}</p>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="secondary" className="min-h-10" onClick={onRetry}>
                Reintentar con inputs actuales
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {reasons.length ? (
        <GlassCard hover={false} className="border border-white/12 bg-white/[0.035] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Factores que sustentan la señal</p>
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li
                key={`${reason.code ?? "reason"}-${idx}`}
                className={`rounded-xl border p-3 ${
                  reason.category === "FAVORABLE"
                    ? "border-emerald-400/20 bg-emerald-500/[0.07]"
                    : reason.category === "RIESGO"
                      ? "border-rose-400/20 bg-rose-500/[0.07]"
                      : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                      reason.category === "FAVORABLE"
                        ? "text-emerald-200"
                        : reason.category === "RIESGO"
                          ? "text-rose-200"
                          : "text-zinc-400"
                    }`}
                  >
                    {reason.category === "FAVORABLE"
                      ? "✓ Favorable"
                      : reason.category === "RIESGO"
                        ? "⚠ Riesgo"
                        : (reason.category ?? reason.code ?? `R-${idx + 1}`)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-200">{reason.description ?? "Sin descripción."}</p>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      <details className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Metadata técnica
          <span className="text-amber-200 transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-4">
          <MetadataList data={metadata} />
        </div>
      </details>

      {envelope.success === false && envelope.error ? (
        <GlassCard hover={false} className="border border-rose-500/35 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-100">El dispatcher reportó un error</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-200/85">
            {formatValue(envelope.error) || "Sin detalle adicional."}
          </p>
        </GlassCard>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-3 font-mono text-[10px] text-zinc-500">
        {envelope.execution_id ? <span>execution_id: {envelope.execution_id}</span> : null}
        {envelope.trace_id ? <span>trace_id: {envelope.trace_id}</span> : null}
        {envelope.agent ? <span>agent: {envelope.agent}</span> : null}
      </div>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <GlassCard hover={false} className="mt-5 border border-rose-500/35 bg-rose-500/10 p-4">
      <p className="text-sm font-semibold text-rose-100">No se pudo ejecutar el análisis</p>
      <p className="mt-1 text-sm leading-relaxed text-rose-200/85">{message}</p>
      <Button type="button" variant="secondary" className="mt-4 min-h-10" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4" aria-hidden />
        Reintentar
      </Button>
    </GlassCard>
  );
}

export function AnalisisClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const proyectoQuery = useProyecto(proyectoId);
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState<Partial<Record<AnalysisId, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<AnalysisId, string>>>({});
  const [results, setResults] = useState<Partial<Record<AnalysisId, AgentAnalysisEnvelope>>>({});

  const [marketZona, setMarketZona] = useState("");
  const [tipoProducto, setTipoProducto] = useState("");
  const [valuationZona, setValuationZona] = useState("");
  const [horizonteAnios, setHorizonteAnios] = useState("5");
  const [unidades, setUnidades] = useState("");
  const [ritmoHistorico, setRitmoHistorico] = useState("");

  useEffect(() => {
    if (prefilled || !proyectoQuery.data) return;
    const raw = asRecord(proyectoQuery.data);
    const zona = stringField(raw, ["zona", "zone", "ubicacion", "location", "industry_overlay"]);
    const producto = stringField(raw, ["tipo_producto", "product_type", "project_type"]);
    const units = numberField(raw, ["unidades", "units", "total_units"]);
    setMarketZona((prev) => prev || zona);
    setValuationZona((prev) => prev || zona);
    setTipoProducto((prev) => prev || (PRODUCT_OPTIONS.some((opt) => opt.value === producto) ? producto : ""));
    setUnidades((prev) => prev || units);
    setPrefilled(true);
  }, [prefilled, proyectoQuery.data]);

  const payloadFor = useCallback(
    (id: AnalysisId): Record<string, unknown> | null => {
      if (id === "mercado") {
        return compactPayload({ zona: marketZona, tipo_producto: tipoProducto });
      }
      if (id === "valoracion") {
        const years = horizonteAnios.trim() ? Number(horizonteAnios) : undefined;
        if (years !== undefined && (!Number.isFinite(years) || years <= 0)) {
          toast.warning("Horizonte inválido", { description: "Usa un número mayor que cero." });
          return null;
        }
        return compactPayload({ zona: valuationZona, horizonte_anios: years });
      }
      const units = unidades.trim() ? Number(unidades) : undefined;
      if (units !== undefined && (!Number.isFinite(units) || units <= 0)) {
        toast.warning("Unidades inválidas", { description: "Usa un número mayor que cero." });
        return null;
      }
      return compactPayload({ unidades: units, ritmo_historico: ritmoHistorico });
    },
    [horizonteAnios, marketZona, ritmoHistorico, tipoProducto, unidades, valuationZona],
  );

  const execute = useCallback(
    async (config: AnalysisConfig) => {
      if (!tid) {
        toast.error("Falta tenant activo", { description: "Selecciona institución antes de ejecutar análisis." });
        return;
      }
      const payload = payloadFor(config.id);
      if (!payload) return;
      setLoading((prev) => ({ ...prev, [config.id]: true }));
      setErrors((prev) => ({ ...prev, [config.id]: undefined }));
      try {
        const raw = await projectsCorePost(tid, `/${encodeURIComponent(proyectoId)}/${config.endpoint}`, payload);
        setResults((prev) => ({ ...prev, [config.id]: asEnvelope(raw) }));
        toast.success("Análisis ejecutado", { description: config.title });
      } catch (e) {
        const msg =
          e instanceof ProjectsCoreMutationError ? e.message : e instanceof Error ? e.message : "Error desconocido";
        setErrors((prev) => ({ ...prev, [config.id]: msg }));
        toast.error("Análisis no disponible", { description: msg.slice(0, 220) });
      } finally {
        setLoading((prev) => ({ ...prev, [config.id]: false }));
      }
    },
    [payloadFor, proyectoId, tid],
  );

  const inputPanel = useCallback(
    (id: AnalysisId): ReactNode => {
      if (id === "mercado") {
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Zona" value={marketZona} onChange={(e) => setMarketZona(e.target.value)} placeholder="Punta Cana, Piantini, Cap Cana..." />
            <Select label="Tipo de producto" value={tipoProducto} onChange={(e) => setTipoProducto(e.target.value)} options={PRODUCT_OPTIONS} />
          </div>
        );
      }
      if (id === "valoracion") {
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Zona" value={valuationZona} onChange={(e) => setValuationZona(e.target.value)} placeholder="Zona o submercado" />
            <Input
              label="Horizonte (años)"
              type="number"
              inputMode="numeric"
              value={horizonteAnios}
              onChange={(e) => setHorizonteAnios(e.target.value)}
              placeholder="5"
            />
          </div>
        );
      }
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Unidades"
            type="number"
            inputMode="numeric"
            value={unidades}
            onChange={(e) => setUnidades(e.target.value)}
            placeholder="120"
          />
          <Input label="Ritmo histórico" value={ritmoHistorico} onChange={(e) => setRitmoHistorico(e.target.value)} placeholder="8/mes" />
        </div>
      );
    },
    [horizonteAnios, marketZona, ritmoHistorico, tipoProducto, unidades, valuationZona],
  );

  const projectLoading = proyectoQuery.isPending;

  return (
    <div className="space-y-8 pb-10">
      <Link
        href={`/proyectos/${encodeURIComponent(proyectoId)}`}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:text-white"
      >
        ← Workspace · detalle proyecto
      </Link>

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <GlassCard hover={false} className="relative overflow-hidden border border-amber-400/25 p-6">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-45 blur-[76px]"
            style={{ background: `radial-gradient(circle at 30% 30%, ${BP_ACCENTS.primary}, transparent 64%)` }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-amber-300" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
                  Inteligencia Tier 2
                </p>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold text-white">Análisis de agentes</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Ejecuta estudio de mercado, valoración territorial y absorción de ventas con inputs editables. Si faltan datos, el agente lo reporta como parte del Missing Data Engine.
              </p>
            </div>
            <StatusBadge status={tid ? "active" : "warning"} label={tid ? "Tenant listo" : "Esperando tenant"} size="sm" pulse={false} />
          </div>
        </GlassCard>
      </motion.header>

      {projectLoading ? <Skeleton className="h-16 w-full rounded-forge-lg" /> : null}

      <div className="grid gap-5">
        {ANALYSES.map((config, idx) => {
          const Icon = config.icon;
          const isLoading = Boolean(loading[config.id]);
          const result = results[config.id];
          const error = errors[config.id];
          return (
            <motion.section
              key={config.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: idx * 0.04 }}
            >
              <GlassCard hover={false} className="border border-white/12 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 shadow-[0_0_28px_-12px_rgba(245,158,11,0.85)]">
                        <Icon className="h-6 w-6 text-amber-200" aria-hidden />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{config.title}</h2>
                        <p className="mt-1 font-mono text-[11px] text-amber-200/80">{config.agent}</p>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">{config.description}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">{inputPanel(config.id)}</div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    className="min-h-11 shrink-0 gap-2 shadow-lg shadow-amber-500/20"
                    loading={isLoading}
                    disabled={isLoading || !tid}
                    onClick={() => void execute(config)}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    Ejecutar análisis
                  </Button>
                </div>

                {isLoading ? (
                  <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <Skeleton className="h-5 w-48 rounded-full" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-12 w-2/3 rounded-xl" />
                  </div>
                ) : null}
                {!isLoading && error ? <ErrorState message={error} onRetry={() => void execute(config)} /> : null}
                {!isLoading && !error && result ? <ReportShell envelope={result} onRetry={() => void execute(config)} /> : null}
              </GlassCard>
            </motion.section>
          );
        })}
      </div>

      <GlassCard hover={false} className="border border-dashed border-amber-400/30 bg-amber-500/[0.055] p-5">
        <p className="text-sm font-semibold text-amber-100">Histórico de análisis · próximamente</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          No hay endpoint GET versionado para listar decisiones previas de agentes desde esta UI. Cuando exista un feed de eventos `AGENT_DECISION`, se puede conectar aquí sin inventar contrato.
        </p>
      </GlassCard>
    </div>
  );
}
