"use client";

import Link from "next/link";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function BankComplianceReport({ applications }: { applications: BankQueueItem[] }) {
  const t = useTranslations();
  const withIssues = applications.filter((item) => !item.bank_decision?.compliance_check?.ley_172_13_compliant);
  const compliant = applications.length - withIssues.length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ForgeCard>
          <p className="text-sm text-forge-text-muted">{t.bank.compliance_percent_label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-forge-text">
            {applications.length ? Math.round((compliant / applications.length) * 100) : 0}%
          </p>
        </ForgeCard>
        <ForgeCard>
          <p className="text-sm text-forge-text-muted">{t.bank.issues_detected}</p>
          <p className="mt-2 font-display text-3xl font-bold text-forge-warning">{withIssues.length}</p>
        </ForgeCard>
        <ForgeCard>
          <p className="text-sm text-forge-text-muted">Última auditoría</p>
          <p className="mt-2 font-semibold text-forge-text">{new Date().toLocaleString("es-DO")}</p>
        </ForgeCard>
      </div>
      <ForgeCard>
        <h2 className="mb-4 font-semibold text-forge-text">{t.bank.issues_section_title}</h2>
        {withIssues.length === 0 ? (
          <p className="text-sm text-forge-text-muted">{t.bank.no_issues_queue}</p>
        ) : (
          <div className="space-y-3">
            {withIssues.map((item) => (
              <Link
                key={item.application_id}
                href={`/credit-hub/bank/applications/${item.application_id}`}
                className="flex items-center justify-between rounded-xl bg-forge-surface-elevated p-3"
              >
                <div>
                  <p className="font-medium text-forge-text">{item.application_id}</p>
                  <p className="text-sm text-forge-text-muted">{item.applicant_name || "Cliente"}</p>
                </div>
                <ForgeBadge tone="warning">{t.bank.review_compliance_badge}</ForgeBadge>
              </Link>
            ))}
          </div>
        )}
      </ForgeCard>
      <ForgeCard>
        <h2 className="font-semibold text-forge-text">{t.bank.rtbf_title}</h2>
        <p className="mt-2 text-sm text-forge-text-muted">{t.bank.rtbf_description}</p>
      </ForgeCard>
    </div>
  );
}
