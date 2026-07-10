"use client";

import { useState } from "react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { postCancelApplication } from "@/lib/credit-hub/api/operationalClient";

export function CancelApplicationButton({
  applicationId,
  tenantId,
  displayStatus,
  onCancelled,
}: {
  applicationId: string;
  tenantId: string;
  displayStatus?: string | null;
  onCancelled: () => void;
}) {
  const status = (displayStatus ?? "").toUpperCase();
  const hidden = ["DISBURSED", "CANCELLED", "EXPIRED"].includes(status);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (hidden) return null;

  const cancel = async () => {
    if (!reason.trim()) {
      forgeToast.error("Indica el motivo de cancelación");
      return;
    }
    setBusy(true);
    try {
      await postCancelApplication({ tenantId, applicationId, reason: reason.trim() });
      forgeToast.success("Solicitud cancelada");
      setOpen(false);
      onCancelled();
    } catch (err) {
      if (err instanceof CHApiError && err.status === 409) {
        forgeToast.error("No se puede cancelar — la solicitud ya fue desembolsada");
      } else {
        forgeToast.error(err instanceof CHApiError ? err.detail : "Error al cancelar");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" data-testid="cancel-application-btn" onClick={() => setOpen(true)}>
        Cancelar solicitud
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ch-card max-w-md w-full p-4">
            <h3 className="font-semibold">Cancelar solicitud</h3>
            <p className="mt-1 text-sm text-forgeGray-600">Esta acción no se puede deshacer.</p>
            <textarea
              className="mt-3 w-full rounded border p-2 text-sm"
              placeholder="Motivo de cancelación *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" disabled={busy} onClick={() => setOpen(false)}>
                Volver
              </button>
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled={busy} onClick={() => void cancel()}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function OperationalStatusBanner({
  displayStatus,
  cancelReason,
  disbursementReference,
}: {
  displayStatus?: string | null;
  cancelReason?: string | null;
  disbursementReference?: string | null;
}) {
  const status = (displayStatus ?? "").toUpperCase();
  if (status === "READY_FOR_DISBURSEMENT") {
    return (
      <p className="mb-4 rounded-lg p-3 text-sm" style={{ color: "var(--ch-success-text)", background: "var(--ch-success-soft)" }} data-testid="banner-ready-disbursement">
        Tu solicitud está lista para desembolso
      </p>
    );
  }
  if (status === "DISBURSED") {
    return (
      <p className="mb-4 rounded-lg p-3 text-sm" style={{ color: "var(--ch-success-text)", background: "var(--ch-success-soft)" }} data-testid="banner-disbursed">
        Préstamo desembolsado{disbursementReference ? ` — Referencia: ${disbursementReference}` : ""}
      </p>
    );
  }
  if (status === "CANCELLED") {
    return (
      <p className="mb-4 rounded-lg p-3 text-sm" style={{ color: "var(--ch-danger-text)", background: "var(--ch-danger-soft)" }} data-testid="banner-cancelled">
        Solicitud cancelada{cancelReason ? ` — Motivo: ${cancelReason}` : ""}
      </p>
    );
  }
  if (status === "EXPIRED") {
    return (
      <p className="mb-4 rounded-lg p-3 text-sm" style={{ color: "var(--ch-text-3)", background: "var(--ch-surface-2)" }} data-testid="banner-expired">
        Esta solicitud ha expirado por inactividad
      </p>
    );
  }
  return null;
}
