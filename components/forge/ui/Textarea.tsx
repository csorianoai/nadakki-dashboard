"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  maxLength?: number;
}

export function Textarea({ label, helper, error, maxLength, className, id, value, defaultValue, ...props }: TextareaProps) {
  const tid = id ?? props.name;
  const len = typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : undefined;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={tid} className="text-forge-sm font-medium text-forgeInk-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={tid}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          "min-h-[96px] w-full resize-y rounded-forge-sm border bg-forgeSurface-card px-3 py-2 text-forge-sm text-forgeInk-800 outline-none transition-colors duration-[var(--forge-duration-fast)] placeholder:text-forgeInk-400 focus-visible:border-forgeBrand-500 focus-visible:ring-2 focus-visible:ring-forgeBrand-500 focus-visible:ring-offset-2",
          error ? "border-forgeDanger-500" : "border-forgeInk-200",
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${tid}-err` : helper ? `${tid}-help` : maxLength ? `${tid}-count` : undefined}
        {...props}
      />
      <div className="flex justify-between gap-2">
        {helper && !error ? (
          <p id={`${tid}-help`} className="text-forge-xs text-forgeInk-500">
            {helper}
          </p>
        ) : (
          <span />
        )}
        {maxLength != null ? (
          <p id={`${tid}-count`} className="text-forge-xs text-forgeInk-400">
            {len ?? 0}/{maxLength}
          </p>
        ) : null}
      </div>
      {error ? (
        <p id={`${tid}-err`} className="text-forge-xs text-forgeDanger-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
