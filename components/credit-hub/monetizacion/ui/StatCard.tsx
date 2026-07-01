"use client";

type Props = {
  label: string;
  value: string;
  delta?: string;
};

export function StatCard({ label, value, delta }: Props) {
  return (
    <div className="fm-ui-card fm-ui-stat">
      <div className="fm-ui-stat-label">{label}</div>
      <div className="fm-ui-kpi-value fm-ui-kpi-value--sm fm-mono">{value}</div>
      {delta ? <div className="fm-ui-kpi-delta fm-ui-kpi-delta--neutral fm-mono">{delta}</div> : null}
    </div>
  );
}
