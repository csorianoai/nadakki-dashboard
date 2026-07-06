import type { ReactNode } from "react";

export type KpiVariant = "hero" | "normal" | "warn";

export function KpiCard({
  variant = "normal",
  label,
  value,
  unit,
  delta,
  sparkWidth = 70,
  sparkColor,
  pulse,
}: {
  variant?: KpiVariant;
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: ReactNode;
  sparkWidth?: number;
  sparkColor?: "accent" | "warn";
  pulse?: boolean;
}) {
  const classes = ["kpi", variant === "hero" ? "hero" : "", variant === "warn" ? "warn" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="lb">
        {pulse ? <span className="pulse" aria-hidden /> : null}
        {label}
      </div>
      <div className="vl num">
        {value}
        {unit ? <span className="un">{unit}</span> : null}
      </div>
      {delta ? <div className="dl">{delta}</div> : null}
      <div className="spark">
        <i
          style={{
            width: `${sparkWidth}%`,
            ...(sparkColor === "warn" ? { background: "var(--warn)" } : {}),
          }}
        />
      </div>
    </div>
  );
}
