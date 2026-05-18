"use client";

import { FileText, CheckCircle2, Ban, Eye } from "lucide-react";
import type { CreditStipulation, StipulationsApiRole } from "@/lib/api/stipulations-types";
import { AuditTrailViewer } from "@/components/bank/stipulations/AuditTrailViewer";
import { StipulationStatusBadge } from "@/components/bank/stipulations/StatusBadge";

export interface StipulationCardProps {
  applicationId: string;
  stipulation: CreditStipulation;
  selected: boolean;
  indexLabel: string;
  role: StipulationsApiRole;
  canMutate: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onVerify: () => void;
  onReject: () => void;
}

export function StipulationCard({
  applicationId,
  stipulation,
  selected,
  indexLabel,
  role,
  canMutate,
  onSelect,
  onPreview,
  onVerify,
  onReject,
}: StipulationCardProps) {
  const showActions = canMutate && (stipulation.status === "uploaded" || stipulation.status === "pending");

  return (
    <article
      role="button"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-xl border p-4 text-left shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forgeBrand-500 ${
        selected ? "border-forgeBrand-300 bg-forgeBrand-50/40" : "border-forgeGray-200 bg-white hover:border-forgeGray-300"
      }`}
      data-testid={`stipulation-card-${stipulation.id}`}
      data-stipulation-index={indexLabel}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">{indexLabel}</p>
          <h3 className="mt-1 text-base font-semibold text-forgeGray-900">{stipulation.title ?? stipulation.description}</h3>
          {stipulation.title ? (
            <p className="mt-1 text-forge-sm text-forgeGray-600">{stipulation.description}</p>
          ) : null}
        </div>
        <StipulationStatusBadge status={stipulation.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 no-print">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-forgeGray-200 bg-white px-3 py-1.5 text-forge-sm font-medium text-forgeGray-800 hover:bg-forgeGray-50"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          data-nadakki-track="bank.stipulation.preview"
        >
          <Eye className="h-4 w-4" aria-hidden />
          Ver documento
        </button>
        {showActions ? (
          <>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-forge-sm font-medium text-white hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onVerify();
              }}
              data-nadakki-track="bank.stipulation.verify.open"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Verificar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-forge-sm font-medium text-rose-800 hover:bg-rose-100"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              data-nadakki-track="bank.stipulation.reject.open"
            >
              <Ban className="h-4 w-4" aria-hidden />
              Rechazar
            </button>
          </>
        ) : null}
        {!canMutate && stipulation.status !== "verified" && stipulation.status !== "rejected" ? (
          <span className="inline-flex items-center gap-1 text-forge-xs text-forgeGray-500">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Solo lectura (analista)
          </span>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-4 border-t border-forgeGray-100 pt-4 print:break-inside-avoid">
          <h4 className="m-0 text-forge-sm font-semibold text-forgeGray-800">Historial</h4>
          <div className="mt-2">
            <AuditTrailViewer applicationId={applicationId} stipulationId={stipulation.id} role={role} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
