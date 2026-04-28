"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { ForgeLogo } from "./ForgeLogo";

interface ForgeLoadingMarkProps {
  label?: string;
  className?: string;
}

export function ForgeLoadingMark({ label, className }: ForgeLoadingMarkProps) {
  const t = useTranslations();
  const resolved = label ?? t.forge.loading_mark;
  return (
    <div className={cn("inline-flex flex-col items-center gap-3 text-forge-text-muted", className)}>
      <ForgeLogo size="lg" className="animate-forge-pulse-slow" />
      <span className="text-sm">{resolved}</span>
    </div>
  );
}
