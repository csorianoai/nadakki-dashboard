"use client";

import type { CaseActor } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { actorKindLabel, actorRoleLabel } from "@/lib/legal/presentation-labels";

export function CaseActorsPanel({ actors }: { actors: CaseActor[] }) {
  const m = useLegalCasesMessages();
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-forgeGray-900">{m.actors.title}</h2>
      <ul className="space-y-2">
        {(actors ?? []).map((a) => (
          <li key={a.actor_id ?? `${a.role}-${a.full_name}`} className="rounded-forge-sm border border-forgeGray-100 px-3 py-2 text-sm">
            <p className="font-medium text-forgeGray-900">{a.full_name}</p>
            <p className="text-xs text-forgeGray-600">
              {actorRoleLabel(m, a.role)} · {actorKindLabel(m, a.actor_kind)}
              {a.is_primary ? " · principal" : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
