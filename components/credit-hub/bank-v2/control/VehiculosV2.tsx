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

/** VIN: 17 caracteres, letras y numeros, sin I, O ni Q (ISO 3779). */
const VIN_VALIDO = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Mensaje claro si el VIN no es valido; null si lo es. No consulta nada. */
export function errorVin(crudo: string): string | null {
  const v = crudo.trim().toUpperCase();
  if (!v) return "Escribe el VIN del vehículo.";
  if (/[IOQ]/.test(v)) return "El VIN no lleva las letras I, O ni Q. Revisa si es un 1 o un 0.";
  if (/[^A-Z0-9]/.test(v)) return "El VIN solo lleva letras y números, sin espacios ni guiones.";
  if (v.length !== 17) return `El VIN tiene 17 caracteres; este tiene ${v.length}.`;
  return VIN_VALIDO.test(v) ? null : "Revisa el VIN.";
}

/**
 * Historial de vehiculos (bank-v2). La misma consulta bajo demanda que la
 * pantalla actual (getVinAnomalies). Sin JSON crudo ni etiquetas de campo:
 * cada anomalia con su detalle y severidad en llano. El VIN se valida antes
 * de consultar: un VIN mal escrito no llega al backend.
 */
export function VehiculosV2({ marca }: { marca: MarcaDcc }) {
  const { apiTenantId } = useTenant();
  const [vin, setVin] = useState("");
  const [estado, setEstado] = useState<"inicio" | "cargando" | "error" | "listo">("inicio");
  const [res, setRes] = useState<VinAnomaliesResult | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const f = marca.formato;
  const consultar = async () => {
    const v = vin.trim().toUpperCase();
    const problema = errorVin(v);
    setAviso(problema);
    if (problema) {
      setEstado("inicio");
      setRes(null);
      return;
    }
    if (!apiTenantId) return;
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
          <div className="grid min-w-[240px] flex-1 gap-1 text-sm">
            <label className="grid gap-1">
              VIN
              <input
                value={vin}
                onChange={(e) => {
                  setVin(e.target.value);
                  if (aviso) setAviso(null);
                }}
                placeholder="Ej. 1HGBH41JXMN109186"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={aviso ? true : undefined}
                aria-describedby={aviso ? "vin-error" : undefined}
                className={`h-9 rounded-lg border bg-[var(--dcc-surface)] px-3 font-mono uppercase ${aviso ? "border-[var(--dcc-error-fg)]" : "border-[var(--dcc-border-strong)]"}`}
              />
            </label>
            {aviso ? (
              <span id="vin-error" role="alert" data-testid="vin-error" className="text-xs text-[var(--dcc-error-fg)]">
                {aviso}
              </span>
            ) : (
              <span className={`text-xs ${DCC_CLASSES.subtle}`}>17 caracteres, letras y números (sin I, O ni Q).</span>
            )}
          </div>
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
