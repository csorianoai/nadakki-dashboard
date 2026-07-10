"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getDocumentRequests,
  isOperationalEndpointUnavailable,
  postDisburse,
  postReadyForDisbursement,
} from "@/lib/credit-hub/api/operationalClient";
import { documentRequestStatusMeta, documentRequestTypeLabel } from "@/lib/credit-hub/operational/document-requests";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function DisbursementPanel({
  applicationId,
  displayStatus,
}: {
  applicationId: string;
  displayStatus?: string | null;
}) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [refInput, setRefInput] = useState("");
  const [showDisburse, setShowDisburse] = useState(false);
  const [busy, setBusy] = useState(false);

  const status = (displayStatus ?? "").toUpperCase();
  if (status !== "OFFER_SELECTED" && status !== "READY_FOR_DISBURSEMENT") return null;

  const docsQ = useQuery({
    queryKey: ["document-requests", apiTenantId, applicationId],
    queryFn: () => getDocumentRequests({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId && status === "OFFER_SELECTED",
    retry: false,
  });

  if (docsQ.error instanceof CHApiError && isOperationalEndpointUnavailable(docsQ.error)) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="disbursement-panel-unavailable">
        Proceso de cierre disponible cuando el backend despliegue los endpoints operacionales.
      </div>
    );
  }

  const pending = useMemo(() => {
    const reqs = docsQ.data?.requests ?? [];
    return reqs.filter((r) => String(r.status).toUpperCase() !== "ACCEPTED");
  }, [docsQ.data?.requests]);

  const docsComplete = pending.length === 0;

  const markReady = async () => {
    if (!apiTenantId) return;
    setBusy(true);
    try {
      await postReadyForDisbursement({ tenantId: apiTenantId, applicationId });
      forgeToast.success("Marcada lista para desembolso");
      void qc.invalidateQueries();
    } catch (err) {
      if (err instanceof CHApiError && err.status === 422) {
        forgeToast.error("Documentación pendiente — revisa las solicitudes");
      } else {
        forgeToast.error(err instanceof CHApiError ? err.detail : "Error al marcar listo");
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDisburse = async () => {
    if (!apiTenantId || !refInput.trim()) {
      forgeToast.error("Referencia de desembolso obligatoria");
      return;
    }
    setBusy(true);
    try {
      await postDisburse({ tenantId: apiTenantId, applicationId, disbursement_reference: refInput.trim() });
      forgeToast.success("Desembolso confirmado");
      setShowDisburse(false);
      void qc.invalidateQueries();
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "Error al confirmar desembolso");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ch-card p-4" data-testid="disbursement-panel">
      <h3 className="text-sm font-semibold">Proceso de cierre</h3>
      {status === "OFFER_SELECTED" ? (
        <>
          {docsComplete ? (
            <p className="mt-2 text-sm text-green-700">Documentación completa ✓</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {pending.map((r) => {
                const meta = documentRequestStatusMeta(String(r.status));
                return (
                  <li key={r.id} className="text-red-700">
                    {documentRequestTypeLabel(String(r.document_type))} — {meta.label}
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="ch-btn ch-btn-persona ch-btn-sm mt-3"
            disabled={!docsComplete || busy}
            onClick={() => void markReady()}
          >
            Marcar listo para desembolso
          </button>
        </>
      ) : null}
      {status === "READY_FOR_DISBURSEMENT" ? (
        <>
          <p className="mt-2 text-sm text-green-700">Lista para desembolso</p>
          {!showDisburse ? (
            <button type="button" className="ch-btn ch-btn-persona ch-btn-sm mt-3" onClick={() => setShowDisburse(true)}>
              Confirmar desembolso
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Referencia de desembolso *"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" disabled={busy} onClick={() => void confirmDisburse()}>
                  Confirmar
                </button>
                <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" onClick={() => setShowDisburse(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
