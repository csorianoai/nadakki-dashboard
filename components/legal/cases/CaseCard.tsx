"use client";

import Link from "next/link";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseStateIndicator } from "@/components/legal/cases/CaseStateIndicator";
import { CasePriorityBadge } from "@/components/legal/cases/CasePriorityBadge";
import { CaseSubStateIndicator } from "@/components/legal/cases/CaseSubStateIndicator";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";

export function CaseCard({ legalCase: c }: { legalCase: LegalCase }) {
  const m = useLegalCasesMessages();
  const nextDeadline = (c.deadlines ?? [])
    .filter((d) => d.status === "active")
    .sort((a, b) => a.effective_deadline_date.localeCompare(b.effective_deadline_date))[0];
  const days = nextDeadline ? daysUntil(nextDeadline.effective_deadline_date) : null;
  const typeLabel = m.case_types[c.case_type] ?? c.case_type;

  return (
    <article className="rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4 shadow-forge-xs transition-shadow hover:shadow-forge-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-forgeInk-900">
            <Link href={`/legal/cases/${c.case_id}`} className="hover:text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500">
              {c.title}
            </Link>
          </h2>
          <p className="text-xs text-forgeInk-500">
            {c.case_number_internal} · {typeLabel}
          </p>
          <CaseSubStateIndicator subState={c.sub_state} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CaseStateIndicator state={c.state} />
          <CasePriorityBadge priority={c.priority} />
        </div>
      </div>
      {nextDeadline && days !== null ? (
        <p className="mt-3 text-sm text-forgeInk-700">
          {days < 0
            ? `${m.deadlines.expired}: ${nextDeadline.effective_deadline_date}`
            : m.deadlines.days_remaining.replace("{days}", String(days))}
        </p>
      ) : null}
    </article>
  );
}
