"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BankQueueApplication, BankQueueTenantThresholds } from "@/lib/bank-queue/types";
import { BANK_QUEUE_VIRTUALIZATION_ROW_CAP } from "@/lib/bank-queue/constants";
import { QueueRow } from "./QueueRow";

export interface QueueTableProps {
  applications: BankQueueApplication[];
  thresholds: BankQueueTenantThresholds | null;
  focusedRowIndex: number;
  captureRowRef: (index: number, el: HTMLTableRowElement | null) => void;
  onFocusRowIndex: (index: number) => void;
  onOpenApplication: (applicationId: string) => void;
  virtualizationBanner?: ReactNode;
}

export function QueueTable({
  applications,
  thresholds,
  focusedRowIndex,
  captureRowRef,
  onFocusRowIndex,
  onOpenApplication,
  virtualizationBanner,
}: QueueTableProps) {
  const rows = useMemo(() => applications.slice(0, BANK_QUEUE_VIRTUALIZATION_ROW_CAP), [applications]);

  return (
    <div className="overflow-x-auto rounded-xl border border-forgeGray-200 bg-white shadow-sm">
      {virtualizationBanner}
      <table className="min-w-[960px] w-full border-collapse text-left" role="table" aria-label="Bandeja de solicitudes">
        <thead className="bg-forgeGray-50 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-600">
          <tr>
            <th scope="col" className="px-3 py-3">
              ID
            </th>
            <th scope="col" className="px-3 py-3">
              Solicitante
            </th>
            <th scope="col" className="px-3 py-3">
              Dealer
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              Monto
            </th>
            <th scope="col" className="px-3 py-3">
              PTI
            </th>
            <th scope="col" className="px-3 py-3">
              DTI
            </th>
            <th scope="col" className="px-3 py-3">
              SLA
            </th>
            <th scope="col" className="px-3 py-3">
              Estado
            </th>
            <th scope="col" className="px-3 py-3">
              Creada
            </th>
            <th scope="col" className="px-3 py-3">
              Claim
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((app, index) => (
            <QueueRow
              key={app.application_id}
              ref={(el) => captureRowRef(index, el)}
              application={app}
              thresholds={thresholds}
              selected={focusedRowIndex === index}
              tabIndex={focusedRowIndex === index ? 0 : -1}
              onFocusRow={() => onFocusRowIndex(index)}
              onActivate={() => onOpenApplication(app.application_id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
