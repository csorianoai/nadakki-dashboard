"use client";

import { MapPin, Gavel, Briefcase, Clock } from "lucide-react";
import { HearingStatusBadge } from "@/components/legal/hearings/HearingStatusBadge";
import { HearingStatusControl } from "@/components/legal/hearings/HearingStatusControl";
import { formatHearingDate, humanizeToken } from "@/lib/legal/hearings/hearings-format";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

/**
 * Lightweight detail card shared by the list and calendar views.
 * Renders the REAL HearingOut fields only (no invented fields).
 */
type Props = {
  tenantId: string;
  hearing: HearingOut;
  statuses: string[];
  /** When true, the status control is rendered (cosmetic gating). */
  canManage: boolean;
  /** Hide the date line in calendar mode where the day is already the header. */
  hideDate?: boolean;
};

export function HearingCard({ tenantId, hearing, statuses, canManage, hideDate }: Props) {
  return (
    <article
      className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4"
      data-hearing-id={hearing.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-zinc-100">{hearing.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{humanizeToken(hearing.hearing_type)}</p>
        </div>
        <HearingStatusBadge status={hearing.status} />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-zinc-400 sm:grid-cols-2">
        {!hideDate ? (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span>{formatHearingDate(hearing.hearing_date, hearing.timezone)}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
          <span>{hearing.duration_minutes} min</span>
        </div>
        {hearing.location || hearing.courtroom ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span>{[hearing.location, hearing.courtroom].filter(Boolean).join(" · ")}</span>
          </div>
        ) : null}
        {hearing.judge_name ? (
          <div className="flex items-center gap-1.5">
            <Gavel className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span>{hearing.judge_name}</span>
          </div>
        ) : null}
        {hearing.case_id ? (
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span>Expediente: {hearing.case_id}</span>
          </div>
        ) : null}
      </dl>

      {hearing.notes ? <p className="mt-2 text-xs text-zinc-500">{hearing.notes}</p> : null}

      {canManage ? (
        <div className="mt-3 border-t border-zinc-800/60 pt-3">
          <HearingStatusControl tenantId={tenantId} hearing={hearing} statuses={statuses} />
        </div>
      ) : null}
    </article>
  );
}
