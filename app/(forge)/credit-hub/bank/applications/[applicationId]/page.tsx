"use client";

import { use } from "react";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { BankApplicationOpsPanel } from "@/app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel";
import { BankDetailLayout } from "@/components/credit-hub/bank/BankDetailLayout";
import { DetailSkeleton, EmptyStateRich } from "@/components/credit-hub/primitives";
import { useBankApplication, useBankAuditTrail, useBankCompliance, useBankCounterOffer } from "@/lib/credit-hub/hooks/useBankDecision";

export default function BankApplicationReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const appQuery = useBankApplication(applicationId);
  const complianceQuery = useBankCompliance(applicationId);
  const auditQuery = useBankAuditTrail(applicationId);
  const counterOfferQuery = useBankCounterOffer(applicationId);

  if (appQuery.isLoading) return <DetailSkeleton />;
  if (appQuery.error || !appQuery.data) {
    return (
      <EmptyStateRich
        variant="error"
        primary={
          <button type="button" className="ch-btn ch-btn-secondary" onClick={() => void appQuery.refetch()}>
            Reintentar
          </button>
        }
      />
    );
  }

  return (
    <CreditTenantGate>
      <BankDetailLayout
        application={appQuery.data}
        compliance={complianceQuery.data}
        audit={auditQuery.data}
        counterOffer={counterOfferQuery.data}
        isComplianceLoading={complianceQuery.isLoading}
      />
      <BankApplicationOpsPanel applicationId={applicationId} />
    </CreditTenantGate>
  );
}
