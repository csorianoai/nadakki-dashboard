"use client";

import { useMemo } from "react";
import { BankAuditView } from "@/components/credit-hub/bank/BankAuditView";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import type { BankAuditEventView } from "@/lib/credit-hub/types/bank-views";

export default function BankAuditPage() {
  const queueQuery = useBankQueue({ limit: 100 });

  const events = useMemo((): BankAuditEventView[] => {
    const apps = queueQuery.data?.applications ?? [];
    const out: BankAuditEventView[] = [];
    for (const app of apps) {
      if (app.created_at) {
        out.push({
          id: `${app.application_id}-submitted`,
          timestamp: app.created_at,
          actor: "system",
          action: "submitted",
          applicationId: app.application_id,
          details: { dealer: app.dealer_name ?? undefined, score: app.score },
        });
      }
      const decided = app.bank_decision;
      if (decided?.decided_at) {
        out.push({
          id: `${app.application_id}-decided`,
          timestamp: decided.decided_at,
          actor: decided.decided_by ?? "analista",
          action: "decided",
          applicationId: app.application_id,
          details: { decision: decided.decision },
        });
      }
    }
    return out;
  }, [queueQuery.data?.applications]);

  return (
    <BankAuditView
      events={events}
      isLoading={queueQuery.isLoading}
      isError={!!queueQuery.error}
      onRetry={() => void queueQuery.refetch()}
    />
  );
}
