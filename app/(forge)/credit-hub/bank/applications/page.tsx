"use client";

import { BankQueueList } from "@/components/credit-hub/bank/BankQueueList";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export default function BankApplicationsQueuePage() {
  const t = useTranslations();
  const queueQuery = useBankQueue();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Bandeja bancaria</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Solicitudes priorizadas</h1>
        <p className="mt-1 text-forge-text-muted">{t.bank.applications_subtitle}</p>
      </div>
      <BankQueueList applications={queueQuery.data?.applications ?? []} loading={queueQuery.isLoading} error={queueQuery.error} />
    </div>
  );
}
