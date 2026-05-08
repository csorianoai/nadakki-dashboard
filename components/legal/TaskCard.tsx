"use client";

import { AttorneyReviewBadge, AttorneyReviewRecommendedBadge } from "@/components/legal/AttorneyReviewBadge";
import { PracticeAreaChipGroup } from "@/components/legal/PracticeAreaChipGroup";
import { useExecuteLegalTask } from "@/hooks/useExecuteLegalTask";
import { resolveTaskDescription, resolveTaskDisplayName } from "@/lib/legal/task-types";
import type { LegalTask } from "@/lib/legal/task-types";
import { ChevronRight, Clock } from "lucide-react";

type Props = {
  task: LegalTask;
  accentClass: string;
  enabled: boolean;
  lockedMessage: string;
};

export function TaskCard({ task, accentClass, enabled, lockedMessage }: Props) {
  const { open } = useExecuteLegalTask();

  return (
    <button
      type="button"
      title={enabled ? undefined : lockedMessage}
      disabled={!enabled}
      onClick={() => enabled && open(task)}
      className={[
        "group flex w-full min-h-[120px] flex-col rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950/80 p-4 text-left shadow-sm transition-all md:min-h-[140px]",
        "hover:scale-[1.005] hover:border-violet-500/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
        enabled ? `border-l-4 ${accentClass} hover:brightness-110` : "cursor-not-allowed opacity-50",
      ].join(" ")}
      aria-label={`Iniciar tarea: ${resolveTaskDisplayName(task)}`}
      aria-disabled={!enabled}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-zinc-100">{resolveTaskDisplayName(task)}</h3>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <p className="mb-3 line-clamp-2 text-sm leading-snug text-zinc-400">{resolveTaskDescription(task)}</p>
      <div className="mb-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
        <span className="text-xs text-zinc-500">{task.estimated_time_es}</span>
      </div>
      <div className="mb-3">
        <PracticeAreaChipGroup tags={task.default_practice_area_tags} maxVisible={3} size="sm" />
      </div>
      {task.requires_attorney_review ? <AttorneyReviewBadge variant="compact" /> : <AttorneyReviewRecommendedBadge />}
    </button>
  );
}
