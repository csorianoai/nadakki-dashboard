"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { fetchBankApplicationDetail } from "@/lib/bank-application-detail/fetch-detail";
import { useStipulations } from "@/hooks/useStipulations";
import { StipulationsList } from "@/components/bank/stipulations/StipulationsList";
import { StipulationsModal } from "@/components/bank/StipulationsModal";
import { Button } from "@/components/ui/button";
import { isBankStipulationWorkflowUiEnabled } from "@/lib/env/bank-stipulation-workflow";
import { StipulationsPageSkeleton } from "@/components/bank/stipulations/StipulationsPageSkeleton";
import { StipulationVerifyModal } from "@/components/bank/stipulations/StipulationVerifyModal";
import { StipulationRejectModal } from "@/components/bank/stipulations/StipulationRejectModal";
import { DocumentPreviewModal } from "@/components/bank/stipulations/DocumentPreviewModal";
import { captureApiError } from "@/lib/observability/telemetry";
import { trackCriticalUserAction } from "@/lib/observability/user-actions";
import "./stipulations-print.css";

export function StipulationsAdminClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const { tenantId } = useTenant();
  const {
    stipulations,
    error,
    isLoading,
    isValidating,
    mutate,
    role,
    canMutate,
    verify,
    reject,
    create,
    sendPendingToDealer,
  } = useStipulations(id, tenantId);

  const { data: appDetail } = useSWR(
    id ? (["bank-application-detail-dealer", id] as const) : null,
    ([, appId]) => fetchBankApplicationDetail(appId),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const dealerId = appDetail?.dealer?.id?.trim() ?? "";

  const workflowUi = isBankStipulationWorkflowUiEnabled();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const list = stipulations ?? [];
  const selectedIndex = useMemo(() => list.findIndex((s) => s.id === selectedId), [list, selectedId]);

  useEffect(() => {
    if (list.length && selectedId == null) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  const stipById = useCallback((sid: string | null) => list.find((s) => s.id === sid), [list]);

  const moveSelection = useCallback(
    (delta: number) => {
      if (!list.length) return;
      const cur = selectedIndex < 0 ? 0 : selectedIndex;
      const next = Math.min(list.length - 1, Math.max(0, cur + delta));
      setSelectedId(list[next].id);
    },
    [list, selectedIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (verifyId || rejectId || previewId || workflowModalOpen) return;
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        moveSelection(1);
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        moveSelection(-1);
      }
      if (e.key === "Enter" && canMutate && selectedId) {
        const s = stipById(selectedId);
        if (s && (s.status === "pending" || s.status === "uploaded")) {
          e.preventDefault();
          setVerifyId(selectedId);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canMutate, moveSelection, previewId, rejectId, selectedId, stipById, verifyId, workflowModalOpen]);

  const activeVerify = stipById(verifyId);
  const activeReject = stipById(rejectId);
  const activePreview = stipById(previewId);

  const bulkSlot = useMemo(() => {
    if (!workflowUi || !canMutate) return null;
    return (
      <>
        <Button type="button" onClick={() => setWorkflowModalOpen(true)} data-testid="stip-workflow-new">
          Nueva estipulación
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              const r = await sendPendingToDealer();
              toast.success(
                r.uploadLinksIssued === 0
                  ? "No hay estipulaciones en estado pendiente."
                  : r.notifyUnsupported
                    ? `Se generaron ${r.uploadLinksIssued} enlace(s). Notificación al dealer aún no disponible.`
                    : `Se generaron ${r.uploadLinksIssued} enlace(s) y se notificó al dealer.`,
              );
              trackCriticalUserAction(
                "stipulation_bulk_send_dealer",
                { application_id: id, count: r.uploadLinksIssued },
                tenantId,
              );
            } catch (err) {
              toast.error("No se pudo enviar enlaces / notificar.");
              captureApiError(err, { endpoint: "stipulations_workflow_bulk", method: "POST", tenantId });
            }
          }}
          data-testid="stip-workflow-send-pending"
        >
          Enviar enlaces pendientes
        </Button>
      </>
    );
  }, [workflowUi, canMutate, sendPendingToDealer, id, tenantId]);

  if (isLoading) {
    return <StipulationsPageSkeleton />;
  }

  if (error) {
    const msg =
      error instanceof BankApplicationAuthError
        ? "auth"
        : error instanceof BankApplicationHttpError
          ? `http_${error.status}`
          : "unknown";
    if (error instanceof BankApplicationAuthError) {
      if (typeof window !== "undefined") {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      }
      return null;
    }
    return (
      <main className="bank-stipulations-print mx-auto max-w-2xl p-8 text-center">
        <p className="text-forge-sm text-forgeGray-700">No se pudieron cargar las estipulaciones ({msg}).</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white no-print"
          onClick={() => void mutate()}
        >
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="bank-stipulations-print mx-auto max-w-3xl space-y-6 p-4 md:p-8" aria-label="Estipulaciones de la solicitud">
      <nav className="no-print flex flex-wrap items-center justify-between gap-3" aria-label="Migas">
        <Link
          href={`/bank/applications/${encodeURIComponent(id)}`}
          className="text-forge-sm font-medium text-forgeBrand-700 hover:underline"
        >
          ← Volver al detalle
        </Link>
        <span className="text-forge-xs text-forgeGray-500">
          Rol: <span className="font-forgeMono text-forgeGray-800">{role}</span>
          {isValidating ? " · sincronizando…" : ""}
        </span>
      </nav>

      <header className="print:block">
        <h1 className="text-2xl font-bold text-forgeGray-900">Estipulaciones</h1>
        <p className="mt-1 text-forge-sm text-forgeGray-600">
          Solicitud <span className="font-forgeMono">{id}</span>. Atajos: <kbd className="rounded border px-1">j</kbd>{" "}
          / <kbd className="rounded border px-1">k</kbd> navegar; <kbd className="rounded border px-1">Enter</kbd>{" "}
          verificar (admin).
        </p>
      </header>

      {bulkSlot && !list.length ? (
        <div className="no-print flex flex-wrap gap-2" data-testid="stip-workflow-toolbar-empty">
          {bulkSlot}
        </div>
      ) : null}

      {!list.length ? (
        <div
          className="rounded-xl border border-dashed border-forgeGray-200 bg-forgeGray-50/60 p-10 text-center"
          data-testid="stipulations-empty"
        >
          <p className="m-0 text-forge-sm font-medium text-forgeGray-800">No stipulations yet</p>
          <p className="mt-2 m-0 text-forge-sm text-forgeGray-600">Aún no hay estipulaciones para esta solicitud.</p>
        </div>
      ) : (
        <StipulationsList
          applicationId={id}
          stipulations={list}
          selectedId={selectedId}
          role={role}
          canMutate={canMutate}
          onSelect={setSelectedId}
          onPreview={setPreviewId}
          onVerify={setVerifyId}
          onReject={setRejectId}
          bulkActionsSlot={bulkSlot}
        />
      )}

      <StipulationVerifyModal
        open={verifyId != null}
        title={activeVerify?.description ?? ""}
        onClose={() => setVerifyId(null)}
        onConfirm={async (notes) => {
          if (!verifyId) return;
          try {
            await verify(verifyId, notes);
            toast.success("Estipulación verificada.");
            trackCriticalUserAction("stipulation_verify", { application_id: id, stipulation_id: verifyId }, tenantId);
          } catch (err) {
            toast.error("No se pudo verificar.");
            captureApiError(err, {
              endpoint: `/api/v2/credit/applications/${id}/stipulations/${verifyId}/verify`,
              method: "POST",
              tenantId,
            });
            throw err;
          }
        }}
      />

      <StipulationRejectModal
        open={rejectId != null}
        title={activeReject?.description ?? ""}
        onClose={() => setRejectId(null)}
        onConfirm={async (reason) => {
          if (!rejectId) return;
          try {
            await reject(rejectId, reason);
            toast.success("Estipulación rechazada.");
            trackCriticalUserAction(
              "stipulation_reject",
              { application_id: id, stipulation_id: rejectId },
              tenantId,
            );
          } catch (err) {
            toast.error("No se pudo rechazar.");
            captureApiError(err, {
              endpoint: `/api/v2/credit/applications/${id}/stipulations/${rejectId}/reject`,
              method: "POST",
              tenantId,
            });
            throw err;
          }
        }}
      />

      {previewId && activePreview ? (
        <DocumentPreviewModal
          open
          applicationId={id}
          stipulationId={previewId}
          role={role}
          title={activePreview.description}
          onClose={() => setPreviewId(null)}
        />
      ) : null}

      {workflowUi ? (
        <StipulationsModal
          applicationId={id}
          dealerId={dealerId}
          tenantId={tenantId}
          isOpen={workflowModalOpen}
          onClose={() => setWorkflowModalOpen(false)}
          onSave={async (payload) => {
            try {
              await create(payload);
              toast.success("Estipulación creada.");
              trackCriticalUserAction("stipulation_create", { application_id: id, type: payload.type }, tenantId);
            } catch (err) {
              toast.error("No se pudo crear la estipulación.");
              captureApiError(err, {
                endpoint: `/api/v2/credit/applications/${id}/stipulations`,
                method: "POST",
                tenantId,
              });
              throw err;
            }
          }}
        />
      ) : null}
    </main>
  );
}
