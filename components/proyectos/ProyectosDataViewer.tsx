"use client";

import { motion } from "@/lib/motion-stub";
import GlassCard from "@/components/ui/GlassCard";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";

/**
 * Viewer JSON provisional — mismo lenguaje visual Marketing (GlassCard oscuro).
 */
interface ProyectosDataViewerProps {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: Error | null;
  data: unknown | null | undefined;
  emptyMessage?: string;
  onRetry?: () => void;
}

function jsonPreview(payload: unknown): string {
  if (payload === null || payload === undefined) return "";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function hasRenderablePayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return false;
  if (Array.isArray(payload)) return payload.length > 0;
  if (typeof payload === "object") return Object.keys(payload as Record<string, unknown>).length > 0;
  if (typeof payload === "string") return payload.trim().length > 0;
  return true;
}

export function ProyectosDataViewer({
  title,
  subtitle,
  loading,
  error,
  data,
  emptyMessage = "Aún sin señales en este lienzo — cuando el núcleo responda verás artefactos estructurados aquí.",
  onRetry,
}: ProyectosDataViewerProps) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-zinc-400">{subtitle}</p> : null}
      </header>

      {loading ? (
        <GlassCard hover={false} className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-1/4 rounded-full bg-white/10" />
            <div className="h-4 w-3/4 rounded-full bg-white/10" />
            <div className="h-4 w-2/5 rounded-full bg-white/10" />
            <div className="mt-8 h-32 rounded-xl bg-white/5" />
          </div>
        </GlassCard>
      ) : null}

      {!loading && error ? (
        <GlassCard hover={false} className="border border-red-500/30 bg-red-500/10 p-5 shadow-lg shadow-red-500/15">
          <p className="font-semibold text-red-100">No se pudieron obtener los datos</p>
          <p className="mt-2 text-sm text-red-200/95">{error.message}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-amber-500/25 hover:border-amber-400/50"
              onClick={onRetry}
            >
              Reintentar
            </button>
          ) : null}
        </GlassCard>
      ) : null}

      {!loading && !error && !hasRenderablePayload(data) ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassCard hover={false} className="border border-dashed border-amber-500/35 bg-amber-500/[0.04] p-8 text-center shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]">
            <p className="text-lg font-semibold text-amber-100/95">Espacio esperando obra</p>
            <p className="mt-2 max-w-xl mx-auto text-sm text-zinc-400">{emptyMessage}</p>
          </GlassCard>
        </motion.div>
      ) : null}

      {!loading && !error && hasRenderablePayload(data) ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <GlassCard hover={false} className="overflow-hidden border border-white/15 p-0">
            <div
              className="border-b border-white/10 bg-gradient-to-r from-amber-500/15 to-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: BP_ACCENTS.glow }}
            >
              Payload vivo · JSON
            </div>
            <pre className="max-h-[min(560px,70vh)] overflow-auto p-5 text-[11px] leading-relaxed text-emerald-100/95 font-mono">
              {jsonPreview(data)}
            </pre>
          </GlassCard>
        </motion.div>
      ) : null}
    </div>
  );
}
