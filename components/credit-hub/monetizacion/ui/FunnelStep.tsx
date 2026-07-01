"use client";

type Props = {
  label: string;
  value: string;
  conv?: string;
};

export function FunnelStep({ label, value, conv }: Props) {
  return (
    <div className="fm-ui-funnel-step">
      <div className="fm-ui-funnel-label">{label}</div>
      <div className="fm-ui-funnel-value fm-mono">{value}</div>
      {conv ? <div className="fm-ui-funnel-conv">{conv}</div> : null}
    </div>
  );
}
