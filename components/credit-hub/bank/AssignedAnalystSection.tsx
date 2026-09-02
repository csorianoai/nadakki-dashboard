"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, UserCog } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getApplicationAssignment,
  isBankExperienceEndpointUnavailable,
  postReassignApplication,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { isBankSupervisorRole } from "@/lib/credit-hub/bank/bankExperienceHelpers";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { BankApplicationClaim } from "@/lib/credit-hub/types/bankDecision";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AssignedAnalystSection({
  applicationId,
  roleKey,
  claim,
}: {
  applicationId: string;
  roleKey: string | null;
  claim?: BankApplicationClaim | null;
}) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["app-assignment", apiTenantId, applicationId],
    queryFn: () => getApplicationAssignment({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const current = q.data?.current;
  const claimCurrent = claim?.analyst_id
    ? {
        analyst_id: claim.analyst_id,
        analyst_name: claim.analyst_name ?? claim.analyst_id,
        assigned_at: claim.claimed_at ?? undefined,
      }
    : undefined;
  const displayedCurrent = claimCurrent ?? current;
  const history = q.data?.history ?? [];
  const canReassign = isBankSupervisorRole(roleKey);

  const reassign = async () => {
    const name = newName.trim();
    if (!apiTenantId || !name) return;
    setBusy(true);
    try {
      await postReassignApplication({
        tenantId: apiTenantId,
        applicationId,
        analyst_name: name,
        notes: reassignNotes.trim() || undefined,
      });
      setModalOpen(false);
      setNewName("");
      setReassignNotes("");
      void qc.invalidateQueries({ queryKey: ["app-assignment", apiTenantId, applicationId] });
      forgeToast.success("Analista reasignado");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo reasignar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="ch-card mb-3 flex flex-wrap items-center justify-between gap-3 p-3"
      data-testid="assigned-analyst-section"
      style={{ borderLeft: "3px solid var(--ch-accent-mid)" }}
    >
      <div className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-forgeGray-500" aria-hidden />
        <div>
          <div className="ch-eyebrow">Analista asignado</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }} data-testid="assigned-analyst-name">
            {q.isLoading && !displayedCurrent ? "…" : displayedCurrent?.analyst_name ?? "Sin asignar"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canReassign ? (
          <button
            type="button"
            className="ch-btn ch-btn-secondary ch-btn-sm"
            onClick={() => setModalOpen(true)}
            data-testid="reassign-btn"
          >
            Reasignar
          </button>
        ) : null}
        {history.length > 0 ? (
          <button
            type="button"
            className="ch-btn ch-btn-ghost ch-btn-sm"
            onClick={() => setHistoryOpen((v) => !v)}
            data-testid="assignment-history-toggle"
          >
            Historial
            {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>

      {historyOpen && history.length > 0 ? (
        <div className="w-full border-t border-forgeGray-100 pt-3" data-testid="assignment-history">
          {history.map((h, i) => (
            <div key={`${h.assigned_at}-${i}`} className="mb-2 text-sm last:mb-0">
              <span style={{ fontWeight: 600 }}>{h.analyst_name}</span>
              <span className="text-forgeGray-500"> · {formatDate(h.assigned_at)}</span>
              {h.notes ? <p className="mt-0.5 text-forgeGray-600">{h.notes}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="reassign-title"
          data-testid="reassign-modal"
        >
          <div className="ch-card w-full max-w-md p-5">
            <h3 id="reassign-title" className="ch-serif" style={{ margin: "0 0 12px", fontSize: 17 }}>
              Reasignar analista
            </h3>
            <label className="mb-1 block text-xs font-medium">Nombre del nuevo analista</label>
            <input
              className="ch-input mb-3 w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. María López"
              data-testid="reassign-name-input"
            />
            <label className="mb-1 block text-xs font-medium">Notas de reasignación</label>
            <textarea
              className="ch-input mb-4 w-full"
              rows={3}
              value={reassignNotes}
              onChange={(e) => setReassignNotes(e.target.value)}
              placeholder="Motivo o contexto (opcional)"
              data-testid="reassign-notes-input"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="ch-btn ch-btn-primary ch-btn-sm"
                disabled={busy || !newName.trim()}
                onClick={() => void reassign()}
                data-testid="reassign-confirm-btn"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
