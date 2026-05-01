"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "onClick"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

/** Settings-only toggle — not for primary form boolean fields per Forge spec. */
export function Switch({ checked, onCheckedChange, label, className, id, disabled, ...props }: SwitchProps) {
  const sid = id ?? `sw-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-forge-pill border border-forgeInk-200 transition-colors duration-[var(--forge-duration-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          checked ? "bg-forgeBrand-500" : "bg-forgeSurface-sunken"
        )}
        {...props}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-forge-pill bg-forgeSurface-card shadow-forge-xs transition-transform duration-[var(--forge-duration-fast)] ease-out",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="text-forge-sm text-forgeInk-800">{label}</span>
    </label>
  );
}
