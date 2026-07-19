"use client";

import { useState } from "react";
import type { AvailableAction, CaseState } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseActions } from "@/hooks/legal/useCaseActions";
import { useDisasterLevel } from "@/app/providers/DisasterModeProvider";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

export function CaseActionsMenu({ tenantId, caseId }: { tenantId: string; caseId: string }) {
  const m = useLegalCasesMessages();
  const level = useDisasterLevel();
  const { data, isLoading, runAction, runTransition, running } = useCaseActions(tenantId, caseId);
  const [err, setErr] = useState<unknown>(null);

  const actions: AvailableAction[] = (data?.available_actions ?? []).filter((a) => {
    if (level === "CRITICAL_FALLBACK" && a.consumes_llm_tokens) return false;
    if (level === "LLM_DEGRADED" && a.consumes_llm_tokens) return false;
    return true;
  });

  const transitions = (data?.transitions_available ?? []) as CaseState[];

  const exec = async (a: AvailableAction) => {
    setErr(null);
    if (a.requires_confirmation) {
      const ok = typeof window !== "undefined" ? window.confirm(m.actions.confirm_execute) : true;
      if (!ok) return;
    }
    try {
      await runAction({ actionName: a.action_name, payload: {} });
    } catch (e: unknown) {
      setErr(e);
    }
  };

  const execTransition = async (state: CaseState) => {
    setErr(null);
    const reason =
      typeof window !== "undefined"
        ? window.prompt(`Motivo para cambiar estado a ${state}:`, "Transición desde portal legal")
        : "Transición desde portal legal";
    if (!reason?.trim()) return;
    try {
      await runTransition({ newState: state, reason: reason.trim() });
    } catch (e: unknown) {
      setErr(e);
    }
  };

  if (isLoading) return <p className="text-sm text-forgeGray-500">{m.actions.executing}</p>;
  if (!actions.length && !transitions.length) {
    return <p className="text-sm text-forgeGray-500">{m.actions.no_actions}</p>;
  }

  return (
    <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-forgeGray-900">{m.actions.menu_title}</h2>
      {level !== "NORMAL" ? (
        <p className="mb-2 text-xs text-forgeGray-600">{m.actions.blocked_by_mode}</p>
      ) : null}
      {actions.length > 0 ? (
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
                {a.description ? (
                  <span className="mt-0.5 block text-xs text-forgeGray-600">{a.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {transitions.length > 0 ? (
        <div className={actions.length ? "mt-4 border-t border-forgeGray-200 pt-3" : ""}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-forgeGray-500">
            Transiciones de estado
          </p>
          <ul className="flex flex-wrap gap-2">
            {transitions.map((state) => (
              <li key={state}>
                <button
                  type="button"
                  disabled={running}
                  className="rounded-forge-sm px-3 py-1.5 text-xs font-medium ring-1 ring-forgeGray-200 hover:bg-forgeGray-50 disabled:opacity-50"
                  onClick={() => void execTransition(state)}
                >
                  → {state}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {err ? (
        <div className="mt-3">
          <LegalApiErrorPanel title="No se pudo ejecutar la acción" error={err} />
        </div>
      ) : null}
    </div>
  );
}
