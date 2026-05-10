"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseIssues } from "@/hooks/legal/useCaseIssues";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseIssuesPanel } from "@/components/legal/cases/CaseIssuesPanel";
import { CaseIssueReportModal } from "@/components/legal/cases/CaseIssueReportModal";
import type { CaseIssue } from "@/lib/legal/cases/case-types";

export default function LegalCaseIssuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error } = useLegalCase(effectiveTenantId, id);
  const { data: iss, refetch } = useCaseIssues(effectiveTenantId, id);
  const [open, setOpen] = useState(false);

  const issues: CaseIssue[] = iss?.issues ?? [];

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeGray-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      <CaseIssuesPanel issues={issues} onReport={() => setOpen(true)} />
      {open && effectiveTenantId ? (
        <CaseIssueReportModal
          tenantId={effectiveTenantId}
          caseId={id}
          onClose={() => {
            setOpen(false);
            void refetch();
          }}
        />
      ) : null}
    </main>
  );
}
