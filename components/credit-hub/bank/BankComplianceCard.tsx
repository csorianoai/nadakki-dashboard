"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { ComplianceReport } from "@/lib/credit-hub/types/bankDecision";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function BankComplianceCard({ report }: { report?: ComplianceReport }) {
  const t = useTranslations();
  const ok = !!report?.ley_172_13_compliant;
  return (
    <ForgeCard className={ok ? "border-forge-success/30 bg-forge-success/5" : "border-forge-warning/30 bg-forge-warning/5"}>
      <div className="flex items-start gap-3">
        {ok ? <ShieldCheck className="h-5 w-5 text-forge-success" /> : <ShieldAlert className="h-5 w-5 text-forge-warning" />}
        <div>
          <h3 className="font-semibold text-forge-text">{t.bank_ui.compliance_card_title}</h3>
          <div className="mt-2">
            <ForgeBadge tone={ok ? "success" : "warning"}>{ok ? t.bank_ui.compliance_ok : t.bank_ui.compliance_attention}</ForgeBadge>
          </div>
          {report?.issues?.length ? (
            <ul className="mt-3 space-y-1 text-sm text-forge-text-muted">
              {report.issues.map((issue) => (
                <li key={issue.type}>
                  {issue.type}: {issue.action_required}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-forge-text-muted">Consentimientos y documentos mínimos completos.</p>
          )}
        </div>
      </div>
    </ForgeCard>
  );
}
