"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  helper?: ReactNode;
  error?: string;
  /** Scroll target for wizard validation UX. */
  fieldKey?: string;
  /** Content before the field (avoids clashing with HTML `prefix`). */
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function Input({ label, helper, error, fieldKey, prefix, suffix, className, id, disabled, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? props.name ?? autoId;
  const describedBy = error ? `${inputId}-err` : helper ? `${inputId}-help` : undefined;
  return (
    <div className="flex w-full flex-col gap-1.5" data-wizard-field={fieldKey}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "text-forge-sm font-medium",
            disabled ? "cursor-not-allowed text-forgeGray-400" : "text-forgeGray-700"
          )}
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex min-h-10 w-full items-center rounded-forge-sm border bg-forgeSurface-card px-3 transition-[border-color,background-color] duration-[var(--forge-duration-fast)] ease-out",
          error ? "border-forgeDanger-500" : "border-forgeGray-200",
          !disabled &&
            "focus-within:border-forgeBrand-500 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forgeBrand-500",
          !error && !disabled && "hover:border-forgeGray-300 hover:bg-forgeSurface-sunken/50",
          disabled && "cursor-not-allowed border-forgeGray-100 bg-forgeGray-50"
        )}
      >
        {prefix ? <span className="mr-2 text-forgeGray-500">{prefix}</span> : null}
        <input
          id={inputId}
          disabled={disabled}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-2 text-forge-sm outline-none placeholder:text-forgeGray-400",
            disabled ? "cursor-not-allowed text-forgeGray-400" : "text-forgeGray-800",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {suffix ? <span className="ml-2 text-forgeGray-500">{suffix}</span> : null}
      </div>
      {helper && !error ? (
        <p id={`${inputId}-help`} className="text-forge-xs text-forgeGray-500">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-err`} className="text-forge-xs text-forgeDanger-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
