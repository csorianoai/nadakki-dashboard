"use client";

import { forwardRef, type SelectHTMLAttributes, type ReactNode, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForgeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export const ForgeSelect = forwardRef<HTMLSelectElement, ForgeSelectProps>(
  ({ label, error, helperText, className, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || `forge-select-${generatedId}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-forge-text">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border-2 border-forge-border bg-forge-surface-elevated px-4 pr-10 text-forge-text focus:border-forge-primary focus:outline-none",
              error && "border-forge-danger",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-text-muted" />
        </div>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-sm text-forge-danger">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-forge-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ForgeSelect.displayName = "ForgeSelect";
