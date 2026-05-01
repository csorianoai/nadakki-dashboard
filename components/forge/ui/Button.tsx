"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Button — primary action control for Forge Credit Hub.
 *
 * USAGE: one `primary` per surface; use `danger` for destructive actions; `loading` keeps label visible.
 * ACCESSIBILITY: pass `aria-label` when children are icon-only; focus ring uses token-backed `ring-forgeBrand-500`.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-forge-xs py-1.5",
  md: "min-h-10 px-4 text-forge-sm py-2",
  lg: "min-h-11 px-5 text-forge-md py-2.5",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-forgeBrand-500 text-forgeInk-50 hover:bg-forgeBrand-600 active:bg-forgeBrand-700 shadow-forge-xs border border-forgeBrand-600",
  secondary:
    "bg-forgeSurface-card text-forgeInk-800 border border-forgeInk-200 hover:bg-forgeSurface-sunken active:bg-forgeInk-100",
  ghost: "bg-transparent text-forgeInk-700 hover:bg-forgeSurface-sunken border border-transparent",
  danger: "bg-forgeDanger-500 text-forgeInk-50 hover:bg-forgeDanger-700 border border-forgeDanger-700",
  link: "bg-transparent text-forgeBrand-600 underline-offset-2 hover:underline border-0 shadow-none p-0 min-h-0",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)] ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        leadingIcon
      )}
      {variant !== "link" && <span className="truncate">{children}</span>}
      {variant === "link" && <span>{children}</span>}
      {!loading && trailingIcon}
    </button>
  );
}
