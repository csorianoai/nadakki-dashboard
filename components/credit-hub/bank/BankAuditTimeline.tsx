"use client";

import { Clock } from "lucide-react";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankAuditTrail } from "@/lib/credit-hub/types/bankDecision";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function BankAuditTimeline({ audit }: { audit?: BankAuditTrail }) {
  const t = useTranslations();
  const events = audit?.events ?? [];
  return (
    <ForgeCard>
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-forge-text">
        <Clock className="h-4 w-4" /> {t.bank_ui.audit_timeline_heading}
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-forge-text-muted">Aún no hay eventos de auditoría bancaria.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={`${event.event}-${index}`} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-primary" />
              <div>
                <p className="font-medium text-forge-text">{event.event}</p>
                <p className="text-xs text-forge-text-muted">
                  {event.by} · {new Date(event.timestamp).toLocaleString("es-DO")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ForgeCard>
  );
}
