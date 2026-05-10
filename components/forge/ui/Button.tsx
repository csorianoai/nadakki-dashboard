"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Button — primary action control for Forge Credit Hub.
 *
 * **Loading:** spinner is **leading** (left of label), matches Stripe/Linear. Label stays visible.
 * `aria-busy` is set while `loading` is true.
 *
 * **Disabled vs `loading`:** `disabled={true}` alone → muted ink/surface (no spinner). `loading={true}` →
 * native `disabled` + variant colors + leading spinner + `aria-busy`. If **both** are true, **loading UI still
 * shows** (spinner + frozen colors) so in-flight submits never look like a dead gray button — prefer passing
 * **`loading` only** during submit when possible to avoid redundant props.
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

/** Hover/active only — not used when the control is `disabled && !loading` (muted) or frozen loading. */
const variantInteractive: Record<ButtonVariant, string> = {
  primary:
    "bg-forgeBrand-500 text-forgeGray-50 shadow-forge-xs border border-forgeBrand-600 hover:bg-forgeBrand-600 active:bg-forgeBrand-700",
  secondary:
    "bg-forgeSurface-card text-forgeGray-800 border border-forgeGray-200 hover:bg-forgeSurface-sunken active:bg-forgeGray-100",
  ghost: "bg-transparent text-forgeGray-700 border border-transparent hover:bg-forgeSurface-sunken",
  danger: "bg-forgeDanger-500 text-forgeGray-50 border border-forgeDanger-700 hover:bg-forgeDanger-700 active:bg-forgeDanger-800",
  link: "bg-transparent text-forgeBrand-600 border-0 shadow-none p-0 min-h-0 underline-offset-2 hover:underline",
};

/** Frozen appearance while `loading` (native `disabled` would suppress `:hover` on interactive classes). */
const variantLoadingFrozen: Record<ButtonVariant, string> = {
  primary: "cursor-wait border border-forgeBrand-600 bg-forgeBrand-500 text-forgeGray-50 shadow-forge-xs",
  secondary: "cursor-wait border border-forgeGray-200 bg-forgeSurface-card text-forgeGray-800",
  ghost: "cursor-wait border border-transparent bg-transparent text-forgeGray-700",
  danger: "cursor-wait border border-forgeDanger-700 bg-forgeDanger-500 text-forgeGray-50",
  link: "cursor-wait border-0 bg-transparent p-0 min-h-0 text-forgeBrand-600 shadow-none",
};

const variantMuted: Record<ButtonVariant, string> = {
  primary: "cursor-not-allowed border-forgeGray-200 bg-forgeGray-100 text-forgeGray-400 shadow-none",
  secondary: "cursor-not-allowed border-forgeGray-200 bg-forgeGray-100 text-forgeGray-400",
  ghost: "cursor-not-allowed border-transparent bg-transparent text-forgeGray-300",
  danger: "cursor-not-allowed border-forgeGray-200 bg-forgeGray-100 text-forgeGray-400",
  link: "cursor-not-allowed border-0 bg-transparent p-0 min-h-0 text-forgeGray-400 shadow-none hover:no-underline",
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
  type = "button",
  ...props
}: ButtonProps) {
  const showLoading = Boolean(loading);
  const nativeDisabled = Boolean(disabled || loading);
  const visuallyMuted = Boolean(disabled && !loading);

  const variantClass = visuallyMuted
    ? variantMuted[variant]
    : showLoading
      ? variantLoadingFrozen[variant]
      : variantInteractive[variant];

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-forge-sm font-medium transition-colors duration-100 ease-out motion-reduce:transition-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
        sizeClasses[size],
        variantClass,
        fullWidth && "w-full",
        className
      )}
      {...props}
      disabled={nativeDisabled}
      aria-busy={showLoading || undefined}
    >
      {showLoading ? (
        <span
          className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {!showLoading ? leadingIcon : null}
      {variant !== "link" && <span className="truncate">{children}</span>}
      {variant === "link" && <span>{children}</span>}
      {!showLoading ? trailingIcon : null}
    </button>
  );
}
