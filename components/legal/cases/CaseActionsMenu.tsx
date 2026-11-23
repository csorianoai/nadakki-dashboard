"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddPartyForm } from "@/components/legal/cases/AddPartyForm";
import type { AvailableAction, CaseState } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { actionDisplayLabel, caseStateLabel } from "@/lib/legal/presentation-labels";
import { useCaseActions } from "@/hooks/legal/useCaseActions";
import { useDisasterLevel } from "@/app/providers/DisasterModeProvider";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

/**
 * Acciones que necesitan datos del usuario: no se ejecutan con payload vacío (antes
 * add_actor daba 500 y upload_document respondía 200 sin hacer nada). Abren su
 * formulario o llevan a la pantalla donde se completan.
 */
const ACCION_CON_PANTALLA: Record<string, string> = {
  upload_document: "documents",
  compute_deadlines: "deadlines",
  add_manual_deadline: "deadlines",
  complete_deadline: "deadlines",
};

export function CaseActionsMenu({ tenantId, caseId, onChanged }: { tenantId: string; caseId: string; onChanged?: () => void }) {
  const router = useRouter();
  const [agregandoParte, setAgregandoParte] = useState(false);
  const m = useLegalCasesMessages();
  const level = useDisasterLevel();
  const { data, isLoading, runAction, runTransition, running } = useCaseActions(tenantId, caseId);
  const [err, setErr] = useState<unknown>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<
    { tipo: "estado"; estado: CaseState } | { tipo: "accion"; accion: AvailableAction } | null
  >(null);
  const [motivo, setMotivo] = useState("");

  const actions: AvailableAction[] = (data?.available_actions ?? []).filter((a) => {
    // «Marcar plazo cumplido» se hace en cada plazo, no desde este panel (QA ronda 2).
    if (a.action_name === "complete_deadline") return false;
    if (level === "CRITICAL_FALLBACK" && a.consumes_llm_tokens) return false;
    if (level === "LLM_DEGRADED" && a.consumes_llm_tokens) return false;
    return true;
  });

  const transitions = (data?.transitions_available ?? []) as CaseState[];

  const exec = async (a: AvailableAction) => {
    setErr(null);
    if (a.action_name === "add_actor") {
      setAgregandoParte(true);
      return;
    }
    const pantalla = ACCION_CON_PANTALLA[a.action_name];
    if (pantalla) {
      router.push(`/legal/cases/${encodeURIComponent(caseId)}/${pantalla}`);
      return;
    }
    if (a.requires_confirmation) {
      // Sin window.confirm/prompt: el diálogo del navegador bloqueaba la página (QA 23-nov).
      setPendiente({ tipo: "accion", accion: a });
      return;
    }
    await ejecutarAccion(a);
  };

  const ejecutarAccion = async (a: AvailableAction) => {
    setAviso(null);
    try {
      const r = (await runAction({ actionName: a.action_name, payload: {} })) as
        | { estado?: string; motivo?: string; count?: number }
        | null
        | undefined;
      // QA 23-nov: «Generar estrategias» respondía 200 con estado sin_datos y la pantalla no decía nada.
      if (r && (r.estado === "sin_datos" || r.estado === "error") && r.motivo) {
        setAviso(`No se generaron estrategias: ${r.motivo}`);
      } else if (a.action_name === "generate_strategies" && typeof r?.count === "number") {
        setAviso(r.count > 0 ? `Se generaron ${r.count} estrategias. Revísalas en la pestaña Estrategia.` : "No se generaron estrategias.");
      }
    } catch (e: unknown) {
      setErr(e);
    }
  };

  const execTransition = (state: CaseState) => {
    setErr(null);
    setMotivo("");
    setPendiente({ tipo: "estado", estado: state });
  };

  const confirmar = async () => {
    if (!pendiente) return;
    if (pendiente.tipo === "accion") {
      setPendiente(null);
      await ejecutarAccion(pendiente.accion);
      return;
    }
    if (!motivo.trim()) return;
    try {
      await runTransition({ newState: pendiente.estado, reason: motivo.trim() });
      setPendiente(null);
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
                aria-expanded={a.action_name === "add_actor" ? agregandoParte : undefined}
                onClick={() => void exec(a)}
              >
                <span className="font-medium">{actionDisplayLabel(m, a)}</span>
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
                  onClick={() => execTransition(state)}
                >
                  → {caseStateLabel(m, state)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {aviso ? (
        <p role="status" className="mt-3 rounded-forge-sm bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {aviso}
        </p>
      ) : null}
      {pendiente ? (
        <div role="group" aria-label="Confirmar" className="mt-3 rounded-forge-sm border border-blue-200 bg-blue-50 p-3 text-sm">
          {pendiente.tipo === "estado" ? (
            <label className="block text-xs font-medium text-forgeGray-800">
              Motivo para pasar a «{caseStateLabel(m, pendiente.estado)}» (queda en la línea de tiempo)
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                autoFocus
                placeholder="Ej.: Se notificó la sentencia de primera instancia"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
              />
            </label>
          ) : (
            <p className="text-xs text-forgeGray-800">{m.actions.confirm_execute}</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={running || (pendiente.tipo === "estado" && !motivo.trim())}
              onClick={() => void confirmar()}
              className="rounded-forge-sm bg-blue-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Confirmar
            </button>
            <button type="button" onClick={() => setPendiente(null)} className="rounded-forge-sm border border-slate-300 bg-white px-3 py-1 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
      {agregandoParte ? (
        <div className="mt-3">
          <AddPartyForm
            tenantId={tenantId}
            caseId={caseId}
            onDone={() => {
              setAgregandoParte(false);
              onChanged?.();
            }}
            onCancel={() => setAgregandoParte(false)}
          />
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
