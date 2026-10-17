"use client";

import { DCC_CLASSES } from "@/components/dcc/clases";
import { useBankApplication } from "@/lib/credit-hub/hooks/useBankDecision";
import type { BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import { formatMoneda, type LocaleTenant } from "@/lib/dcc/formato";
import { porcentaje } from "../comun/formato";

/** Dato ausente: "—" con el motivo en llano, nunca un 0. */
function Campo({ k, v, motivo }: { k: string; v: string | null; motivo: string }) {
  return (
    <div className="min-w-0" data-testid="cola-evidencia-campo">
      <dt className={DCC_CLASSES.subtle}>{k}</dt>
      <dd className="mt-0.5 font-medium">
        {v ?? "—"}
        {v === null ? <span className={`block text-[11px] font-normal ${DCC_CLASSES.subtle}`}>{motivo}</span> : null}
      </dd>
    </div>
  );
}

/**
 * Ingreso, deuda / ingreso y regla del motor de una solicitud de la cola. La
 * cola no los trae: salen del expediente, con la misma consulta (misma clave
 * de cache que ExpedienteV2). Solo se monta con la evidencia abierta.
 */
export function EvidenciaCola({ applicationId, formato }: { applicationId: string; formato: LocaleTenant }) {
  const q = useBankApplication(applicationId);
  const payload = q.data?.application_payload as BankReviewPayload | undefined;
  const a = payload?.analysis;
  const texto = typeof a?.explanation === "string" && a.explanation.trim() ? a.explanation.trim() : null;
  const motivo = q.isError ? "No pudimos cargar el expediente." : q.isLoading ? "Cargando…" : "La solicitud no trae este dato.";
  return (
    <>
      <Campo k="Ingreso mensual" v={formatMoneda(a?.metrics?.monthly_income, formato)} motivo={motivo} />
      <Campo k="Deuda / ingreso" v={porcentaje(a?.dti ?? payload?.financial?.dti, formato)} motivo={motivo} />
      <Campo k="Regla del motor" v={texto} motivo={motivo} />
    </>
  );
}
