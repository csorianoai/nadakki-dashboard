"use client";

import { use } from "react";
import { BankDetailView } from "@/components/credit-hub/bank/BankDetailView";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useBankApplication, useBankAuditTrail, useBankCompliance } from "@/lib/credit-hub/hooks/useBankDecision";

export default function BankApplicationReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const appQuery = useBankApplication(applicationId);
  const complianceQuery = useBankCompliance(applicationId);
  const auditQuery = useBankAuditTrail(applicationId);

  if (appQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-forge-surface" />;
  }
  if (appQuery.error || !appQuery.data) {
    return (
      <ForgeCard className="py-12 text-center">
        <p className="text-forge-danger">No se pudo cargar la solicitud para revisión.</p>
        <ForgeButton className="mt-4" variant="secondary" onClick={() => void appQuery.refetch()}>Reintentar</ForgeButton>
      </ForgeCard>
    );
  }
  return <BankDetailView application={appQuery.data} compliance={complianceQuery.data} audit={auditQuery.data} />;
}
