"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpCircle,
  ChevronRight,
  Clock,
  FileStack,
  Gavel,
  Scale,
  Shield,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CaseType, LegalCase } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { formatRelativeActivityEs } from "@/lib/legal/cases/relative-time-es";
import { stateRowHoverBorderClass } from "@/lib/legal/cases/state-colors";
import { cn } from "@/lib/utils";
import { DeadlineCountdown } from "@/components/legal/cases/DeadlineCountdown";
import { PriorityIndicator } from "@/components/legal/cases/PriorityIndicator";
import { StateBadge } from "@/components/legal/cases/StateBadge";

const shellIcon =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800/85 to-zinc-950 ring-1 ring-zinc-700/80 shadow-inner";

function CaseTypeGlyph({ kind }: { kind: CaseType }) {
  const cls = cn(shellIcon);
  switch (kind) {
    case "defensa_civil_cobro_pesos":
      return (
        <div className={cls} aria-hidden>
          <Scale className="h-5 w-5 text-cyan-300" strokeWidth={1.75} />
        </div>
      );
    case "recurso_apelacion_civil":
      return (
        <div className={cls} aria-hidden>
          <ArrowUpCircle className="h-5 w-5 text-indigo-300" strokeWidth={1.75} />
        </div>
      );
    case "caso_penal_imputado":
      return (
        <div className={cls} aria-hidden>
          <Gavel className="h-5 w-5 text-rose-300" strokeWidth={1.75} />
        </div>
      );
    case "caso_penal_victima_querellante":
      return (
        <div className={cls} aria-hidden>
          <Shield className="h-5 w-5 text-amber-200" strokeWidth={1.75} />
        </div>
      );
    case "caso_penal_evaluacion_general":
    default:
      return (
        <div className={cls} aria-hidden>
          <Gavel className="h-5 w-5 text-violet-300" strokeWidth={1.75} />
        </div>
      );
  }
}

export function CaseCommandRow({ legalCase }: { legalCase: LegalCase }) {
  const m = useLegalCasesMessages();
  const prefersReducedMotion = useReducedMotion();
  const lm = m.list.revolution;
  const archived = legalCase.state === "ARCHIVED";

  const nextDeadline = (legalCase.deadlines ?? [])
    .filter((d) => d.status === "active")
    .sort((a, b) => a.effective_deadline_date.localeCompare(b.effective_deadline_date))[0];

  const primaryActor = legalCase.actors?.find((a) => a.is_primary) ?? legalCase.actors?.[0];

  const docCount = legalCase.documents?.length ?? 0;
  const strategyOpen =
    legalCase.strategies?.filter((s) => s.status === "proposed" || s.status === "executing").length ?? 0;

  const motionOpts = prefersReducedMotion
    ? {}
    : { whileHover: { scale: 1.005 }, transition: { duration: 0.2, ease: [0.33, 1, 0.68, 1] as const } };

  const stateCopy = (m.states as Record<string, string>)[legalCase.state] ?? legalCase.state;

  const titleId = `case-heading-${legalCase.case_id}`;
  const descId = `case-meta-${legalCase.case_id}`;

  return (
    <div>
      <Link
        href={`/legal/cases/${legalCase.case_id}`}
        prefetch={false}
        className={cn(
          "group relative block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:ring-cyan-500",
          archived && "opacity-60"
        )}
        aria-label={`${lm.row.open_detail}: ${legalCase.title}`}
      >
        <motion.div {...motionOpts} className="relative isolate">
          <article
            className={cn(
              "relative min-h-[88px] border-b border-zinc-800/90 px-4 py-3 backdrop-blur-md backdrop-saturate-150",
              "bg-zinc-900/55 transition-colors duration-200 hover:bg-zinc-900/80",
              "border-l-4 border-l-transparent transition-[border-color,background-color] duration-200",
              stateRowHoverBorderClass[legalCase.state]
            )}
          >
            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-zinc-500 opacity-0 transition duration-200 group-hover:opacity-100 md:flex">
              <ChevronRight className="h-4 w-4" />
            </span>

            <div className="-mx-1 overflow-x-auto px-1 xl:overflow-visible">
              <div className="flex min-w-0 flex-col gap-5 pb-2 xl:min-w-[72rem] xl:flex-row xl:items-center xl:gap-6 xl:pb-0">
                <div className="flex min-w-0 flex-1 items-start gap-3 xl:max-w-md">
                  <CaseTypeGlyph kind={legalCase.case_type} />
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <PriorityIndicator priority={legalCase.priority} ariaLabel={m.priority[legalCase.priority]} />
                    <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-zinc-100">
                      {legalCase.title}
                    </h2>
                    {legalCase.has_expired_critical_deadline_at_ingestion ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red-950/45 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-200 ring-1 ring-red-900/70">
                        <AlertCircle className="h-3 w-3" aria-hidden />
                        {lm.row.risk_marker}
                      </span>
                    ) : null}
                  </div>
                  <p id={descId} className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500 tabular-nums">
                    <span className="xl:hidden">
                      #{legalCase.case_number_internal} · {legalCase.legal_jurisdiction}
                    </span>
                    <span className="hidden xl:inline">
                      #{legalCase.case_number_internal} · {(m.case_types as Record<string, string>)[legalCase.case_type] ?? legalCase.case_type} · {legalCase.legal_jurisdiction}
                    </span>
                  </p>
                  <div className="mt-4 xl:hidden">
                    <StateBadge state={legalCase.state} label={stateCopy} />
                  </div>
                </div>
                </div>

                <div className="min-w-0 xl:w-[12.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{lm.row.primary_party}</p>
                  <p className="mt-1 truncate text-sm text-zinc-200">{primaryActor?.full_name ?? lm.row.no_client}</p>
                </div>

                <div className="hidden w-[7rem] xl:block xl:justify-self-start">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{lm.row.phase}</p>
                  <div className="mt-2">
                    <StateBadge state={legalCase.state} label={stateCopy} />
                  </div>
                </div>

                <div className="w-[8.75rem] shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{lm.row.next_deadline}</p>
                  <div className="mt-2">
                    {nextDeadline && nextDeadline.status === "active" ? (
                      <DeadlineCountdown
                        effectiveDeadlineDate={nextDeadline.effective_deadline_date}
                        status={nextDeadline.status}
                        mutedLabel={lm.row.no_deadline}
                        extraUrgent={legalCase.priority === "critical"}
                      />
                    ) : (
                      <p className="text-xs text-zinc-500">{lm.row.no_deadline}</p>
                    )}
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-3 rounded-xl bg-zinc-950/35 px-2 py-2 ring-1 ring-zinc-800/80 xl:w-[12.5rem]">
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      <Target className="h-3.5 w-3.5" aria-hidden />
                      {lm.row.strategies}
                    </p>
                    <p className="mt-1 text-base font-semibold tabular-nums text-zinc-100">{strategyOpen}</p>
                  </div>
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      <FileStack className="h-3.5 w-3.5" aria-hidden />
                      {lm.row.documents_bundle}
                    </p>
                    <p className="mt-1 text-base font-semibold tabular-nums text-zinc-100">{docCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{lm.row.generated_hint}</p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">{lm.row.generated_list_note}</p>
                  </div>
                </div>

                <div className="ml-auto shrink-0 text-right xl:ml-0 xl:w-[6.75rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{lm.row.amount}</p>
                  <p className="mt-1 text-lg font-medium tabular-nums text-zinc-50">{legalCase.monto_demandado ?? "—"}</p>
                  <p className="mt-3 inline-flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {lm.row.activity}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-zinc-400">{formatRelativeActivityEs(legalCase.updated_at)}</p>
                </div>
              </div>
            </div>
          </article>
        </motion.div>
      </Link>
    </div>
  );
}
