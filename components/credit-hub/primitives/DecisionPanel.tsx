"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";
import type { DecisionMode, DecisionPanelProps } from "@/lib/credit-hub/ch-types";

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <Loader2
      className="animate-spin motion-reduce:animate-none"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function DecisionPanel({
  amount = 285000,
  term = 48,
  rate = 17.5,
  state: stateProp = "idle",
  sticky = false,
  className,
  canDecide = true,
  errorDetail,
  lenderOptions = [],
  lenderCode,
  onLenderChange,
  onSubmit,
}: DecisionPanelProps) {
  const [mode, setMode] = useState<DecisionMode>("approve");
  const [state, setState] = useState(stateProp);
  const [justif, setJustif] = useState("");

  useEffect(() => {
    setState(stateProp);
  }, [stateProp]);

  const modes: Array<{ k: DecisionMode; label: string; cls: string; icon: React.ReactNode }> = [
    { k: "approve", label: "Aprobar", cls: "ch-btn-success", icon: <Check className="h-3.5 w-3.5" aria-hidden /> },
    { k: "counter", label: "Contraoferta", cls: "ch-btn-secondary", icon: <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> },
    { k: "reject", label: "Rechazar", cls: "ch-btn-danger", icon: <X className="h-3.5 w-3.5" aria-hidden /> },
  ];

  const submit = async () => {
    setState("loading");
    if (onSubmit) {
      try {
        await onSubmit(mode, justif);
        setState("success");
      } catch {
        setState("error");
      }
      return;
    }
    window.setTimeout(() => setState("success"), 1100);
  };

  const lenderRequired = lenderOptions.length > 1 && !lenderCode;

  return (
    <div className={cn("ch-card", className)} style={{ position: sticky ? "sticky" : "static", top: 24, overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--ch-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="ch-eyebrow">Decisión de crédito</div>
        <span className="ch-chip persona">Comité L3</span>
      </div>

      {state === "success" ? (
        <div style={{ padding: "28px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "var(--ch-success-soft)",
              color: "var(--ch-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Check className="h-6 w-6" aria-hidden />
          </div>
          <div style={{ fontSize: "var(--ch-text-lg)", fontWeight: 600 }}>Decisión registrada</div>
          <div style={{ fontSize: "var(--ch-text-sm)", color: "var(--ch-text-3)", marginTop: 6 }}>
            Solicitud aprobada por {chMoneyExact(amount)} · {term} meses.
          </div>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" style={{ marginTop: 16 }} onClick={() => setState("idle")}>
            Ver comprobante
          </button>
        </div>
      ) : (
        <div style={{ padding: 18 }}>
          {lenderOptions.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <label className="ch-label" htmlFor="decision-lender">Lender que responde</label>
              <select
                id="decision-lender"
                className="ch-select"
                value={lenderCode ?? lenderOptions[0]}
                onChange={(e) => onLenderChange?.(e.target.value)}
              >
                {lenderOptions.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
          ) : null}
          {lenderRequired ? (
            <p role="status" style={{ marginBottom: 12, fontSize: 12.5, color: "var(--ch-warning-text)" }}>
              Selecciona el lender que emitirá esta decisión.
            </p>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
            {modes.map((m) => (
              <button
                key={m.k}
                type="button"
                onClick={() => setMode(m.k)}
                style={{
                  height: 32,
                  borderRadius: "var(--ch-r-md)",
                  border: "1px solid",
                  borderColor: mode === m.k ? "var(--ch-persona)" : "var(--ch-line-2)",
                  background: mode === m.k ? "var(--ch-persona-soft)" : "var(--ch-surface)",
                  color: mode === m.k ? "var(--ch-persona-text)" : "var(--ch-text-2)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {mode !== "reject" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label className="ch-label">Monto aprobado</label>
                <input className="ch-input ch-mono" defaultValue={chMoneyExact(amount)} readOnly />
              </div>
              <div>
                <label className="ch-label">Plazo (meses)</label>
                <input className="ch-input ch-mono" defaultValue={String(term)} readOnly />
              </div>
              <div>
                <label className="ch-label">Tasa anual</label>
                <input className="ch-input ch-mono" defaultValue={`${rate}%`} readOnly />
              </div>
              <div>
                <label className="ch-label">Enganche</label>
                <input className="ch-input ch-mono" defaultValue="20%" readOnly />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label className="ch-label">Motivo de rechazo</label>
              <select className="ch-select" defaultValue="">
                <option>Capacidad de pago insuficiente (DTI &gt; 45%)</option>
                <option>Score por debajo de política</option>
              </select>
            </div>
          )}

          <label className="ch-label">
            Justificación <span style={{ color: "var(--ch-danger)" }}>*</span>
          </label>
          <textarea
            className="ch-input ch-textarea"
            value={justif}
            onChange={(e) => setJustif(e.target.value)}
            placeholder="Sustento de la decisión para el audit trail…"
          />

          {state === "error" ? (
            <div
              role="alert"
              style={{
                display: "flex",
                gap: 9,
                padding: "10px 12px",
                background: "var(--ch-danger-soft)",
                borderRadius: "var(--ch-r-md)",
                marginTop: 12,
                fontSize: 12.5,
                color: "var(--ch-danger-text)",
              }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <strong>{errorDetail ? "Error al registrar la decisión." : "Conflicto 409."}</strong>{" "}
                {errorDetail ?? "No se pudo completar la operación."}
              </div>
            </div>
          ) : null}

          {!canDecide ? (
            <p
              role="status"
              data-testid="decision-panel-forbidden"
              style={{ marginBottom: 12, fontSize: 12.5, color: "var(--ch-text-3)" }}
            >
              Tu rol no tiene permiso para registrar decisiones en esta solicitud.
            </p>
          ) : null}

          <button
            type="button"
            className={`ch-btn ${mode === "reject" ? "ch-btn-danger" : "ch-btn-primary"} ch-btn-lg`}
            style={{ width: "100%", marginTop: 14 }}
            disabled={!canDecide || lenderRequired || state === "loading" || (state !== "error" && justif.trim().length === 0)}
            onClick={submit}
          >
            {state === "loading" ? (
              <>
                <Spinner />
                Procesando…
              </>
            ) : (
              <>
                {modes.find((m) => m.k === mode)?.icon}
                {mode === "approve" ? "Aprobar solicitud" : mode === "counter" ? "Enviar contraoferta" : "Rechazar solicitud"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
