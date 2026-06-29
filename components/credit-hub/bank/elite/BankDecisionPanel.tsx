"use client";

import { CheckCircle2, HandCoins, XCircle } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const ACTIONS = [
  {
    key: "approve",
    label: "Aprobar",
    icon: CheckCircle2,
    tone: "success" as const,
    desc: "Emite decisión positiva con stipulations opcionales",
  },
  {
    key: "reject",
    label: "Rechazar",
    icon: XCircle,
    tone: "danger" as const,
    desc: "Registra motivo Reg B / política crediticia",
  },
  {
    key: "counter",
    label: "Contraofertar",
    icon: HandCoins,
    tone: "warning" as const,
    desc: "Propone tasa, plazo o monto alternativo",
  },
];

export function BankDecisionPanel() {
  return (
    <section data-testid="bank-decision-panel" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow">Panel de decisión</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Acciones desde expediente
        </h2>
        <DataTruthBadge level="ROADMAP" />
      </div>

      <div className="ch-card ch-card-spotlight overflow-hidden">
        <div className="ch-card-h">
          <div>
            <div className="ch-card-title">Mesa de decisión inline</div>
            <div className="ch-card-sub">Aprobar, rechazar, contraofertar y stipulations — hoy vía expediente</div>
          </div>
          <span className="ch-chip" style={{ fontSize: 10 }}>
            ROADMAP inline
          </span>
        </div>

        <div className="p-4">
          {ACTIONS.map((action, index) => {
            const Icon = action.icon;
            const toneMap = {
              success: ["var(--ch-success-text)", "var(--ch-success-soft)", "#BBF7D0"],
              danger: ["var(--ch-danger-text)", "var(--ch-danger-soft)", "#FECACA"],
              warning: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "var(--ch-accent-line)"],
            } as const;
            const [c, bg, bd] = toneMap[action.tone];
            return (
              <div
                key={action.key}
                className="ch-field-row"
                style={index === 0 ? { paddingTop: 0 } : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: bg,
                      border: `1px solid ${bd}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: c }} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ch-text-3)" }}>{action.desc}</div>
                  </div>
                </div>
                <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled title="Abrir expediente desde la cola">
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--ch-line-subtle)",
            fontSize: 11.5,
            color: "var(--ch-text-3)",
            background: "var(--ch-surface-2)",
          }}
        >
          ROADMAP acciones inline — usar expediente de cada solicitud para decisiones auditables.
        </div>
      </div>
    </section>
  );
}
