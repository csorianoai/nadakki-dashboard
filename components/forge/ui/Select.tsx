"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
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
  options: SelectOption[];
}

export function Select({ label, helper, error, options, className, id, ...props }: SelectProps) {
  const sid = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={sid} className="text-forge-sm font-medium text-forgeInk-700">
          {label}
        </label>
      ) : null}
      <select
        id={sid}
        className={cn(
          "min-h-10 w-full rounded-forge-sm border bg-forgeSurface-card px-3 py-2 text-forge-sm text-forgeInk-800 outline-none transition-colors duration-[var(--forge-duration-fast)] focus-visible:border-forgeBrand-500 focus-visible:ring-2 focus-visible:ring-forgeBrand-500 focus-visible:ring-offset-2",
          error ? "border-forgeDanger-500" : "border-forgeInk-200",
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
        <p id={`${sid}-help`} className="text-forge-xs text-forgeInk-500">
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
