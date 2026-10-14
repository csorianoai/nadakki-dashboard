"use client";

import { Target } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { currentGoalsPeriod } from "@/lib/credit-hub/api/goalsClient";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";
import { presentMonthlyGoal } from "@/lib/credit-hub/utils/goalPresentation";
import type { MonthlyGoalItem } from "@/lib/credit-hub/types/goals";
import type { LocaleTenant } from "@/lib/dcc/formato";
import { comparacionMeta, diasRestantes, estadoMeta, objetivoMeta, ritmoMeta, valorMeta } from "./metas";

const ESTADO: Record<string, string> = { cumplido: "text-[var(--dcc-ok-fg)]", "en camino": "text-[var(--dcc-fg-muted)]", atrasado: "text-[var(--dcc-partial-fg)]" };

/**
 * Metas operativas del mes en la Mesa (bank-v2): la misma consulta que la Mesa
 * actual (goals/monthly del periodo, rol banco) y el mismo calculo de avance,
 * con los dias restantes, la meta con su comparador (≥/≤), la comparacion en
 * llano y, en metas acumulables, el ritmo esperado a hoy.
 */
export function MetasDelMes({ formato, ahora = new Date() }: { formato: LocaleTenant; ahora?: Date }) {
  const periodo = currentGoalsPeriod();
  const q = useMonthlyGoals("bank", periodo);
  const metas: MonthlyGoalItem[] = q.data?.goals ?? [];
  const mes = new Intl.DateTimeFormat(formato.locale, { month: "long", year: "numeric" }).format(new Date(`${q.data?.period ?? periodo}-15T12:00:00`));
  const quedan = diasRestantes(q.data?.period ?? periodo, ahora);
  const meta = quedan === null ? mes : `${mes} · ${quedan === 1 ? "queda 1 día" : `quedan ${quedan} días`}`;
  return (
    <DccSeccion titulo="Metas del mes" icono={Target} meta={meta} testId="mesa-metas">
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
            const comparacion = comparacionMeta(m, formato);
            const ritmo = ritmoMeta(m, q.data?.period ?? periodo, ahora, formato);
            const estado = estadoMeta(m, q.data?.period ?? periodo, ahora, p.status);
            return (
              <li key={m.metric_key} data-testid="meta-del-mes" className="grid gap-1.5 text-sm">
                <p className="font-medium">{m.label_es?.trim() || "Meta del mes"}</p>
                <p className="tabular-nums">
                  {valorMeta(m.current_value, m.unit, formato) ?? "—"} <span className={DCC_CLASSES.subtle}>· meta {objetivoMeta(m, formato) ?? "—"}</span>
                </p>
                <span className="h-1.5 overflow-hidden rounded-sm bg-[var(--dcc-surface-muted)]">
                  <span className="block h-full rounded-sm bg-[var(--dcc-teal)]" style={{ width: `${p.pct}%` }} />
                </span>
                <p className={`text-xs font-semibold ${ESTADO[estado] ?? DCC_CLASSES.subtle}`}>
                  {estado === "cumplido" ? "Cumplida" : estado === "atrasado" ? "Atrasada" : "En camino"}
                  {comparacion ? <span className={`font-normal ${DCC_CLASSES.muted}`}> · {comparacion}</span> : null}
                </p>
                {ritmo ? <p className={`text-xs ${DCC_CLASSES.subtle}`}>{ritmo}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </DccSeccion>
  );
}
