"use client";

import type { BankAuditTrail } from "@/lib/credit-hub/types/bankDecision";
import { chRelTime } from "@/lib/credit-hub/bank/bankFormat";

const ACTION_LABEL: Record<string, string> = {
  // Lowercase events (legacy)
  submitted: "Recibida",
  analyzed: "Analizada",
  claimed: "Reclamada",
  decided: "Decidida",
  compliance_checked: "Compliance verificado",
  compliance_approved: "Compliance aprobado",
  // Uppercase events (backend constants)
  SUBMITTED: "Recibida",
  ANALYZED: "Analizada",
  CLAIMED: "Reclamada",
  DECIDED: "Decidida",
  BANK_DECISION_MADE: "Decisión bancaria",
  COMPLIANCE_CHECKED: "Compliance verificado",
  COMPLIANCE_APPROVED: "Compliance aprobado",
  APPLICATION_CREATED: "Solicitud creada",
  APPLICATION_UPDATED: "Solicitud actualizada",
  COUNTER_OFFER_MADE: "Contraoferta realizada",
  COUNTER_OFFER_ACCEPTED: "Contraoferta aceptada",
  COUNTER_OFFER_REJECTED: "Contraoferta rechazada",
  STIPULATION_ADDED: "Estipulación agregada",
  STIPULATION_VERIFIED: "Estipulación verificada",
  STIPULATION_REJECTED: "Estipulación rechazada",
  DOCUMENT_UPLOADED: "Documento cargado",
  MESSAGE_SENT: "Mensaje enviado",
  ASSIGNMENT_CHANGED: "Reasignación",
};

export function AuditTab({ audit }: { audit?: BankAuditTrail }) {
  const events = audit?.events ?? [];
  if (!events.length) {
    return <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>Sin eventos de auditoría.</div>;
  }

  return (
    <div className="ch-card" style={{ padding: "6px 0" }}>
      {events.map((e, i) => (
        <div
          key={`${e.timestamp}-${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: "62px 1fr",
            gap: 12,
            alignItems: "flex-start",
            padding: "12px 18px",
            borderTop: i ? "1px solid var(--ch-line)" : "none",
          }}
        >
          <span className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)", paddingTop: 5 }}>
            {chRelTime(e.timestamp)}
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{ACTION_LABEL[e.event] ?? e.event}</div>
            <div className="ch-mono" style={{ fontSize: 10.5, color: "var(--ch-text-3)", marginTop: 1 }}>
              {e.by || "Sistema"}
            </div>
            {e.decision ? (
              <div style={{ fontSize: 12, color: "var(--ch-text-2)", marginTop: 5 }}>
                Decisión: <span className="ch-mono">{e.decision}</span>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
