"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { useBankGlobalAuditTrail } from "@/lib/credit-hub/hooks/useBankAuditCompliance";
import { formatEntero } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { textoActor, textoDecision, textoEvento } from "../expediente/expediente";

const CAMPO = "h-9 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-2 text-sm";

/**
 * Auditoria (bank-v2). El mismo agregado que la pantalla actual
 * (useBankGlobalAuditTrail), con los mismos filtros (quien y que), en
 * llano: sin ids, sin eventos crudos y con enlace a la solicitud.
 */
export function AuditoriaV2({ marca, hrefSolicitud }: { marca: MarcaDcc; hrefSolicitud: (id: string) => string }) {
  const a = useBankGlobalAuditTrail();
  const f = marca.formato;
  const [quien, setQuien] = useState("all");
  const [que, setQue] = useState("all");
  const eventos = useMemo(
    () => [...a.events].map((e) => ({ ...e, quien: textoActor(e.actor), que: textoEvento(e.action) })).sort((x, y) => y.timestamp.localeCompare(x.timestamp)),
    [a.events],
  );
  const quienes = [...new Set(eventos.map((e) => e.quien))];
  const ques = [...new Set(eventos.map((e) => e.que))];
  const visibles = eventos.filter((e) => (quien === "all" || e.quien === quien) && (que === "all" || e.que === que));
  const hora = new Intl.DateTimeFormat(f.locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

  if (a.isError) return <DccEstado estado="error" detalle="No pudimos cargar la auditoría" onReintentar={a.refetch} />;
  if (a.isLoading) return <DccEstado estado="cargando" />;

  return (
    <DccPageMarco titulo="Auditoría" marca={marca}>
      <DccSeccion titulo="Registro de la mesa" icono={History} meta={`${formatEntero(visibles.length, f)} eventos · lo más reciente primero`}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <select aria-label="Quién" value={quien} onChange={(e) => setQuien(e.target.value)} className={CAMPO}>
            <option value="all">Todos</option>
            {quienes.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select aria-label="Qué" value={que} onChange={(e) => setQue(e.target.value)} className={CAMPO}>
            <option value="all">Todas las acciones</option>
            {ques.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          {a.isPartialCoverage ? (
            <SelloCalidad calidad={{ estado: "parcial", cubiertos: null, total: null, motivo: "Se leen las solicitudes más recientes de la cola (máximo 50)" }} />
          ) : null}
        </div>
        {visibles.length === 0 ? (
          <DccEstado estado="vacio" />
        ) : (
          <ol className="divide-y divide-[var(--dcc-border)]">
            {visibles.map((e) => {
              const d = new Date(e.timestamp);
              const decision = textoDecision(typeof e.details?.decision === "string" ? e.details.decision : null);
              return (
                <li key={e.id} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[170px_150px_minmax(0,1fr)_auto]">
                  <span className={`tabular-nums ${DCC_CLASSES.muted}`}>{Number.isNaN(d.getTime()) ? "—" : hora.format(d)}</span>
                  <span>{e.quien}</span>
                  <span title={e.action}>
                    {e.que}
                    {decision ? ` · ${decision}` : ""}
                  </span>
                  {e.applicationId ? (
                    <Link href={hrefSolicitud(e.applicationId)} className={`min-h-0 ${DCC_CLASSES.link}`}>
                      Ver solicitud
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </DccSeccion>
    </DccPageMarco>
  );
}
