"use client";

import { Target } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { currentGoalsPeriod } from "@/lib/credit-hub/api/goalsClient";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";
import { presentMonthlyGoal } from "@/lib/credit-hub/utils/goalPresentation";
import type { MonthlyGoalItem } from "@/lib/credit-hub/types/goals";
import { formatEntero, formatMonedaCompacta, formatPorcentaje, type LocaleTenant } from "@/lib/dcc/formato";

const ESTADO: Record<string, string> = { cumplido: "text-[var(--dcc-ok-fg)]", "en camino": "text-[var(--dcc-fg-muted)]", atrasado: "text-[var(--dcc-partial-fg)]" };

/** Valor de una meta segun su unidad, con la moneda del branding (nunca RD$ fijo). */
function valor(v: number | null | undefined, unidad: string, f: LocaleTenant): string | null {
  const u = unidad.toLowerCase();
  if (u === "ratio") return formatPorcentaje(v, f);
  if (u === "hours" || u === "hour") return v != null ? `${new Intl.NumberFormat(f.locale, { maximumFractionDigits: 1 }).format(v)} h` : null;
  if (u === "dop" || u === "currency") return formatMonedaCompacta(v, f);
  return formatEntero(v, f);
}

/**
 * Metas operativas del mes en la Mesa (bank-v2): la misma consulta que la Mesa
 * actual (goals/monthly del periodo, rol banco) y el mismo calculo de avance.
 */
export function MetasDelMes({ formato }: { formato: LocaleTenant }) {
  const periodo = currentGoalsPeriod();
  const q = useMonthlyGoals("bank", periodo);
  const metas: MonthlyGoalItem[] = q.data?.goals ?? [];
  const mes = new Intl.DateTimeFormat(formato.locale, { month: "long", year: "numeric" }).format(new Date(`${q.data?.period ?? periodo}-15T12:00:00`));
  return (
    <DccSeccion titulo="Metas del mes" icono={Target} meta={mes} testId="mesa-metas">
      {q.isError ? (
        <DccEstado estado="error" detalle="No pudimos cargar las metas" onReintentar={() => void q.refetch()} />
      ) : !q.data ? (
        <DccEstado estado="cargando" />
      ) : metas.length === 0 ? (
        <DccEstado estado="vacio" detalle="No hay metas del banco para este mes." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metas.map((m) => {
            const p = presentMonthlyGoal(m, formato.currency ?? "", periodo);
            return (
              <li key={m.metric_key} className="grid gap-1.5 text-sm">
                <p className="font-medium">{m.label_es?.trim() || "Meta del mes"}</p>
                <p className="tabular-nums">
                  {valor(m.current_value, m.unit, formato) ?? "—"} <span className={DCC_CLASSES.subtle}>de {valor(m.target_value, m.unit, formato) ?? "—"}</span>
                </p>
                <span className="h-1.5 overflow-hidden rounded-sm bg-[var(--dcc-surface-muted)]">
                  <span className="block h-full rounded-sm bg-[var(--dcc-teal)]" style={{ width: `${p.pct}%` }} />
                </span>
                <p className={`text-xs font-semibold ${ESTADO[p.status] ?? DCC_CLASSES.subtle}`}>{p.status === "cumplido" ? "Cumplida" : p.status === "atrasado" ? "Atrasada" : "En camino"}</p>
              </li>
            );
          })}
        </ul>
      )}
    </DccSeccion>
  );
}
