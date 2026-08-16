"use client";

import { useState } from "react";
import { toast } from "@/components/forge";
import { escalateKycReview } from "@/lib/credit-hub/api/escalateClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { canEscalateReview } from "@/lib/credit-hub/auth/escalate-access";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";
import { EscalateReviewModal } from "./EscalateReviewModal";

export function EscalateKycButton({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const { roleKey } = useCreditHubActor();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isBankPilotUiEnabled() || !canEscalateReview(roleKey)) return null;

  const handleSubmit = async (payload: { reason: string; notes: string }) => {
    if (!apiTenantId) return;
    setLoading(true);
    try {
      const result = await escalateKycReview({ tenantId: apiTenantId, applicationId, body: payload });
      toast.success(`Escalación KYC registrada (${result.escalation_id}) — ${result.status}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo escalar KYC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" data-testid="escalate-kyc-button" onClick={() => setOpen(true)}>
        Escalar KYC
      </button>
      <EscalateReviewModal
        open={open}
        title="Escalar revisión KYC · Conoce a tu Cliente"
        onClose={() => !loading && setOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={loading}
      />
    </>
  );
}
