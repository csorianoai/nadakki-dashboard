"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface ForgeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const ForgeInput = forwardRef<HTMLInputElement, ForgeInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const generatedId = useId();
    const inputId = id || `forge-input-${generatedId}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-forge-text">
            {label}
          </label>
        )}

        <div
          data-testid="forge-input-control"
          className={cn(
            "relative flex items-center rounded-xl border-2 bg-forge-surface-elevated transition-all duration-200",
            focused && !error && "border-forge-primary shadow-[0_0_0_3px_rgba(255,107,53,0.1)]",
            !focused && !error && "border-forge-border",
            error && "border-forge-danger"
          )}
        >
          {leftIcon && <span className="pl-4 text-forge-text-muted">{leftIcon}</span>}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-transparent px-4 py-3 text-forge-text placeholder:text-forge-text-subtle focus:outline-none",
              leftIcon && "pl-2",
              rightIcon && "pr-2",
              className
            )}
            onFocus={(event) => {
              setFocused(true);
              props.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              props.onBlur?.(event);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon && <span className="pr-4 text-forge-text-muted">{rightIcon}</span>}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-sm text-forge-danger">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-forge-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ForgeInput.displayName = "ForgeInput";
