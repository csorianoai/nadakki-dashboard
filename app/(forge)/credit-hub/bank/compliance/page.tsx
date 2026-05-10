"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Badge, Card, EmptyState, Skeleton } from "@/components/forge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { CheckCircle2 } from "lucide-react";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";
import { getForgeComplianceSurface } from "@/lib/credit-hub/compliance/regulatory-surface";

export default function BankCompliancePage() {
  const persona = usePersona();
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const complianceSurface = getForgeComplianceSurface(tenantConfig);
  const queue = useBankQueue();
  const applications = queue.data?.applications ?? [];

  const { withIssues, pct } = useMemo(() => {
    const wi = applications.filter((item) => !item.bank_decision?.compliance_check?.ley_172_13_compliant);
    const comp = applications.length - wi.length;
    const p = applications.length ? Math.round((comp / applications.length) * 100) : 0;
    return { withIssues: wi, pct: p };
  }, [applications]);

  return (
    <div className="space-y-6" data-persona={persona}>
      <div>
        <p className="text-forge-xs font-semibold uppercase tracking-[0.18em] text-forgeBrand-600">{t.bank.compliance_kicker}</p>
        <h1 className="mt-1 font-display text-forge-md font-bold text-forgeGray-800 sm:text-[length:var(--forge-text-2xl)]">{complianceSurface.heroTitle}</h1>
        <p className="mt-2 text-forge-sm text-forgeGray-600">{complianceSurface.heroDescription}</p>
      </div>
      {queue.isLoading ? (
        <Skeleton className="min-h-80 w-full rounded-forge-lg" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-forge-sm text-forgeGray-500">{t.bank.compliance_percent_label}</p>
              <p className="mt-2 font-display text-[length:var(--forge-text-2xl)] font-bold text-forgeGray-800">{pct}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-forge-sm text-forgeGray-500">{t.bank.issues_detected}</p>
              <p className="mt-2 font-display text-[length:var(--forge-text-2xl)] font-bold text-forgeWarning-700">{withIssues.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-forge-sm text-forgeGray-500">Última auditoría</p>
              <p className="mt-2 font-display text-forge-md font-semibold text-forgeGray-800">
                {new Date().toLocaleString(tenantConfig.locale, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </Card>
          </div>
          <Card className="p-4 sm:p-6">
            <h2 className="font-display text-forge-md font-semibold text-forgeGray-800">{complianceSurface.issuesSectionTitle}</h2>
            {withIssues.length === 0 ? (
              <EmptyState
                titleLevel={2}
                tone="success"
                icon={<CheckCircle2 className="text-forgeSuccess-600" />}
                title={empty.complianceAlertsClearTitle}
                description={empty.complianceAlertsClearBody}
                className="mt-4 border-solid"
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {withIssues.map((item) => (
                  <li key={item.application_id}>
                    <Link
                      href={`/credit-hub/bank/applications/${item.application_id}`}
                      className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-forge-md border border-forgeGray-100 bg-forgeSurface-sunken px-4 py-3 transition-colors hover:border-forgeBrand-300 hover:bg-forgeSurface-card"
                    >
                      <div>
                        <p className="font-forgeMono text-forge-xs text-forgeGray-600">{item.application_id}</p>
                        <p className="text-forge-sm font-medium text-forgeGray-800">{item.applicant_name || "Cliente"}</p>
                      </div>
                      <Badge variant="warning">{t.bank.review_compliance_badge}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4 sm:p-6">
            <h2 className="font-display text-forge-md font-semibold text-forgeGray-800">{t.bank.rtbf_title}</h2>
            <p className="mt-2 text-forge-sm text-forgeGray-600">{complianceSurface.rtbfDescription}</p>
          </Card>
        </>
      )}
    </div>
  );
}
