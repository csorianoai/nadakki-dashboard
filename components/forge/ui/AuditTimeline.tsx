"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AuditTimelineEntry {
  id: string;
  timestampLabel: string;
  actorLabel: string;
  actionLabel: string;
  detail?: string;
  /** When set, the action line links here (e.g. application detail). */
  href?: string;
}

export interface AuditTimelineProps {
  entries: AuditTimelineEntry[];
  className?: string;
}

export function AuditTimeline({ entries, className }: AuditTimelineProps) {
  return (
    <ol className={cn("relative border-l border-forgeGray-200 pl-6", className)}>
      {entries.map((e, i) => (
        <li key={e.id} className={cn("relative pb-8 last:pb-0", i === 0 && "-mt-0.5")}>
          <span
            className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-forge-pill border-2 border-forgeSurface-card bg-forgeBrand-500"
            aria-hidden
          />
          <p className="text-forge-xs text-forgeGray-500">{e.timestampLabel}</p>
          <p className="mt-1 text-forge-sm font-medium text-forgeGray-800">
            <span className="text-forgeGray-600">{e.actorLabel}</span>
            {" — "}
            {e.href ? (
              <Link
                href={e.href}
                className="text-forgeBrand-600 underline decoration-forgeBrand-500/40 underline-offset-2 hover:text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
              >
                {e.actionLabel}
              </Link>
            ) : (
              e.actionLabel
            )}
          </p>
          {e.detail ? <p className="mt-1 text-forge-sm text-forgeGray-600">{e.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}
