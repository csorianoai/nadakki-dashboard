"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./Checkbox";

export interface ConsentCaptureProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name for the consent control (visible copy lives in `children`). */
  consentAriaLabel: string;
  /** Visible consent copy (plain text or rich layout from caller). */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ConsentCapture({
  checked,
  onCheckedChange,
  consentAriaLabel,
  children,
  disabled,
  className,
}: ConsentCaptureProps) {
  return (
    <div className={cn("rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4", className)}>
      <div className="flex gap-3">
        <Checkbox
          aria-label={consentAriaLabel}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="shrink-0 pt-0.5"
        />
        <div className="min-w-0 text-forge-sm leading-relaxed text-forgeInk-700">{children}</div>
      </div>
    </div>
  );
}
