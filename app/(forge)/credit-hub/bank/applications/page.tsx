"use client";

import { BankQueueList } from "@/components/credit-hub/bank/BankQueueList";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

export default function BankApplicationsQueuePage() {
  const queueQuery = useBankQueue();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Bandeja bancaria</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Solicitudes priorizadas</h1>
        <p className="mt-1 text-forge-text-muted">Ordenadas por score Forge AI y aisladas por tenant.</p>
      </div>
      <BankQueueList applications={queueQuery.data?.applications ?? []} loading={queueQuery.isLoading} error={queueQuery.error} />
    </div>
  );
}
