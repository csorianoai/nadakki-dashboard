"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  /** Heading level for the title (default 3). Use 2 after a page-level `h1` so the outline stays sequential. */
  titleLevel?: 2 | 3;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, titleLevel = 3, description, action, className }: EmptyStateProps) {
  const TitleTag = titleLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-forge-md border border-dashed border-forgeInk-200 bg-forgeSurface-sunken p-8", className)}>
      <TitleTag className="font-display text-forge-md font-semibold text-forgeInk-800">{title}</TitleTag>
      {description ? <p className="max-w-md text-forge-sm text-forgeInk-500">{description}</p> : null}
      {action ?? null}
    </div>
  );
}
