"use client";

import { BankAuditView } from "@/components/credit-hub/bank/BankAuditView";
import { useBankGlobalAuditTrail } from "@/lib/credit-hub/hooks/useBankAuditCompliance";

export default function BankAuditPage() {
  // PR-FE-6: real event-sourced audit trail aggregated from the per-application
  // /audit-trail endpoint across the tenant queue (no synthetic events).
  const audit = useBankGlobalAuditTrail();

  return (
    <BankAuditView
      events={audit.events}
      isLoading={audit.isLoading}
      isError={audit.isError}
      onRetry={audit.refetch}
    />
  );
}
