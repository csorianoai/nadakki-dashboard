"use client";

import { BankComplianceReport } from "@/components/credit-hub/bank/BankComplianceReport";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

export default function BankCompliancePage() {
  const queue = useBankQueue();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Compliance</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Ley 172-13 RD</h1>
        <p className="mt-1 text-forge-text-muted">Consentimientos, documentación mínima y trazabilidad de decisiones.</p>
      </div>
      {queue.isLoading ? <div className="h-80 animate-pulse rounded-2xl bg-forge-surface" /> : <BankComplianceReport applications={queue.data?.applications ?? []} />}
    </div>
  );
}
