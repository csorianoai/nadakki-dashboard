"use client";

import { useState } from "react";
import type { CaseTimelineEvent } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseDecisionTraceViewer } from "@/components/legal/cases/CaseDecisionTraceViewer";

export function CaseTimeline({ events }: { events: CaseTimelineEvent[] }) {
  const m = useLegalCasesMessages();
  const [open, setOpen] = useState<string | null>(null);
  if (!events.length) {
    return <p className="text-sm text-forgeInk-500">{m.timeline.empty}</p>;
  }
  return (
    <ol className="relative border-l border-forgeInk-200 pl-6">
      {events.map((e) => (
        <li key={e.event_id} className="mb-6 ml-1">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-forgeBrand-500 bg-forgeSurface-card" />
          <time className="text-xs text-forgeInk-500" dateTime={e.occurred_at}>
            {new Date(e.occurred_at).toLocaleString("es-DO")}
          </time>
          <p className="text-sm font-medium text-forgeInk-900">{e.event_type}</p>
          <p className="text-xs text-forgeInk-600">{e.event_category}</p>
          {e.decision_trace ? (
            <div className="mt-2">
              <button
                type="button"
                className="text-xs font-medium text-forgeBrand-700 hover:underline"
                aria-expanded={open === e.event_id}
                onClick={() => setOpen((id) => (id === e.event_id ? null : e.event_id))}
              >
                {m.timeline.expand_trace}
              </button>
              {open === e.event_id ? <CaseDecisionTraceViewer trace={e.decision_trace} /> : null}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
