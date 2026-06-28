"use client";

import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { DATA_TRUTH_LABELS, DATA_TRUTH_STYLES } from "@/lib/credit-hub/honesty/data-truth";

export function DataTruthBadge({
  level,
  className,
}: {
  level: DataTruthLevel;
  className?: string;
}) {
  const s = DATA_TRUTH_STYLES[level];
  return (
    <span
      className={className}
      data-truth={level}
      title={`Fuente de datos: ${DATA_TRUTH_LABELS[level]}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 4,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        lineHeight: 1.2,
        flexShrink: 0,
      }}
    >
      {DATA_TRUTH_LABELS[level]}
    </span>
  );
}
