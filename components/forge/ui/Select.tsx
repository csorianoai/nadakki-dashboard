"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helper?: ReactNode;
  error?: string;
  fieldKey?: string;
  options: SelectOption[];
}

export function Select({ label, helper, error, fieldKey, options, className, id, disabled, ...props }: SelectProps) {
  const autoId = useId();
  const sid = id ?? props.name ?? autoId;
  return (
    <div className="flex w-full flex-col gap-1.5" data-wizard-field={fieldKey}>
      {label ? (
        <label
          htmlFor={sid}
          className={cn(
            "text-forge-sm font-medium",
            disabled ? "cursor-not-allowed text-forgeGray-400" : "text-forgeGray-700"
          )}
        >
          {label}
        </label>
      ) : null}
      <select
        id={sid}
        disabled={disabled}
        className={cn(
          "min-h-10 w-full rounded-forge-sm border bg-forgeSurface-card px-3 py-2 text-forge-sm outline-none transition-[border-color,background-color] duration-[var(--forge-duration-fast)] ease-out focus-visible:border-forgeBrand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          error ? "border-forgeDanger-500" : "border-forgeGray-200",
          !error && !disabled && "hover:border-forgeGray-300 hover:bg-forgeSurface-sunken/50",
          disabled && "cursor-not-allowed border-forgeGray-100 bg-forgeGray-50 text-forgeGray-400",
          !disabled && "text-forgeGray-800",
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${sid}-err` : helper ? `${sid}-help` : undefined}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && !error ? (
        <p id={`${sid}-help`} className="text-forge-xs text-forgeGray-500">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${sid}-err`} className="text-forge-xs text-forgeDanger-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
