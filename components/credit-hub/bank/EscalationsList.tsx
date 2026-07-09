"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";
import { chRelTimeDealer } from "@/lib/credit-hub/dealer/dealerFormat";

const ESCALATION_CATEGORIES = new Set(["kyc_escalated", "ocr_escalated", "KYC_ESCALATED", "OCR_ESCALATED"]);

export function EscalationsList() {
  const { items, isLoading, hidden } = useNotifications();

  const escalations = useMemo(
    () =>
      items.filter((n) => {
        const cat = String((n as { category?: string }).category ?? "").toLowerCase();
        const title = (n.title ?? "").toLowerCase();
        return ESCALATION_CATEGORIES.has(cat) || title.includes("escal") || title.includes("kyc") || title.includes("ocr");
      }),
    [items],
  );

  if (!isBankPilotUiEnabled()) {
    return <p className="text-forge-sm text-forgeGray-500">Panel de escalaciones deshabilitado (flag).</p>;
  }

  if (hidden) {
    return <p className="text-forge-sm text-forgeGray-500">Notificaciones no disponibles — activa NEXT_PUBLIC_CH_NOTIFICATIONS.</p>;
  }

  if (isLoading) return <p className="text-forge-sm text-forgeGray-500">Cargando escalaciones…</p>;

  if (escalations.length === 0) {
    return <p className="text-forge-sm text-forgeGray-500">Sin escalaciones pendientes en notificaciones.</p>;
  }

  return (
    <ul className="divide-y divide-forgeGray-100 rounded-forge-md border border-forgeGray-200" data-testid="escalations-list">
      {escalations.map((row) => {
        const appId = (row as { application_id?: string }).application_id;
        return (
          <li key={row.id} className="flex flex-col gap-1 px-4 py-3 text-forge-sm">
            <div className="font-medium text-forgeGray-900">{row.title}</div>
            {row.body ? <div className="text-forgeGray-600">{row.body}</div> : null}
            <div className="flex flex-wrap items-center gap-2 text-forge-xs text-forgeGray-500">
              <span>PENDING_MANUAL_REVIEW</span>
              {row.at ? <span>{chRelTimeDealer(row.at)}</span> : null}
              {appId ? (
                <Link href={`/credit-hub/bank/applications/${appId}`} className="text-forgeBrand-700 underline">
                  Ver expediente
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
