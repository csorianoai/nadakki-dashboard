"use client";

import { useState } from "react";
import { Car, Search } from "lucide-react";
import { getVinAnomalies, type VinAnomaliesResult } from "@/app/(forge)/credit-hub/bank/_lib/ops-actions-api";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { formatEntero } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { textoSeveridad } from "../expediente/expediente";

/**
 * Historial de vehiculos (bank-v2). La misma consulta bajo demanda que la
 * pantalla actual (getVinAnomalies). Sin JSON crudo ni etiquetas de campo:
 * cada anomalia con su detalle y severidad en llano.
 */
export function VehiculosV2({ marca }: { marca: MarcaDcc }) {
  const { apiTenantId } = useTenant();
  const [vin, setVin] = useState("");
  const [estado, setEstado] = useState<"inicio" | "cargando" | "error" | "listo">("inicio");
  const [res, setRes] = useState<VinAnomaliesResult | null>(null);
  const f = marca.formato;
  const consultar = async () => {
    const v = vin.trim().toUpperCase();
    if (!v || !apiTenantId) return;
    setEstado("cargando");
    try {
      setRes(await getVinAnomalies(apiTenantId, v));
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  };
  const anomalias = res?.anomalies ?? [];
  return (
    <DccPageMarco titulo="Historial de vehículos" marca={marca}>
      <DccSeccion titulo="Consultar un VIN" icono={Car}>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void consultar();
          }}
        >
          <label className="grid min-w-[240px] flex-1 gap-1 text-sm">
            VIN
            <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="Ej. 1HGBH41JXMN109186" className="h-9 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-3 font-mono uppercase" />
          </label>
          <button type="submit" disabled={!vin.trim() || estado === "cargando"} className={DCC_CLASSES.actionButton}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Consultar
          </button>
        </form>
        <div className="mt-4">
          {estado === "cargando" ? <DccEstado estado="cargando" /> : null}
          {estado === "error" ? <DccEstado estado="error" detalle="No pudimos consultar ese VIN" onReintentar={() => void consultar()} /> : null}
          {estado === "listo" ? (
            anomalias.length === 0 ? (
              <DccEstado estado="vacio" detalle="Sin anomalías registradas para este VIN." />
            ) : (
              <div className="grid gap-2 text-sm">
                <p className={DCC_CLASSES.muted}>{formatEntero(res?.anomaly_count ?? anomalias.length, f)} anomalías registradas.</p>
                <ul className="divide-y divide-[var(--dcc-border)]">
                  {anomalias.map((a, i) => (
                    <li key={i} className="py-2.5">
                      <p className="font-medium">{typeof a.detail === "string" ? a.detail : "Anomalía en el historial"}</p>
                      <p className={`text-xs ${DCC_CLASSES.subtle}`}>Severidad {textoSeveridad(typeof a.severity === "string" ? a.severity : null).toLowerCase()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ) : null}
        </div>
      </DccSeccion>
    </DccPageMarco>
  );
}
