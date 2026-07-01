"use client";

import { formatRd } from "@/lib/credit-hub/monetizacion/format";
import type { WhatIfInput } from "@/lib/credit-hub/monetizacion/types";
import { whatif } from "@/lib/credit-hub/monetizacion/whatif";

export type WhatIfLine = {
  label: string;
  amount: string;
};

type Props = {
  period?: string;
  total?: string;
  subtotal?: string;
  lines?: WhatIfLine[];
  delta?: string;
  deltaPositive?: boolean;
  vsLabel?: string;
  onApply?: () => void;
  /** Live mode — computes from whatif.ts (requires M4). */
  config?: WhatIfInput | null;
};

export function WhatIfPanel({
  period = "mayo 2026",
  total,
  subtotal,
  lines,
  delta,
  deltaPositive,
  vsLabel = "vs. factura vigente (Híbrido)",
  onApply,
  config,
}: Props) {
  if (!config?.base) {
    return (
      <div className="fm-ui-card fm-ui-whatif">
        <p style={{ margin: 0, color: "var(--fm-sub)", fontSize: 13 }}>
          Elige un modelo base para simular la factura del periodo.
        </p>
      </div>
    );
  }

  const computed = whatif({
    base: config.base,
    bps: config.bps,
    addSetup: config.addSetup,
    addAI: config.addAI,
    addSeats: config.addSeats,
    principal: config.principal,
  });

  const displayTotal = formatRd(computed.total);
  const displaySubtotal = formatRd(computed.subtotal);
  const displayLines: WhatIfLine[] = computed.lines.map((l) => ({
    label: l.label,
    amount: formatRd(l.amount),
  }));
  const displayDelta = `${computed.delta >= 0 ? "+" : "−"}${formatRd(Math.abs(computed.delta))}`;
  const displayDeltaPositive = computed.delta >= 0;

  return (
    <div className="fm-ui-card fm-ui-whatif">
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--fm-font-display)", fontSize: 14, color: "var(--fm-ink)" }}>
        Simulador what-if
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fm-ink-soft)" }}>
        Con este modelo, la factura de <strong>{period}</strong> habría sido — sobre datos ya capturados:
      </p>
      <div className="fm-ui-whatif-total">{displayTotal}</div>
      <div style={{ fontSize: 12, color: "var(--fm-sub)", marginBottom: 12 }}>subtotal {displaySubtotal}</div>
      {displayLines.map((line) => (
        <div key={line.label} className="fm-ui-whatif-line">
          <span>{line.label}</span>
          <span className="fm-mono">{line.amount}</span>
        </div>
      ))}
      <div
        className={`fm-ui-whatif-line fm-mono ${displayDeltaPositive ? "fm-ui-whatif-delta--pos" : "fm-ui-whatif-delta--neg"}`}
        style={{ marginTop: 10, fontWeight: 600 }}
      >
        <span>{vsLabel}</span>
        <span>{displayDelta}</span>
      </div>
      {onApply ? (
        <button type="button" className="fm-btn-primary" style={{ marginTop: 14 }} onClick={onApply}>
          Aplicar modelo con vigencia
        </button>
      ) : null}
    </div>
  );
}
