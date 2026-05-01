"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formatForgeDate } from "@/utils/forge-locale";

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  /** ISO date string `YYYY-MM-DD` for `type="date"`. */
  value: string;
  onValueChange: (isoDate: string) => void;
  locale: string;
  hint?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, value, onValueChange, locale, hint, error, className, id, disabled, ...props },
  ref
) {
  const gid = useId();
  const inputId = id ?? `date-${gid}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  const preview = value ? formatForgeDate(value, locale) : "";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-forge-sm font-medium text-forgeInk-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        type="date"
        disabled={disabled}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-forge-sm border bg-forgeSurface-card px-3 py-2 text-forge-sm text-forgeInk-800 shadow-forge-xs",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          error ? "border-forgeDanger-500" : "border-forgeInk-200"
        )}
        {...props}
      />
      {preview ? (
        <p className="text-forge-xs text-forgeInk-500" aria-live="polite">
          {preview}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-forge-xs text-forgeInk-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-forge-xs font-medium text-forgeDanger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
