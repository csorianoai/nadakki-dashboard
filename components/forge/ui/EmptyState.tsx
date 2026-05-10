"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Decorative icon (e.g. Lucide); wrapped with `aria-hidden`. */
  icon?: ReactNode;
  title: string;
  /** Heading level for the title (default 3). Use 2 after a page-level `h1` so the outline stays sequential. */
  titleLevel?: 2 | 3;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Passive positive framing (e.g. compliance “all clear”). */
  tone?: "default" | "success";
}

export function EmptyState({ icon, title, titleLevel = 3, description, action, className, tone = "default" }: EmptyStateProps) {
  const TitleTag = titleLevel === 2 ? "h2" : "h3";
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-forge-md border border-dashed p-8",
        tone === "success"
          ? "border-forgeSuccess-200 bg-forgeSuccess-50/80 text-forgeGray-800"
          : "border-forgeGray-200 bg-forgeSurface-sunken",
        className
      )}
    >
      {icon ? (
        <span className="text-forgeGray-500 [&>svg]:h-10 [&>svg]:w-10" aria-hidden>
          {icon}
        </span>
      ) : null}
      <TitleTag className="font-display text-forge-md font-semibold text-forgeGray-800">{title}</TitleTag>
      {description ? <p className="max-w-md text-forge-sm text-forgeGray-500">{description}</p> : null}
      {action ?? null}
    </div>
  );
}
