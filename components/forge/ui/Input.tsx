"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  helper?: ReactNode;
  error?: string;
  /** Content before the field (avoids clashing with HTML `prefix`). */
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function Input({ label, helper, error, prefix, suffix, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? props.name ?? autoId;
  const describedBy = error ? `${inputId}-err` : helper ? `${inputId}-help` : undefined;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-forge-sm font-medium text-forgeInk-700">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex min-h-10 w-full items-center rounded-forge-sm border bg-forgeSurface-card px-3 transition-colors duration-[var(--forge-duration-fast)]",
          error ? "border-forgeDanger-500" : "border-forgeInk-200 focus-within:border-forgeBrand-500 focus-within:ring-2 focus-within:ring-forgeBrand-500 focus-within:ring-offset-2"
        )}
      >
        {prefix ? <span className="mr-2 text-forgeInk-500">{prefix}</span> : null}
        <input
          id={inputId}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-2 text-forge-sm text-forgeInk-800 outline-none placeholder:text-forgeInk-400",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {suffix ? <span className="ml-2 text-forgeInk-500">{suffix}</span> : null}
      </div>
      {helper && !error ? (
        <p id={`${inputId}-help`} className="text-forge-xs text-forgeInk-500">
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
