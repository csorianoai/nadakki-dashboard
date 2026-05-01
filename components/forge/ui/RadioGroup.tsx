"use client";

import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  layout?: "inline" | "stacked";
  className?: string;
}

export function RadioGroup({ name, label, options, value, onChange, layout = "stacked", className }: RadioGroupProps) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      {label ? <legend className="text-forge-sm font-medium text-forgeInk-700">{label}</legend> : null}
      <div className={cn("flex gap-4", layout === "inline" ? "flex-row flex-wrap" : "flex-col")}>
        {options.map((o) => (
          <label key={o.value} className="inline-flex cursor-pointer items-center gap-2 text-forge-sm text-forgeInk-800">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange?.(o.value)}
              className="h-4 w-4 border-forgeInk-300 text-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
