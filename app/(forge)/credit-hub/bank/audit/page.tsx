"use client";

import Link from "next/link";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export default function BankAuditPage() {
  const t = useTranslations();
  const queue = useBankQueue();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">{t.bank.audit_kicker}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Visor de auditoría</h1>
      </div>
      <ForgeCard>
        <div className="space-y-3">
          {(queue.data?.applications ?? []).map((application) => (
            <Link
              key={application.application_id}
              href={`/credit-hub/bank/applications/${application.application_id}`}
              className="block rounded-xl bg-forge-surface-elevated p-4 transition-colors hover:bg-forge-surface-hover"
            >
              <p className="font-medium text-forge-text">{application.applicant_name || application.application_id}</p>
              <p className="text-sm text-forge-text-muted">
                {t.bank.audit_score_line(
                  application.score,
                  application.bank_decision ? `Decisión ${application.bank_decision.decision}` : t.bank.no_bank_decision
                )}
              </p>
            </Link>
          ))}
          {!queue.isLoading && (queue.data?.applications ?? []).length === 0 && (
            <p className="text-sm text-forge-text-muted">{t.bank.no_audit_apps}</p>
          )}
        </div>
      </ForgeCard>
    </div>
  );
}
