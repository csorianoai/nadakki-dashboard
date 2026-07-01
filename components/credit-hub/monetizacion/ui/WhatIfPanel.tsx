"use client";

export type WhatIfLine = {
  label: string;
  amount: string;
};

type Props = {
  period: string;
  total: string;
  subtotal: string;
  lines: WhatIfLine[];
  delta: string;
  deltaPositive: boolean;
  vsLabel?: string;
  onApply?: () => void;
  empty?: boolean;
};

export function WhatIfPanel({
  period,
  total,
  subtotal,
  lines,
  delta,
  deltaPositive,
  vsLabel = "vs. factura vigente (Híbrido)",
  onApply,
  empty,
}: Props) {
  if (empty) {
    return (
      <div className="fm-ui-card fm-ui-whatif">
        <p style={{ margin: 0, color: "var(--fm-sub)", fontSize: 13 }}>
          Elige un modelo base para simular la factura del periodo.
        </p>
      </div>
    );
  }

  return (
    <div className="fm-ui-card fm-ui-whatif">
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--fm-font-display)", fontSize: 14, color: "var(--fm-ink)" }}>
        Simulador what-if
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fm-ink-soft)" }}>
        Con este modelo, la factura de <strong>{period}</strong> habría sido — sobre datos ya capturados:
      </p>
      <div className="fm-ui-whatif-total">{total}</div>
      <div style={{ fontSize: 12, color: "var(--fm-sub)", marginBottom: 12 }}>subtotal {subtotal}</div>
      {lines.map((line) => (
        <div key={line.label} className="fm-ui-whatif-line">
          <span>{line.label}</span>
          <span className="fm-mono">{line.amount}</span>
        </div>
      ))}
      <div
        className={`fm-ui-whatif-line fm-mono ${deltaPositive ? "fm-ui-whatif-delta--pos" : "fm-ui-whatif-delta--neg"}`}
        style={{ marginTop: 10, fontWeight: 600 }}
      >
        <span>{vsLabel}</span>
        <span>{delta}</span>
      </div>
      {onApply ? (
        <button type="button" className="fm-btn-primary" style={{ marginTop: 14 }} onClick={onApply}>
          Aplicar modelo con vigencia
        </button>
      ) : null}
    </div>
  );
}
