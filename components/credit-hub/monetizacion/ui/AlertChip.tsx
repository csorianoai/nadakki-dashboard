"use client";

import type { AlertSeverity } from "./types";

type Props = {
  kind: string;
  text: string;
  severity: AlertSeverity;
};

export function AlertChip({ kind, text, severity }: Props) {
  return (
    <div className={`fm-ui-card fm-ui-alert fm-ui-alert--${severity}`}>
      <div className={`fm-ui-alert-kind fm-ui-alert-kind--${severity}`}>{kind}</div>
      <div className="fm-ui-alert-text">{text}</div>
    </div>
  );
}
