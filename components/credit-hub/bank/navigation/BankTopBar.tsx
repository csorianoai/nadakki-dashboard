"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { ForgeLogo } from "@/components/credit-hub/brand/ForgeLogo";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function BankTopBar() {
  const { tenantSlug } = useTenant();
  return (
    <header className="sticky top-0 z-30 border-b border-forge-border bg-forge-surface/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/credit-hub/bank" className="flex items-center gap-3">
          <ForgeLogo size="sm" />
          <div>
            <p className="font-display font-bold text-forge-text">Forge Banco</p>
            <p className="text-xs text-forge-text-muted">Decisiones crediticias auditables</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ForgeBadge tone="info" className="hidden sm:inline-flex">
            <Building2 className="mr-1 h-3 w-3" />
            Institución
          </ForgeBadge>
          {tenantSlug && <span className="rounded-md bg-forge-surface-elevated px-2 py-1 text-xs text-forge-text-muted">{tenantSlug}</span>}
        </div>
      </div>
    </header>
  );
}
