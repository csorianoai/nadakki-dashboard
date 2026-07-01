"use client";

import { accentClass } from "./types";
import type { FmAccent } from "./types";

type Props = {
  label: string;
  amount: string;
  pct: number;
  color: FmAccent;
};

export function RevenueBar({ label, amount, pct, color }: Props) {
  return (
    <div className="fm-ui-revenue-bar">
      <div className="fm-ui-revenue-bar-head">
        <span className="fm-ui-revenue-bar-label">
          <span className={`fm-ui-revenue-bar-swatch ${accentClass(color)}`} aria-hidden />
          {label}
        </span>
        <span className="fm-ui-revenue-bar-amount">
          {amount} · {pct}%
        </span>
      </div>
      <div className="fm-ui-revenue-bar-track">
        <div className={`fm-ui-revenue-bar-fill ${accentClass(color)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
