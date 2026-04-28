"use client";

import Link from "next/link";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

export default function BankAuditPage() {
  const queue = useBankQueue();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Audit trail</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Visor de auditoría</h1>
      </div>
      <ForgeCard>
        <div className="space-y-3">
          {(queue.data?.applications ?? []).map((application) => (
            <Link key={application.application_id} href={`/credit-hub/bank/applications/${application.application_id}`} className="block rounded-xl bg-forge-surface-elevated p-4 transition-colors hover:bg-forge-surface-hover">
              <p className="font-medium text-forge-text">{application.applicant_name || application.application_id}</p>
              <p className="text-sm text-forge-text-muted">Score {application.score} · {application.bank_decision ? `Decisión ${application.bank_decision.decision}` : "Sin decisión bancaria"}</p>
            </Link>
          ))}
          {!queue.isLoading && (queue.data?.applications ?? []).length === 0 && <p className="text-sm text-forge-text-muted">No hay solicitudes para auditar.</p>}
        </div>
      </ForgeCard>
    </div>
  );
}
