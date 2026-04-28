"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

interface ForgeAIBadgeProps {
  className?: string;
}

export function ForgeAIBadge({ className }: ForgeAIBadgeProps) {
  const t = useTranslations();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-forge-border bg-forge-surface-elevated px-3 py-1 text-xs font-medium text-forge-text",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-forge-accent" aria-hidden="true" />
      {t.forge.ai_badge}
    </span>
  );
}
