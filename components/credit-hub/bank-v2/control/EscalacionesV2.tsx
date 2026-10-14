"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { chRelTime } from "@/lib/credit-hub/bank/bankFormat";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { DetalleTecnico } from "../comun/DetalleTecnico";

const CATEGORIAS = new Set(["kyc_escalated", "ocr_escalated"]);

/**
 * Escalaciones KYC / OCR (bank-v2). La misma fuente y el mismo filtro que la
 * pantalla actual (notificaciones del backend), con el mismo flag. Cuando no
 * hay fuente, "Próximamente" en llano; el nombre del flag, en "Detalle técnico".
 */
export function EscalacionesV2({ marca, hrefSolicitud }: { marca: MarcaDcc; hrefSolicitud: (id: string) => string }) {
  const { items, isLoading, hidden } = useNotifications();
  const escalaciones = items.filter((n) => {
    const cat = String((n as { category?: string }).category ?? "").toLowerCase();
    const titulo = (n.title ?? "").toLowerCase();
    return CATEGORIAS.has(cat) || titulo.includes("escal") || titulo.includes("kyc") || titulo.includes("ocr");
  });
  const piloto = isBankPilotUiEnabled();
  const tecnico = !piloto
    ? "panel apagado por NEXT_PUBLIC_BANK_PILOT_UI"
    : hidden
      ? "notificaciones apagadas (NEXT_PUBLIC_CH_NOTIFICATIONS); no hay endpoint de listado de escalaciones"
      : null;
  const cuerpo = tecnico ? (
    <DccEstado estado="no_disponible" detalle="Las escalaciones estarán disponibles próximamente." />
  ) : isLoading ? (
    <DccEstado estado="cargando" />
  ) : escalaciones.length === 0 ? (
    <DccEstado estado="vacio" detalle="No hay escalaciones pendientes de revisión manual." />
  ) : (
    <ul className="divide-y divide-[var(--dcc-border)]">
      {escalaciones.map((n) => {
        const id = (n as { application_id?: string }).application_id;
        return (
          <li key={n.id} className="grid gap-1 py-3 text-sm">
            <p className="font-medium">{n.title}</p>
            {n.body ? <p className={DCC_CLASSES.muted}>{n.body}</p> : null}
            <p className={`flex flex-wrap gap-3 text-xs ${DCC_CLASSES.subtle}`}>
              <span>Pendiente de revisión manual</span>
              {n.at ? <span>{chRelTime(n.at)}</span> : null}
              {id ? (
                <Link href={hrefSolicitud(id)} className={`min-h-0 ${DCC_CLASSES.link}`}>
                  Ver solicitud
                </Link>
              ) : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
  return (
    <DccPageMarco titulo="Escalaciones" marca={marca}>
      <DccSeccion titulo="Escalaciones KYC y OCR" icono={ShieldAlert}>
        {cuerpo}
      </DccSeccion>
      {tecnico ? (
        <div className="mt-[var(--dcc-gap)]">
          <DetalleTecnico notas={[{ que: "Escalaciones", detalle: tecnico }]} />
        </div>
      ) : null}
    </DccPageMarco>
  );
}
