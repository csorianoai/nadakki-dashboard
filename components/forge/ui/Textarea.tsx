"use client";

import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  maxLength?: number;
}

export function Textarea({
  label,
  helper,
  error,
  maxLength,
  className,
  id,
  value,
  defaultValue,
  disabled,
  ...props
}: TextareaProps) {
  const autoId = useId();
  const tid = id ?? props.name ?? autoId;
  const len = typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : undefined;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={tid}
          className={cn(
            "text-forge-sm font-medium",
            disabled ? "cursor-not-allowed text-forgeInk-400" : "text-forgeInk-700"
          )}
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={tid}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        className={cn(
          "min-h-[96px] w-full resize-y rounded-forge-sm border bg-forgeSurface-card px-3 py-2 text-forge-sm outline-none transition-[border-color,background-color] duration-[var(--forge-duration-fast)] ease-out placeholder:text-forgeInk-400 focus-visible:border-forgeBrand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          error ? "border-forgeDanger-500" : "border-forgeInk-200",
          !error && !disabled && "hover:border-forgeInk-300 hover:bg-forgeSurface-sunken/50",
          disabled && "cursor-not-allowed border-forgeInk-100 bg-forgeInk-50 text-forgeInk-400",
          !disabled && "text-forgeInk-800",
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
