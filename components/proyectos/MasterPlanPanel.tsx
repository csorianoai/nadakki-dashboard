"use client";

import { useCallback, useState } from "react";
import { Layers, Loader2, MapPinned, RefreshCcw, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion } from "@/lib/motion-stub";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import {
  ProjectsCoreMutationError,
  projectsCorePost,
} from "@/components/proyectos/projectsCoreMutationClient";
import { proyectoApiSuffix } from "@/lib/projects/proyectoApiPaths";

/** Payload fijo de demo — conectar a terreno real del proyecto en fase posterior. */
const DEMO_MASTERPLAN_PAYLOAD: Record<string, unknown> = {
  zona: "Las Zanjas",
  terreno: {
    nombre: "Las Zanjas",
    municipio: "Punta Cana",
    superficie_m2: 125000,
  },
};

type MasterPlanDecision = "FAVORABLE" | "CONDICIONAL" | "REQUIERE_REVISION";

interface AgenteResumen {
  recomendacion?: string;
  confidence?: number;
  sustentada?: boolean;
}

interface MasterPlanMetadata {
  decision?: MasterPlanDecision | string;
  confidence?: number;
  consenso?: {
    hbu?: AgenteResumen;
    gis?: AgenteResumen;
    legal?: AgenteResumen;
    mercado?: AgenteResumen;
    agentes_favorables?: number;
    agentes_cautela?: number;
    agentes_alerta?: number;
    agentes_sin_respuesta?: number;
  };
  rationale?: string[];
  factores_favorables?: Array<{ agente?: string; factor?: string }>;
  factores_riesgo?: Array<{ agente?: string; factor?: string }>;
  mitigaciones?: string[];
  datos_faltantes?: string[];
  sello?: string;
  requiere_aprobacion_humana?: boolean;
}

interface MasterPlanEnvelope {
  success?: boolean;
  status?: string;
  message?: string;
  result?: {
    status?: string;
    agent_id?: string;
    tenant_id?: string;
    decision_block?: {
      accion?: string;
      metadata?: MasterPlanMetadata;
      confidence?: number;
    };
    datos_faltantes?: string[];
    requiere_aprobacion_humana?: boolean;
  };
  masterplan_duration_ms?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asMasterPlanEnvelope(value: unknown): MasterPlanEnvelope {
  return asRecord(value) as MasterPlanEnvelope;
}

function normalizeDecision(value: string | undefined): MasterPlanDecision | "UNKNOWN" {
  const u = (value ?? "").toUpperCase();
  if (u === "FAVORABLE" || u === "CONDICIONAL" || u === "REQUIERE_REVISION") return u;
  return "UNKNOWN";
}

function decisionBadgeClass(decision: MasterPlanDecision | "UNKNOWN"): string {
  if (decision === "FAVORABLE") {
    return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100 shadow-emerald-500/20";
  }
  if (decision === "CONDICIONAL") {
    return "border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-amber-500/20";
  }
  if (decision === "REQUIERE_REVISION") {
    return "border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-rose-500/20";
  }
  return "border-zinc-500/35 bg-zinc-500/10 text-zinc-200 shadow-zinc-500/10";
}

function agentLabel(key: string): string {
  if (key === "hbu") return "HBU — Mejor uso";
  if (key === "gis") return "GIS — Geoespacial";
  if (key === "legal") return "Legal-RD";
  if (key === "mercado") return "Mercado";
  return key;
}

function signalLabel(recomendacion: string | undefined): string {
  const r = (recomendacion ?? "").toLowerCase();
  if (r === "favorable") return "Favorable";
  if (r === "cautela") return "Cautela";
  if (r === "alerta") return "Alerta";
  if (r === "sin_respuesta") return "Sin respuesta";
  return recomendacion ?? "—";
}

function signalStatus(recomendacion: string | undefined): "active" | "warning" | "error" | "inactive" {
  const r = (recomendacion ?? "").toLowerCase();
  if (r === "favorable") return "active";
  if (r === "cautela") return "warning";
  if (r === "alerta") return "error";
  return "inactive";
}

function confidencePercent(meta: MasterPlanMetadata | undefined, blockConfidence?: number): string {
  const raw = meta?.confidence ?? (typeof blockConfidence === "number" ? blockConfidence * 100 : undefined);
  if (typeof raw !== "number" || Number.isNaN(raw)) return "—";
  const pct = raw <= 1 ? raw * 100 : raw;
  return `${Math.round(pct)}%`;
}

export function MasterPlanPanel({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<MasterPlanEnvelope | null>(null);

  const convocar = useCallback(async () => {
    if (!tenantId) {
      toast.error("Falta tenant activo", { description: "Selecciona institución antes de convocar el comité." });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await projectsCorePost(
        tenantId,
        proyectoApiSuffix(proyectoId, "masterplan"),
        DEMO_MASTERPLAN_PAYLOAD,
      );
      const parsed = asMasterPlanEnvelope(raw);
      if (parsed.success === false || parsed.status === "disabled") {
        throw new Error(parsed.message ?? "Master Plan deshabilitado en el backend (MASTERPLAN_ENABLED=false).");
      }
      setEnvelope(parsed);
      const decision =
        parsed.result?.decision_block?.metadata?.decision ?? parsed.result?.decision_block?.accion;
      toast.success("Comité de master plan concluido", {
        description: decision ? `Decisión: ${decision}` : "Síntesis disponible en el panel.",
      });
    } catch (e) {
      const msg =
        e instanceof ProjectsCoreMutationError ? e.message : e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      toast.error("No se pudo convocar el comité de master plan", { description: msg.slice(0, 220) });
    } finally {
      setLoading(false);
    }
  }, [proyectoId, tenantId]);

  const metadata = envelope?.result?.decision_block?.metadata;
  const decision = normalizeDecision(metadata?.decision ?? envelope?.result?.decision_block?.accion);
  const missing = metadata?.datos_faltantes ?? envelope?.result?.datos_faltantes ?? [];
  const agentKeys = ["hbu", "gis", "legal", "mercado"] as const;

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="border border-amber-400/25 bg-amber-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-200" aria-hidden />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/85">
                Comité de Master Plan
              </p>
            </div>
            <h2 className="mt-2 text-lg font-bold text-white">Síntesis multi-agente (Fase 1)</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Ejecuta HBU, GIS, Legal-RD y Mercado; consolida consenso y emite decisión analítica (FAVORABLE /
              CONDICIONAL / REQUIERE REVISIÓN). Latencia típica: 90–120 s.
            </p>
            <p className="mt-2 font-mono text-[11px] text-zinc-500">Demo payload: Las Zanjas · Punta Cana</p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="min-h-11 shrink-0 gap-2 shadow-lg shadow-amber-500/20"
            loading={loading}
            disabled={loading || !tenantId}
            onClick={() => void convocar()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MapPinned className="h-4 w-4" aria-hidden />}
            Convocar comité de master plan
          </Button>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard hover={false} className="border border-white/12 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-200" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">Convocando comité de master plan…</p>
              <p className="mt-1 text-xs text-zinc-400">
                Los 4 agentes se ejecutan en serie. Esto puede tardar hasta ~120 segundos.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {error ? (
        <GlassCard hover={false} className="border border-rose-500/35 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-100">Error al convocar comité de master plan</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-200/85">{error}</p>
          <Button type="button" variant="secondary" className="mt-4 min-h-10" onClick={() => void convocar()}>
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Reintentar
          </Button>
        </GlassCard>
      ) : null}

      {envelope && !loading && !error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg ${decisionBadgeClass(decision)}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">Decisión del comité</span>
              <span className="font-mono text-xs font-bold">
                {decision === "UNKNOWN" ? "SIN DECISIÓN" : decision.replace("_", " ")}
              </span>
            </div>
            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 font-mono text-[11px] text-amber-100">
              Confidence {confidencePercent(metadata, envelope.result?.decision_block?.confidence)}
            </span>
            <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-100">
              Sujeta a verificación humana
            </span>
          </div>

          {metadata?.sello ? (
            <GlassCard hover={false} className="border border-white/12 bg-white/[0.03] p-4">
              <div className="flex gap-3">
                <Scale className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden />
                <p className="text-sm leading-relaxed text-zinc-300">{metadata.sello}</p>
              </div>
            </GlassCard>
          ) : null}

          <GlassCard hover={false} className="border border-white/12 bg-white/[0.035] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Consenso de agentes</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {agentKeys.map((key) => {
                const agent = metadata?.consenso?.[key];
                return (
                  <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold text-zinc-200">{agentLabel(key)}</p>
                    <div className="mt-2">
                      <StatusBadge
                        status={signalStatus(agent?.recomendacion)}
                        label={signalLabel(agent?.recomendacion)}
                        size="sm"
                        pulse={false}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-zinc-500">
                      conf.{" "}
                      {typeof agent?.confidence === "number"
                        ? `${Math.round(agent.confidence * (agent.confidence <= 1 ? 100 : 1))}%`
                        : "—"}
                      {agent?.sustentada === false ? " · sin sustento" : agent?.sustentada ? " · sustentada" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            {metadata?.consenso ? (
              <p className="mt-3 text-xs text-zinc-500">
                Totales: {metadata.consenso.agentes_favorables ?? 0} favorable(s) ·{" "}
                {metadata.consenso.agentes_cautela ?? 0} cautela · {metadata.consenso.agentes_alerta ?? 0} alerta ·{" "}
                {metadata.consenso.agentes_sin_respuesta ?? 0} sin respuesta
              </p>
            ) : null}
          </GlassCard>

          {(metadata?.factores_favorables?.length ?? 0) > 0 || (metadata?.factores_riesgo?.length ?? 0) > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {(metadata?.factores_favorables?.length ?? 0) > 0 ? (
                <GlassCard hover={false} className="border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/85">
                    Factores favorables
                  </p>
                  <ul className="space-y-2">
                    {metadata!.factores_favorables!.map((f, idx) => (
                      <li key={`fav-${idx}`} className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                          ✓ {f.agente ?? "agente"}
                        </span>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-200">{f.factor ?? "—"}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ) : null}
              {(metadata?.factores_riesgo?.length ?? 0) > 0 ? (
                <GlassCard hover={false} className="border border-rose-400/20 bg-rose-500/[0.06] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200/85">
                    Factores de riesgo
                  </p>
                  <ul className="space-y-2">
                    {metadata!.factores_riesgo!.map((f, idx) => (
                      <li key={`rie-${idx}`} className="rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-200">
                          ⚠ {f.agente ?? "agente"}
                        </span>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-200">{f.factor ?? "—"}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ) : null}
            </div>
          ) : null}

          {(metadata?.mitigaciones?.length ?? 0) > 0 ? (
            <GlassCard hover={false} className="border border-white/12 bg-white/[0.035] p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Mitigaciones sugeridas</p>
              <ul className="space-y-2">
                {metadata!.mitigaciones!.map((m, idx) => (
                  <li key={`mit-${idx}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                    {m}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          {(metadata?.rationale?.length ?? 0) > 0 ? (
            <GlassCard hover={false} className="border border-white/12 bg-white/[0.035] p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Rationale</p>
              <ul className="space-y-2">
                {metadata!.rationale!.map((line, idx) => (
                  <li key={`rat-${idx}`} className="text-sm leading-relaxed text-zinc-300">
                    {line}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          {missing.length ? (
            <GlassCard hover={false} className="border border-amber-400/30 bg-amber-500/[0.08] p-4">
              <p className="text-sm font-semibold text-amber-50">Datos o señales incompletas</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          {typeof envelope.masterplan_duration_ms === "number" ? (
            <p className="font-mono text-[10px] text-zinc-500">masterplan_duration_ms: {envelope.masterplan_duration_ms}</p>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
