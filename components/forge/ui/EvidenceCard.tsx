"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface EvidenceCardProps {
  title: string;
  body: ReactNode;
  sourceLabel: string;
  confidence?: "high" | "medium" | "low";
  className?: string;
}

const confidenceVariant: Record<NonNullable<EvidenceCardProps["confidence"]>, "success" | "warning" | "neutral"> = {
  high: "success",
  medium: "warning",
  low: "neutral",
};

export function EvidenceCard({ title, body, sourceLabel, confidence, className }: EvidenceCardProps) {
  return (
    <article
      className={cn(
        "cursor-default rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4 shadow-forge-xs ring-1 ring-forgeAccent-teal/15",
        "transition-shadow duration-100 ease-out motion-reduce:transition-none hover:shadow-forge-md",
        className
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-forge-sm font-semibold text-forgeInk-800">{title}</h3>
        {confidence ? (
          <Badge variant={confidenceVariant[confidence]}>{confidence} confidence</Badge>
        ) : null}
      </header>
      <div className="mt-3 text-forge-sm leading-relaxed text-forgeInk-700">{body}</div>
      <footer className="mt-3 border-t border-forgeInk-100 pt-3 text-forge-xs text-forgeInk-500">
        Source: <span className="font-forgeMono text-forgeInk-700">{sourceLabel}</span>
      </footer>
    </article>
  );
}
