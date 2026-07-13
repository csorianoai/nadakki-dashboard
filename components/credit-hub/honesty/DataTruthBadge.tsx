"use client";

import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { DATA_TRUTH_LABELS, DATA_TRUTH_STYLES } from "@/lib/credit-hub/honesty/data-truth";

export function DataTruthBadge({
  level,
  className,
  onRetry,
}: {
  level: DataTruthLevel;
  className?: string;
  /** Shown for ERROR level — retry action when data fetch failed. */
  onRetry?: () => void;
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
        gap: 4,
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
      {level === "ERROR" && onRetry ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
          style={{
            marginLeft: 2,
            padding: "0 4px",
            fontSize: 9,
            fontWeight: 600,
            textTransform: "none",
            letterSpacing: 0,
            background: "transparent",
            border: `1px solid ${s.border}`,
            borderRadius: 3,
            color: s.color,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      ) : null}
    </span>
  );
}
