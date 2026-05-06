"use client";

import { useState } from "react";
import type { AvailableAction } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseActions } from "@/hooks/legal/useCaseActions";
import { useDisasterLevel } from "@/app/providers/DisasterModeProvider";

export function CaseActionsMenu({ tenantId, caseId }: { tenantId: string; caseId: string }) {
  const m = useLegalCasesMessages();
  const level = useDisasterLevel();
  const { data, isLoading, runAction, running } = useCaseActions(tenantId, caseId);
  const [err, setErr] = useState<string | null>(null);

  const actions: AvailableAction[] = (data?.available_actions ?? []).filter((a) => {
    if (level === "CRITICAL_FALLBACK" && a.consumes_llm_tokens) return false;
    if (level === "LLM_DEGRADED" && a.consumes_llm_tokens) return false;
    return true;
  });

  const exec = async (a: AvailableAction) => {
    setErr(null);
    if (a.requires_confirmation) {
      const ok = typeof window !== "undefined" ? window.confirm(m.actions.confirm_execute) : true;
      if (!ok) return;
    }
    try {
      await runAction({ actionName: a.action_name, payload: {} });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  if (isLoading) return <p className="text-sm text-forgeInk-500">{m.actions.executing}</p>;
  if (!actions.length) return <p className="text-sm text-forgeInk-500">{m.actions.no_actions}</p>;

  return (
    <div className="rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-forgeInk-900">{m.actions.menu_title}</h2>
      {level !== "NORMAL" && (
        <p className="mb-2 text-xs text-forgeInk-600">{m.actions.blocked_by_mode}</p>
      )}
      <ul className="space-y-2">
        {actions.map((a) => (
          <li key={a.action_name}>
            <button
              type="button"
              disabled={running}
              className="w-full rounded-forge-sm px-3 py-2 text-left text-sm text-forgeBrand-800 ring-1 ring-forgeBrand-200 hover:bg-forgeBrand-50 disabled:opacity-50"
              onClick={() => void exec(a)}
            >
              <span className="font-medium">{a.display_name}</span>
              <span className="mt-0.5 block text-xs text-forgeInk-600">{a.description}</span>
            </button>
          </li>
        ))}
      </ul>
      {err ? (
        <p className="mt-2 text-sm text-forgeDanger-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
