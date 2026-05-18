"use client";

import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";
import { OPTIMISTIC_CLAIM_TIMEOUT_MS } from "@/lib/bank-application-detail/constants";

export interface ActionPanelProps {
  detail: BankApplicationDetailResponse;
  claimLoading: boolean;
  onClaim: () => void;
  onDecide: () => void;
  /** When true, analyst cannot open decision (e.g. not claim owner). */
  decideDisabled?: boolean;
}

export function ActionPanel({
  detail,
  claimLoading,
  onClaim,
  onDecide,
  decideDisabled = false,
}: ActionPanelProps) {
  const owns = detail.bank_claim?.current_user_owns === true;
  const canClaim =
    !owns &&
    (detail.queue_status === "pending" || detail.queue_status === "reviewing");

  return (
    <section
      className="rounded-xl border border-forgeBrand-200 bg-forgeBrand-50/40 p-6 shadow-sm"
      aria-labelledby="action-panel-title"
    >
      <h2 id="action-panel-title" className="text-lg font-semibold text-forgeGray-900">
        Acciones
      </h2>
      {owns ? (
        <p className="mt-3 text-forge-sm text-forgeGray-800" role="status">
          Tienes la solicitud asignada para revisión.
        </p>
      ) : (
        <p className="mt-3 text-forge-sm text-forgeGray-700">
          Reclama la solicitud para bloquear edición concurrente (timeout {OPTIMISTIC_CLAIM_TIMEOUT_MS / 1000}s en operaciones).
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canClaim || claimLoading}
          onClick={onClaim}
          className="min-h-11 rounded-lg bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeBrand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          {claimLoading ? "Reclamando…" : "Reclamar"}
        </button>
        <button
          type="button"
          disabled={decideDisabled}
          title={decideDisabled ? "Reclama la solicitud como analista para decidir" : undefined}
          onClick={onDecide}
          className="min-h-11 rounded-lg border border-forgeGray-300 bg-white px-4 py-2 text-forge-sm font-medium text-forgeGray-900 hover:bg-forgeGray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          Decisión
        </button>
      </div>
    </section>
  );
}
