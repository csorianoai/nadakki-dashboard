"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useKnowledgePackStatus, useLegalHealth } from "@/hooks/useLegalCore";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useValidationQueue } from "@/hooks/legal/useValidationQueue";

type Props = { tenantId: string | undefined };

function formatDay(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Franja de estado del Inicio legal. Cada número sale de su fuente real:
 * plazos de /deadlines/upcoming, revisiones de /validation-queue y el paquete
 * normativo de /knowledge-pack/status. Si un dato no se puede leer se muestra "—",
 * nunca un 0 que parezca cierto.
 */
export function LegalStatusStrip({ tenantId }: Props) {
  const m = useLegalHomeMessages();
  const health = useLegalHealth(tenantId);
  const pack = useKnowledgePackStatus(tenantId);
  const deadlines = useUpcomingDeadlines(tenantId, 7);
  const queue = useValidationQueue(tenantId);

  const upcoming = deadlines.data?.deadlines ?? null;
  const peremptory = upcoming ? upcoming.filter((d) => d.is_peremptory).length : 0;

  const leyes = pack.data?.leyes_cargadas;
  const articulos = pack.data?.articulos_cargados;
  const loadedAt = formatDay(pack.data?.last_loaded_at);
  const packLabel =
    typeof leyes === "number" && leyes > 0
      ? `${leyes} ${leyes === 1 ? "ley" : "leyes"}${typeof articulos === "number" ? ` · ${articulos} artículos` : ""}`
      : "—";

  const sysOk = health.data?.status === "healthy" && !health.error;

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 px-6 py-4 backdrop-blur-sm md:px-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_deadlines_7d}</p>
          <p className="mt-1 text-base font-medium tabular-nums tracking-tight text-zinc-100">
            {deadlines.isLoading ? "…" : upcoming ? upcoming.length : "—"}
          </p>
          {peremptory > 0 ? (
            <p className="text-xs text-red-400">
              {peremptory === 1 ? m.kpi_peremptory_one : m.kpi_peremptory_many.replace("{n}", String(peremptory))}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_pending_review}</p>
          <p className="mt-1 text-base font-medium tabular-nums tracking-tight text-zinc-100">
            {queue.loading ? "…" : queue.openCount ?? "—"}
          </p>
          {queue.forbidden ? <p className="text-xs text-zinc-500">{m.kpi_pending_review_forbidden}</p> : null}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_knowledge_pack}</p>
          <p className="mt-1 truncate text-base font-medium tracking-tight text-zinc-200">{pack.loading ? "…" : packLabel}</p>
          {loadedAt ? <p className="text-xs text-zinc-500">{m.kpi_pack_loaded.replace("{date}", loadedAt)}</p> : null}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_system}</p>
          <p className={`mt-1 text-base font-medium tracking-tight ${sysOk ? "text-emerald-400" : "text-amber-400"}`}>
            {health.loading ? "…" : sysOk ? m.kpi_ok : m.kpi_degraded}
          </p>
        </div>
      </div>
    </div>
  );
}
