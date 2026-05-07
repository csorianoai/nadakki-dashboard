"use client";

import Link from "next/link";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseStateIndicator } from "@/components/legal/cases/CaseStateIndicator";
import { CasePriorityBadge } from "@/components/legal/cases/CasePriorityBadge";
import { CaseConfidenceMeter } from "@/components/legal/cases/CaseConfidenceMeter";
import { CaseRiskBadge } from "@/components/legal/cases/CaseRiskBadge";
import { CaseLockBanner } from "@/components/legal/cases/CaseLockBanner";
import { CaseConflictCheckBanner } from "@/components/legal/cases/CaseConflictCheckBanner";

export function CaseDetailHeader({
  legalCase,
  onReleaseLock,
}: {
  legalCase: LegalCase;
  onReleaseLock?: () => void;
}) {
  const m = useLegalCasesMessages();
  const typeLabel = m.case_types[legalCase.case_type] ?? legalCase.case_type;
  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-forgeInk-900">{legalCase.title}</h1>
          <p className="text-sm text-forgeInk-600">
            {legalCase.case_number_internal} · {typeLabel}
          </p>
          <p className="mt-2 text-xs text-forgeInk-500">{m.compliance.ley_91}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CaseStateIndicator state={legalCase.state} />
          <CasePriorityBadge priority={legalCase.priority} />
          <CaseRiskBadge profile={legalCase.risk_profile} />
        </div>
      </div>
      <CaseConflictCheckBanner actors={legalCase.actors} />
      <CaseLockBanner lock={legalCase.active_lock} onRelease={onReleaseLock} />
      {legalCase.confidence ? <CaseConfidenceMeter confidence={legalCase.confidence} /> : null}
      <nav aria-label="Secciones del expediente" className="flex flex-wrap gap-2 text-sm">
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200 hover:bg-forgeBrand-50" href={`/legal/cases/${legalCase.case_id}`}>
          {m.nav.overview}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/timeline`}>
          {m.nav.timeline}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/documents`}>
          {m.nav.documents}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200 hover:bg-forgeBrand-50" href={`/legal/cases/${legalCase.case_id}/documents#documentos-generados-ia`}>
          {m.nav.generated_ia}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/strategy`}>
          {m.nav.strategy}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/deadlines`}>
          {m.nav.deadlines}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/issues`}>
          {m.nav.issues}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/risk`}>
          {m.nav.risk}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/snapshots`}>
          {m.nav.snapshots}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeInk-200" href={`/legal/cases/${legalCase.case_id}/related`}>
          {m.nav.related}
        </Link>
        <Link className="rounded-forge-sm px-3 py-1.5 ring-1 ring-forgeDanger-200 text-forgeDanger-800" href={`/legal/cases/${legalCase.case_id}/archive`}>
          {m.nav.archive}
        </Link>
      </nav>
    </header>
  );
}
