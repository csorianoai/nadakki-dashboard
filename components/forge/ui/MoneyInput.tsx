"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formatForgeCurrency } from "@/utils/forge-locale";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  /** Amount in major units (e.g. dollars). */
  value: number;
  onValueChange: (value: number) => void;
  locale: string;
  currency: string;
  hint?: string;
  error?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, value, onValueChange, locale, currency, hint, error, className, id, disabled, ...props },
  ref
) {
  const gid = useId();
  const inputId = id ?? `money-${gid}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const display = formatForgeCurrency(Number.isFinite(value) ? value : 0, locale, currency);
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-forge-sm font-medium text-forgeInk-700">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          disabled={disabled}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onValueChange(Number.isFinite(v) ? v : 0);
          }}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-forge-sm border bg-forgeSurface-card px-3 py-2 pr-28 font-forgeMono text-forge-sm text-forgeInk-800 shadow-forge-xs",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
            error ? "border-forgeDanger-500" : "border-forgeInk-200"
          )}
          {...props}
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-2 flex max-w-[40%] items-center truncate text-forge-xs text-forgeInk-500"
          aria-hidden
        >
          {display}
        </span>
      </div>
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
