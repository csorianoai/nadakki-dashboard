"use client";

import { forwardRef } from "react";
import type { BankQueueApplication, BankQueueTenantThresholds } from "@/lib/bank-queue/types";
import { DtiCell } from "./DtiCell";
import { PtiCell } from "./PtiCell";
import { SlaCountdown } from "./SlaCountdown";

export interface QueueRowProps {
  application: BankQueueApplication;
  thresholds: BankQueueTenantThresholds | null;
  selected: boolean;
  tabIndex: number;
  onFocusRow: () => void;
  onActivate: () => void;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export const QueueRow = forwardRef<HTMLTableRowElement, QueueRowProps>(function QueueRow(
  { application, thresholds, selected, tabIndex, onFocusRow, onActivate },
  ref,
) {
  const claimed = Boolean(application.claimed_by);

  return (
    <tr
      ref={ref}
      role="row"
      tabIndex={tabIndex}
      aria-selected={selected}
      data-application-id={application.application_id}
      className={`border-b border-forgeGray-100 outline-none transition-colors ${
        selected ? "bg-forgeBrand-50/70 ring-1 ring-inset ring-forgeBrand-300" : "hover:bg-forgeGray-50"
      }`}
      onFocus={onFocusRow}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <td className="max-w-[140px] truncate px-3 py-3 font-mono text-[12px] font-semibold text-forgeGray-900">
        {application.application_id.slice(0, 8)}…
      </td>
      <td className="max-w-[180px] truncate px-3 py-3 text-forge-sm text-forgeGray-900">{application.borrower_name}</td>
      <td className="max-w-[140px] truncate px-3 py-3 text-forge-xs text-forgeGray-600">{application.dealer_name}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-forgeMono text-forge-sm tabular-nums text-forgeGray-900">
        {formatMoney(application.amount)}
      </td>
      <td className="px-3 py-3">
        <PtiCell value={application.pti} thresholds={thresholds} />
      </td>
      <td className="px-3 py-3">
        <DtiCell value={application.dti} thresholds={thresholds} />
      </td>
      <td className="px-3 py-3">
        <SlaCountdown hoursUntilSla={application.hours_until_sla} />
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-forge-xs text-forgeGray-700">{application.status}</td>
      <td className="whitespace-nowrap px-3 py-3 text-forge-xs text-forgeGray-600">{formatIso(application.created_at)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-forge-xs">
        {claimed ? <span className="text-forgeGray-700">En revisión</span> : <span className="text-forgeGray-500">Libre</span>}
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          className="rounded-lg bg-forgeBrand-600 px-3 py-2 text-forge-xs font-medium text-white hover:bg-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          onClick={(e) => {
            e.stopPropagation();
            onActivate();
          }}
        >
          Revisar
        </button>
      </td>
    </tr>
  );
});
