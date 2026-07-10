"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getDocumentRequests,
  isOperationalEndpointUnavailable,
  patchDocumentRequestUpload,
} from "@/lib/credit-hub/api/operationalClient";
import { documentRequestStatusMeta, documentRequestTypeLabel } from "@/lib/credit-hub/operational/document-requests";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function DocumentRequestsDealerSection({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["document-requests", apiTenantId, applicationId],
    queryFn: () => getDocumentRequests({ tenantId: apiTenantId!, applicationId, actorRole: "dealer" }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isOperationalEndpointUnavailable(q.error)) return null;

  const requests = q.data?.requests ?? [];
  if (requests.length === 0 && !q.isLoading) return null;

  const upload = async (requestId: string) => {
    if (!apiTenantId) return;
    try {
      await patchDocumentRequestUpload({ tenantId: apiTenantId, applicationId, requestId });
      forgeToast.success("Documento marcado como subido");
      void qc.invalidateQueries({ queryKey: ["document-requests", apiTenantId, applicationId] });
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo subir");
    }
  };

  return (
    <div className="ch-card mt-4 p-4" data-testid="dealer-document-requests">
      <h3 className="mb-3 text-sm font-semibold">Documentos solicitados</h3>
      {q.isLoading ? <p className="text-sm text-forgeGray-500">Cargando…</p> : null}
      <ul className="space-y-2">
        {requests.map((r) => {
          const meta = documentRequestStatusMeta(String(r.status));
          const status = String(r.status).toUpperCase();
          const canUpload = status === "REQUESTED" || status === "REJECTED";
          return (
            <li key={r.id} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--ch-border)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{documentRequestTypeLabel(String(r.document_type))}</strong>
                <span className="ch-pill" style={{ color: meta.color, background: meta.bg, height: 22, fontSize: 10 }}>
                  {meta.label}
                </span>
              </div>
              {r.message ? <p className="mt-1 text-xs text-forgeGray-500">{r.message}</p> : null}
              {status === "REJECTED" && r.rejection_reason ? (
                <p className="mt-1 text-xs text-red-700">Motivo: {r.rejection_reason}</p>
              ) : null}
              {canUpload ? (
                <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm mt-2" onClick={() => void upload(r.id)}>
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  {status === "REJECTED" ? "Re-subir" : "Subir documento"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
