"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
  const href = `/legal/cases/${c.case_id}`;

  return (
    <motion.article whileHover={{ scale: 1.005 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      <Link
        href={href}
        aria-label={c.title}
        className="block rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950/80 p-6 shadow-sm ring-1 ring-transparent transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-950/10 hover:ring-violet-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-medium tracking-tight text-zinc-100">{c.title}</h2>
            <p className="text-xs tabular-nums text-zinc-500">
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
          <p className="mt-3 text-sm text-zinc-400">
            {days < 0
              ? `${m.deadlines.expired}: ${nextDeadline.effective_deadline_date}`
              : m.deadlines.days_remaining.replace("{days}", String(days))}
          </p>
        ) : null}
      </Link>
    </motion.article>
  );
}
