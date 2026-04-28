"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { BankPriorityBadge } from "./BankPriorityBadge";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

function formatDop(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
}

export function BankApplicationCard({
  application,
  selected,
  onSelect,
}: {
  application: BankQueueItem;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <ForgeCard className="transition-colors hover:border-forge-primary/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          {onSelect && (
            <input
              aria-label={`Seleccionar solicitud ${application.application_id}`}
              type="checkbox"
              checked={selected}
              onChange={(event) => onSelect(event.target.checked)}
              className="mt-1"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-forge-text">{application.applicant_name || "Cliente sin nombre"}</h3>
              <BankPriorityBadge priority={application.priority} />
              {application.bank_decision && <ForgeBadge tone="success">{application.bank_decision.decision}</ForgeBadge>}
            </div>
            <p className="mt-1 text-sm text-forge-text-muted">
              {application.vehicle_label || "Producto no especificado"} · {application.dealer_name || "Dealer no especificado"}
            </p>
            <p className="mt-1 font-mono text-xs text-forge-text-muted">{application.application_id}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm md:min-w-[360px]">
          <div>
            <p className="text-forge-text-muted">{t.bank.application_score_label}</p>
            <p className="font-display text-2xl font-bold text-forge-text">{application.score}</p>
          </div>
          <div>
            <p className="text-forge-text-muted">Monto</p>
            <p className="font-semibold text-forge-text">{formatDop(application.requested_amount)}</p>
          </div>
          <Link href={`/credit-hub/bank/applications/${application.application_id}`} className="flex items-center justify-end gap-2 text-forge-primary">
            Revisar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </ForgeCard>
  );
}
