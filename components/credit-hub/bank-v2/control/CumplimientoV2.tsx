"use client";

import Link from "next/link";
import { ClipboardCheck, ShieldOff } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { useBankGlobalCompliance } from "@/lib/credit-hub/hooks/useBankAuditCompliance";
import type { Calidad } from "@/lib/dcc/calidad";
import { formatEntero } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { textoSeveridad } from "../expediente/expediente";

const RANGO: Record<string, number> = { alta: 0, media: 1, baja: 2 };

/**
 * Cumplimiento (bank-v2). El mismo agregado que la pantalla actual
 * (useBankGlobalCompliance: compliance/{id} de las ultimas solicitudes de la
 * cola). Sin el boton "Resolver", que hoy no hace nada, y sin contadores
 * fijos en "—": lo que no tiene endpoint dice "Próximamente".
 */
export function CumplimientoV2({ marca, hrefSolicitud }: { marca: MarcaDcc; hrefSolicitud: (id: string) => string }) {
  const c = useBankGlobalCompliance();
  const f = marca.formato;
  if (c.isError) return <DccEstado estado="error" detalle="No pudimos cargar el cumplimiento" onReintentar={c.refetch} />;
  if (c.isLoading) return <DccEstado estado="cargando" />;
  const issues = [...c.issues].sort((a, b) => (RANGO[a.severity] ?? 9) - (RANGO[b.severity] ?? 9));
  const altas = issues.filter((i) => i.severity === "alta").length;
  const cobertura: Calidad = c.isPartialCoverage
    ? { estado: "parcial", cubiertos: c.reviewedCount, total: null, motivo: "Se revisan las solicitudes más recientes de la cola (máximo 50): no hay un listado de cumplimiento del tenant" }
    : { estado: "parcial", cubiertos: null, total: null, motivo: "El backend del banco aún no declara la calidad de esta cifra" };

  return (
    <DccPageMarco titulo="Cumplimiento" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Incidencias" icono={ClipboardCheck} clave>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
            <DccKpiTile etiqueta="Incidencias abiertas" valor={formatEntero(issues.length, f)} nota={`${formatEntero(altas, f)} de severidad alta`} calidad={cobertura} />
            <DccKpiTile etiqueta="Solicitudes revisadas" valor={formatEntero(c.reviewedCount, f)} calidad={cobertura} />
            <DccKpiTile etiqueta="Derecho al olvido pendientes" valor={null} calidad={{ estado: "no_disponible", motivo: "No hay endpoint de listado RTBF" }} />
          </div>
          <div className="mt-4">
            {issues.length === 0 ? (
              <DccEstado estado="vacio" detalle="Las solicitudes revisadas no tienen incidencias abiertas." />
            ) : (
              <ul className="divide-y divide-[var(--dcc-border)]">
                {issues.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium" title={i.rule}>
                        {i.description}
                      </p>
                      <p className={`text-xs ${DCC_CLASSES.subtle}`}>Severidad {textoSeveridad(i.severity).toLowerCase()}</p>
                    </div>
                    <Link href={hrefSolicitud(i.application_id)} className={`min-h-0 ${DCC_CLASSES.link}`}>
                      Ver solicitud
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DccSeccion>
        <DccSeccion titulo="Derecho al olvido" icono={ShieldOff}>
          <p className={`text-sm ${DCC_CLASSES.muted}`}>Solicitudes de eliminación de datos personales.</p>
          <div className="mt-2">
            <SelloCalidad calidad={{ estado: "no_disponible", motivo: "El backend aún no expone el listado RTBF" }} />
          </div>
        </DccSeccion>
      </div>
    </DccPageMarco>
  );
}
