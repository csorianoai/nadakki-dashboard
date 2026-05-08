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
        "group flex w-full min-h-[120px] flex-col rounded-forge-lg border border-forgeInk-200 bg-forgeSurface-card p-4 text-left transition-shadow md:min-h-[140px]",
        "hover:shadow-forge-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
        enabled ? `border-l-4 ${accentClass} hover:border-forgeInk-300` : "cursor-not-allowed opacity-50",
      ].join(" ")}
      aria-label={`Iniciar tarea: ${resolveTaskDisplayName(task)}`}
      aria-disabled={!enabled}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-forge-md font-semibold leading-snug text-forge-text">{resolveTaskDisplayName(task)}</h3>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-forge-text-subtle transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <p className="mb-3 line-clamp-2 text-forge-sm leading-snug text-forge-text-muted">{resolveTaskDescription(task)}</p>
      <div className="mb-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0 text-forge-text-subtle" aria-hidden />
        <span className="text-xs text-forge-text-subtle">{task.estimated_time_es}</span>
      </div>
      <div className="mb-3">
        <PracticeAreaChipGroup tags={task.default_practice_area_tags} maxVisible={3} size="sm" />
      </div>
      {task.requires_attorney_review ? <AttorneyReviewBadge variant="compact" /> : <AttorneyReviewRecommendedBadge />}
    </button>
  );
}
