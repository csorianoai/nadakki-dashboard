"use client";

type Props = {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  onDrill?: () => void;
  size?: "lg" | "sm";
};

function deltaTone(delta?: string): "up" | "down" | "neutral" {
  if (!delta) return "neutral";
  if (delta.startsWith("+")) return "up";
  if (delta.startsWith("−") || delta.startsWith("-")) return "down";
  return "neutral";
}

export function KpiCard({ label, value, delta, sub, onDrill, size = "lg" }: Props) {
  const clickable = Boolean(onDrill);
  const ariaLabel = clickable ? `${label}, ${value}. Ver origen de la cifra` : undefined;
  return (
    <div
      className={`fm-ui-card fm-ui-kpi${clickable ? " fm-ui-kpi--clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onDrill}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrill?.();
              }
            }
          : undefined
      }
    >
      <div className="fm-ui-kpi-head">
        <span className="fm-ui-kpi-label">{label}</span>
        {delta ? (
          <span className={`fm-ui-kpi-delta fm-ui-kpi-delta--${deltaTone(delta)} fm-mono`}>{delta}</span>
        ) : null}
      </div>
      <div className={`fm-ui-kpi-value fm-mono${size === "sm" ? " fm-ui-kpi-value--sm" : ""}`}>{value}</div>
      {sub || onDrill ? (
        <div className="fm-ui-kpi-foot">
          <span>{sub}</span>
          {onDrill ? <span className="fm-ui-drill-chip">ver origen ↗</span> : null}
        </div>
      ) : null}
    </div>
  );
}
