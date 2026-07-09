"use client";

import { EscalationsList } from "@/components/credit-hub/bank/EscalationsList";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

export default function BankEscalationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 22 }}>
          Escalaciones KYC / OCR
        </h1>
        <DataTruthBadge level="REAL" />
      </div>
      <p className="text-forge-sm text-forgeGray-500">
        Lista derivada de notificaciones del backend (KYC_ESCALATED, OCR_ESCALATED). Sin endpoint de listado dedicado en OpenAPI v5.4.4.
      </p>
      <EscalationsList />
    </div>
  );
}
