"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { BankPriorityBadge } from "./BankPriorityBadge";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

function formatDop(value: number | string | null) {
  if (value == null) return "No informado";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "No informado";
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(num);
}

function getMessageStatus(application: BankQueueItem): { label: string; visible: boolean } | null {
  // Si no hay información de mensajes, no mostrar nada
  if (application.last_message_sender === undefined && application.pendiente_respuesta_banco === undefined) {
    return null;
  }

  // Prioridad: pendiente_respuesta_banco > 0
  if (application.pendiente_respuesta_banco && application.pendiente_respuesta_banco > 0) {
    return { label: "Esperando tu respuesta", visible: true };
  }

  // Si el último mensaje fue del banco, espera al concesionario
  if (application.last_message_sender === "BANK") {
    return { label: "Esperando al concesionario", visible: true };
  }

  // Sin mensajes o último mensaje del dealer: no mostrar nada
  return null;
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
  const messageStatus = getMessageStatus(application);

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
              {messageStatus ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "var(--ch-surface-2)",
                    border: "1px solid var(--ch-line)",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ch-text-2)",
                  }}
                  data-testid="message-status-indicator"
                >
                  <MessageCircle className="h-3 w-3" />
                  {messageStatus.label}
                </span>
              ) : null}
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
