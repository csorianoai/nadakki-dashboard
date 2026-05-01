"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-forge-md border border-dashed border-forgeInk-200 bg-forgeSurface-sunken p-8", className)}>
      <h3 className="font-display text-forge-md font-semibold text-forgeInk-800">{title}</h3>
      {description ? <p className="max-w-md text-forge-sm text-forgeInk-500">{description}</p> : null}
      {action ?? null}
    </div>
  );
}
