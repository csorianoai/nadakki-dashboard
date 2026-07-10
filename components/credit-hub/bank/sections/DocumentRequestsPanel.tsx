"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getDocumentRequests,
  isOperationalEndpointUnavailable,
  postDocumentRequest,
  patchDocumentRequestReview,
  type DocumentRequestItem,
} from "@/lib/credit-hub/api/operationalClient";
import {
  DOCUMENT_REQUEST_TYPE_OPTIONS,
  documentRequestStatusMeta,
  documentRequestTypeLabel,
} from "@/lib/credit-hub/operational/document-requests";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

function ReviewModal({
  applicationId,
  item,
  onClose,
  onDone,
}: {
  applicationId: string;
  item: DocumentRequestItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const { apiTenantId } = useTenant();
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const review = async (action: "accept" | "reject") => {
    if (!apiTenantId) return;
    if (action === "reject" && !reason.trim()) {
      forgeToast.error("Indica el motivo del rechazo");
      return;
    }
    setBusy(true);
    try {
      await patchDocumentRequestReview({
        tenantId: apiTenantId,
        requestId: item.id,
        decision: action === "accept" ? "ACCEPTED" : "REJECTED",
        notes: action === "reject" ? reason.trim() : notes.trim() || undefined,
      });
      forgeToast.success(action === "accept" ? "Documento aceptado" : "Documento rechazado");
      onDone();
      onClose();
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "Error al revisar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
      <div className="ch-card max-w-md w-full p-4">
        <h3 className="font-semibold">Revisar documento</h3>
        <p className="mt-1 text-sm text-forgeGray-600">{documentRequestTypeLabel(item.document_type)}</p>
        <textarea
          className="mt-3 w-full rounded border p-2 text-sm"
          placeholder="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded border p-2 text-sm"
          placeholder="Motivo de rechazo (obligatorio si rechaza)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled={busy} onClick={() => void review("reject")}>
            Rechazar
          </button>
          <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" disabled={busy} onClick={() => void review("accept")}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentRequestsPanel({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [showRequest, setShowRequest] = useState(false);
  const [docType, setDocType] = useState("employment_letter");
  const [message, setMessage] = useState("");
  const [reviewItem, setReviewItem] = useState<DocumentRequestItem | null>(null);

  const q = useQuery({
    queryKey: ["document-requests", apiTenantId, applicationId],
    queryFn: () => getDocumentRequests({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isOperationalEndpointUnavailable(q.error)) return null;

  const requests = q.data?.requests ?? [];

  const submitRequest = async () => {
    if (!apiTenantId) return;
    try {
      await postDocumentRequest({ tenantId: apiTenantId, applicationId, document_type: docType, message });
      forgeToast.success("Documento solicitado al dealer");
      setShowRequest(false);
      setMessage("");
      void qc.invalidateQueries({ queryKey: ["document-requests", apiTenantId, applicationId] });
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo solicitar");
    }
  };

  return (
    <div className="ch-card mt-4 p-4" data-testid="bank-document-requests">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Solicitudes de documentos</h3>
        <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => setShowRequest(true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Solicitar documento
        </button>
      </div>

      {showRequest ? (
        <div className="mb-4 rounded border p-3" style={{ borderColor: "var(--ch-border)" }}>
          <select className="w-full rounded border p-2 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOCUMENT_REQUEST_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea
            className="mt-2 w-full rounded border p-2 text-sm"
            placeholder="Mensaje al dealer"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" onClick={() => void submitRequest()}>
              Enviar solicitud
            </button>
            <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" onClick={() => setShowRequest(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <p className="text-sm text-forgeGray-500">Sin solicitudes adicionales.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => {
            const meta = documentRequestStatusMeta(String(r.status));
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
                <div>
                  <strong>{documentRequestTypeLabel(String(r.document_type))}</strong>
                  {r.message ? <p className="text-xs text-forgeGray-500">{r.message}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="ch-pill" style={{ color: meta.color, background: meta.bg, height: 22, fontSize: 10 }}>
                    {meta.label}
                  </span>
                  {String(r.status).toUpperCase() === "UPLOADED" ? (
                    <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => setReviewItem(r)}>
                      Revisar
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reviewItem ? (
        <ReviewModal
          applicationId={applicationId}
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onDone={() => void qc.invalidateQueries({ queryKey: ["document-requests", apiTenantId, applicationId] })}
        />
      ) : null}
    </div>
  );
}
