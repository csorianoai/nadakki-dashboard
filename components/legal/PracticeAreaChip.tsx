"use client";

import type { CSSProperties } from "react";
import { getPracticeArea } from "@/lib/legal/practice-areas";

type Size = "sm" | "md" | "lg";
type Variant = "filled" | "outlined" | "ghost";

export type PracticeAreaChipProps = {
  tag: string;
  size?: Size;
  variant?: Variant;
  removable?: boolean;
  onRemove?: () => void;
  showTooltip?: boolean;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-[11px] px-1.5 py-0.5 rounded",
  md: "text-xs px-2 py-1 rounded",
  lg: "text-sm px-2.5 py-1.5 rounded-md",
};

export function PracticeAreaChip({
  tag,
  size = "sm",
  variant = "filled",
  removable = false,
  onRemove,
  showTooltip = false,
}: PracticeAreaChipProps) {
  const area = getPracticeArea(tag);

  if (!area) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 font-medium",
          "bg-[var(--color-surface-3)] text-[var(--color-text-tertiary)]",
          "border border-[var(--color-border-subtle)]",
          SIZE_CLASSES[size],
        ].join(" ")}
        aria-label={`Área desconocida: ${tag}`}
      >
        {tag}
      </span>
    );
  }

  const baseVar = area.color_token;
  const soft = `var(${baseVar}-soft)`;
  const strong = `var(${baseVar}-strong)`;
  const borderCol = `var(${baseVar}-border)`;

  const variantStyle: CSSProperties =
    variant === "filled"
      ? {
          backgroundColor: soft,
          color: strong,
          borderColor: borderCol,
        }
      : variant === "outlined"
        ? {
            backgroundColor: "transparent",
            color: strong,
            borderColor: borderCol,
          }
        : {
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
            borderColor: "transparent",
          };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 border font-medium",
        variant === "ghost" ? "border-0" : "border",
        SIZE_CLASSES[size],
      ].join(" ")}
      style={variantStyle}
      title={showTooltip ? area.description_es : undefined}
      aria-label={`Área: ${area.display_es}`}
    >
      <span>{area.display_es}</span>
      {removable && onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1"
          aria-label={`Remover ${area.display_es}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
