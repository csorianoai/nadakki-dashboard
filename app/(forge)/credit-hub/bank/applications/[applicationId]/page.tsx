"use client";

import { use } from "react";
import { BankApplicationDetailView } from "@/components/forge/credit-hub/BankApplicationDetailView";
import { Button, Card, Skeleton } from "@/components/forge";
import { useBankApplication, useBankAuditTrail, useBankCompliance } from "@/lib/credit-hub/hooks/useBankDecision";

export default function BankApplicationReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const appQuery = useBankApplication(applicationId);
  const complianceQuery = useBankCompliance(applicationId);
  const auditQuery = useBankAuditTrail(applicationId);

  if (appQuery.isLoading) {
    return <Skeleton className="min-h-[24rem] w-full rounded-forge-lg" />;
  }
  if (appQuery.error || !appQuery.data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-forge-sm font-medium text-forgeDanger-700">No se pudo cargar la solicitud para revisión.</p>
        <Button type="button" variant="secondary" className="mt-4 min-h-12" onClick={() => void appQuery.refetch()}>
          Reintentar
        </Button>
      </Card>
    );
  }
  return <BankApplicationDetailView application={appQuery.data} compliance={complianceQuery.data} audit={auditQuery.data} />;
}
