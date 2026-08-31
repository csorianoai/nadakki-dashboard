// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { BankApplicationDetailErrorBoundary } from "@/components/bank-application-detail/BankApplicationDetailErrorBoundary";
import { claimBankApplication } from "@/lib/bank-application-detail/claim-application";
import { OPTIMISTIC_CLAIM_TIMEOUT_MS } from "@/lib/bank-application-detail/constants";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { fetchBankApplicationDetail } from "@/lib/bank-application-detail/fetch-detail";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";
import { ActivityLog } from "./components/ActivityLog";
import { ActionPanel } from "./components/ActionPanel";
import { ApplicationDetailSkeleton } from "./components/ApplicationDetailSkeleton";
import { ApplicationHeader } from "./components/ApplicationHeader";
import { BorrowerSection } from "./components/BorrowerSection";
import { DocumentChecklist } from "./components/DocumentChecklist";
import { NotesPanel } from "./components/NotesPanel";
import { ScoringSection } from "./components/ScoringSection";
import { StipulationsPanel } from "./components/StipulationsPanel";
import { VehicleSection } from "./components/VehicleSection";
import { DecisionFormModal } from "./components/DecisionFormModal";
import { useAuth } from "@/hooks/useAuth";
import { captureApiError } from "@/lib/observability/telemetry";
import { trackCriticalUserAction } from "@/lib/observability/user-actions";
import { DocumentPreviewPane } from "@/components/bank/DocumentPreviewPane";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isDocumentPreviewUiEnabled } from "@/lib/env/feature-document-preview-ui";

function BankApplicationDetailInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [detail, setDetail] = useState<BankApplicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);
    try {
      const data = await fetchBankApplicationDetail(id);
      setDetail(data);
    } catch (err) {
      if (err instanceof BankApplicationAuthError) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (err instanceof BankApplicationHttpError) {
        if (err.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
          return;
        }
        if (err.status === 403) {
          setErrorCode("forbidden");
          console.error("bank_application_detail.forbidden", { status: err.status });
          return;
        }
        if (err.status === 404) {
          setErrorCode("not_found");
          return;
        }
        if (err.status === 503) {
          setErrorCode("unavailable");
          toast.error("Servicio no disponible. Intenta de nuevo.");
          console.error("bank_application_detail.unavailable", { status: err.status });
          return;
        }
        if (err.status >= 500) {
          toast.error("Error del servidor al cargar el detalle.");
          console.error("bank_application_detail.server_error", { status: err.status });
        }
        captureApiError(err, {
          endpoint: `/api/v2/credit/applications/${id}`,
          status: err.status,
          method: "GET",
          tenantId,
        });
      } else {
        console.error("bank_application_detail.load_failed", { error: err });
        captureApiError(err, {
          endpoint: `/api/v2/credit/applications/${id}`,
          method: "GET",
          tenantId,
        });
        toast.error("No se pudo cargar el detalle.");
      }
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, pathname, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClaim = useCallback(async () => {
    setClaimLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), OPTIMISTIC_CLAIM_TIMEOUT_MS);
    try {
      const analystId = user?.id || "unknown";
      const res = await claimBankApplication(id, analystId, controller.signal);
      window.clearTimeout(timer);
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (res.status === 403) {
        toast.error("Permiso denegado para reclamar.");
        return;
      }
      if (res.status === 409) {
        toast.message("Esta solicitud ya está tomada por otro analista.", { duration: 4500 });
        await load();
        return;
      }
      if (res.status === 503) {
        toast.error("Servicio no disponible.");
        return;
      }
      if (res.status >= 500) {
        toast.error("Error del servidor al reclamar.");
        return;
      }
      if (!res.ok) {
        captureApiError(new Error(`claim failed: ${res.status}`), {
          endpoint: `/api/v2/credit/applications/${id}/claim`,
          status: res.status,
          method: "POST",
          tenantId,
        });
        toast.error("No se pudo reclamar la solicitud.");
        return;
      }
      toast.success("Solicitud reclamada.");
      trackCriticalUserAction("claim", { application_id: id }, tenantId);
      await load();
    } catch (e) {
      window.clearTimeout(timer);
      console.error("bank_application_detail.claim_failed", { applicationId: id, error: e });
      captureApiError(e, {
        endpoint: `/api/v2/credit/applications/${id}/claim`,
        method: "POST",
        tenantId,
      });
      toast.error("Red interrumpida o tiempo agotado.");
    } finally {
      setClaimLoading(false);
    }
  }, [id, load, pathname, tenantId, user?.id]);

  const handleDecide = useCallback(() => {
    const owns = detail?.bank_claim?.current_user_owns === true;
    if (!owns) {
      toast.error("Debes reclamar la solicitud antes de registrar una decisión.");
      return;
    }
    setDecisionOpen(true);
  }, [detail?.bank_claim?.current_user_owns]);

  if (loading) {
    return <ApplicationDetailSkeleton />;
  }

  if (errorCode === "not_found") {
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-forgeGray-900">Solicitud no encontrada</h1>
        <p className="mt-2 text-forge-sm text-forgeGray-600">Verifica el enlace o vuelve a la bandeja.</p>
        <Link
          href="/bank/applications/queue"
          className="mt-6 inline-block text-forge-sm font-medium text-forgeBrand-700 underline-offset-4 hover:underline"
        >
          Ir a la bandeja
        </Link>
      </main>
    );
  }

  if (errorCode === "forbidden") {
    return (
      <main className="mx-auto max-w-2xl p-8 text-center" role="alert">
        <h1 className="text-xl font-semibold text-rose-900">Acceso denegado</h1>
        <p className="mt-2 text-forge-sm text-forgeGray-700">Tu rol no puede ver esta solicitud.</p>
        <button
          type="button"
          className="mt-6 rounded-lg border border-forgeGray-300 px-4 py-2 text-forge-sm"
          onClick={() => router.push("/bank/applications/queue")}
        >
          Volver a la bandeja
        </button>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-forge-sm text-forgeGray-700">No se pudo cargar esta solicitud.</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white"
          onClick={() => void load()}
        >
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="bank-application-detail mx-auto max-w-6xl space-y-6 p-4 md:p-8" aria-label="Detalle de solicitud bancaria">
      <nav aria-label="Migas">
        <Link
          href="/bank/applications/queue"
          className="text-forge-sm font-medium text-forgeBrand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          ← Bandeja
        </Link>
      </nav>

      <ApplicationHeader detail={detail} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BorrowerSection borrower={detail.borrower} />
        <VehicleSection vehicle={detail.vehicle} />
      </div>

      <ScoringSection scoring={detail.scoring} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DocumentChecklist
          documents={detail.documents}
          applicationId={detail.application_id}
          tenantId={tenantId ?? ""}
          previewEnabled={isDocumentPreviewUiEnabled()}
          onOpenPreview={(documentIdKey) => setPreviewDocId(documentIdKey)}
        />
        <StipulationsPanel
          applicationId={detail.application_id}
          stipulations={detail.stipulations}
          tenantId={tenantId}
        />
      </div>

      <ActionPanel
        detail={detail}
        claimLoading={claimLoading}
        decideDisabled={detail.bank_claim?.current_user_owns !== true}
        onClaim={handleClaim}
        onDecide={handleDecide}
      />

      <DecisionFormModal
        applicationId={detail.application_id}
        analystActorId={detail.bank_claim?.analyst_id ?? detail.bank_claim?.claimed_by}
        currency={detail.currency}
        grossMonthlyIncome={detail.borrower?.income_monthly}
        baselineAmount={detail.amount}
        initialStipulations={(detail.stipulations ?? []).map((s) => ({
          id: s.id,
          description: s.description ?? "",
          status: s.status,
        }))}
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        onSubmitted={() => load()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityLog events={detail.recent_events} eventsCount={detail.events_count} />
        <NotesPanel notes={detail.notes} />
      </div>

      {detail.last_process_result && Object.keys(detail.last_process_result).length > 0 ? (
        <section className="rounded-xl border border-forgeGray-200 bg-forgeGray-50/50 p-6">
          <h2 className="text-lg font-semibold text-forgeGray-900">Último resultado de proceso</h2>
          <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-white p-3 font-forgeMono text-[11px] text-forgeGray-800">
            {JSON.stringify(detail.last_process_result, null, 2)}
          </pre>
        </section>
      ) : null}

      <Dialog open={Boolean(previewDocId) && isDocumentPreviewUiEnabled()} onOpenChange={(open) => !open && setPreviewDocId(null)}>
        <DialogContent className="flex max-h-[min(840px,88vh)] w-[min(1200px,96vw)] max-w-none flex-col overflow-hidden rounded-lg bg-white shadow-xl">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold text-forgeGray-900">Vista previa documento</DialogTitle>
            <p className="text-[11px] text-forgeGray-500">{previewDocId}</p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            {previewDocId && tenantId.trim() ? (
              <DocumentPreviewPane
                key={previewDocId}
                documentId={previewDocId}
                applicationId={detail.application_id}
                tenantId={tenantId.trim()}
              />
            ) : (
              <p className="text-forge-xs text-forgeGray-600">Selecciona tenant válido antes de cargar páginas.</p>
            )}
          </div>

          <DialogFooter className="mt-4 flex-shrink-0 sm:justify-between">
            <DialogClose className="rounded-md border px-3 py-1 text-sm" type="button" aria-label="Cerrar diálogo">
              Cerrar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function BankApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BankApplicationDetailErrorBoundary>
      <BankApplicationDetailInner params={params} />
    </BankApplicationDetailErrorBoundary>
  );
}
