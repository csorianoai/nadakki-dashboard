"use client";

import { useState } from "react";
import { toast } from "@/components/forge";
import { escalateOcrReview } from "@/lib/credit-hub/api/escalateClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { canEscalateReview } from "@/lib/credit-hub/auth/escalate-access";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";
import { EscalateReviewModal } from "./EscalateReviewModal";

export function EscalateOcrButton({
  applicationId,
  docId,
  docLabel,
}: {
  applicationId: string;
  docId: string;
  docLabel?: string;
}) {
  const { apiTenantId } = useTenant();
  const { roleKey } = useCreditHubActor();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isBankPilotUiEnabled() || !canEscalateReview(roleKey) || !docId) return null;

  const handleSubmit = async (payload: { reason: string; notes: string }) => {
    if (!apiTenantId) return;
    setLoading(true);
    try {
      const result = await escalateOcrReview({
        tenantId: apiTenantId,
        applicationId,
        docId,
        body: payload,
      });
      toast.success(`Escalación OCR registrada (${result.escalation_id}) — ${result.status}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo escalar OCR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ch-btn ch-btn-ghost ch-btn-sm"
        data-testid={`escalate-ocr-${docId}`}
        onClick={() => setOpen(true)}
      >
        Escalar OCR
      </button>
      <EscalateReviewModal
        open={open}
        title={docLabel ? `Escalar OCR · Lectura automática de documentos — ${docLabel}` : "Escalar revisión OCR · Lectura automática de documentos"}
        onClose={() => !loading && setOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={loading}
      />
    </>
  );
}
