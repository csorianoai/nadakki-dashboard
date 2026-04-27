"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ForgeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "white" | "ghost-white";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const ForgeButton = forwardRef<HTMLButtonElement, ForgeButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-gradient-to-br from-forge-primary to-forge-primary-hover text-white shadow-md hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]",
      secondary:
        "bg-forge-surface-elevated text-forge-text border border-forge-border hover:border-forge-border-hover hover:bg-forge-surface-hover",
      ghost: "bg-transparent text-forge-text hover:bg-forge-surface-hover",
      danger: "bg-forge-danger text-white hover:bg-red-600",
      white: "bg-white text-forge-bg hover:bg-gray-100",
      "ghost-white": "bg-transparent text-white border border-white/30 hover:bg-white/10",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-base",
      lg: "h-[52px] px-7 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium",
          "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-primary focus-visible:ring-offset-2 focus-visible:ring-offset-forge-bg",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
            <span className="invisible">{children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

ForgeButton.displayName = "ForgeButton";
