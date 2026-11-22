"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useKnowledgePackStatus, useLegalHealth } from "@/hooks/useLegalCore";

type Props = { tenantId: string | undefined };

function formatDay(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

/** Estado técnico: "healthy" = operativo; otro estado explícito = degradado; sin dato = sin información. */
export function systemState(status: string | undefined, failed: boolean): "ok" | "degraded" | "unknown" {
  if (failed || !status) return "unknown";
  return status === "healthy" ? "ok" : "degraded";
}

/**
 * Estado de fuentes y sistema (pie del Inicio). Fecha de carga del paquete normativo ≠ vigencia
 * ni exhaustividad; salud técnica ≠ validez jurídica. Si no se puede leer: "Sin información".
 */
export function LegalStatusStrip({ tenantId }: Props) {
  const m = useLegalHomeMessages();
  const health = useLegalHealth(tenantId);
  const pack = useKnowledgePackStatus(tenantId);

  const leyes = pack.data?.leyes_cargadas;
  const articulos = pack.data?.articulos_cargados;
  const loadedAt = formatDay(pack.data?.last_loaded_at);
  const packLabel =
    typeof leyes === "number" && leyes > 0
      ? `${leyes} ${leyes === 1 ? "ley" : "leyes"}${typeof articulos === "number" ? ` · ${articulos} artículos` : ""}`
      : "—";
  const estado = systemState(health.data?.status, Boolean(health.error));
  const estadoTexto = estado === "ok" ? m.kpi_ok : estado === "degraded" ? m.kpi_degraded : m.kpi_unknown;
  const estadoColor = estado === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : estado === "degraded" ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-zinc-400";

  return (
    <section aria-labelledby="legal-sources" className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="legal-sources" className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{m.sources_title}</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-slate-600 dark:text-zinc-400">{m.kpi_knowledge_pack}</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-zinc-200">{pack.loading ? "…" : packLabel}</dd>
          {loadedAt ? <dd className="text-xs text-slate-600 dark:text-zinc-400">{m.kpi_pack_loaded.replace("{date}", loadedAt)}</dd> : null}
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-600 dark:text-zinc-400">{m.kpi_system}</dt>
          <dd className={`mt-0.5 text-sm font-semibold ${estadoColor}`} data-testid="estado-sistema">{health.loading ? "…" : estadoTexto}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">{m.sources_note}</p>
    </section>
  );
}
