"use client";

import { cn } from "@/lib/utils";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { ForgeLogo } from "./ForgeLogo";

interface ForgeWordmarkProps {
  className?: string;
}

export function ForgeWordmark({ className }: ForgeWordmarkProps) {
  const { tenantConfig } = useTenantConfig();

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <ForgeLogo size="sm" displayName={tenantConfig.institution_name} variant="full" />
    </div>
  );
}
