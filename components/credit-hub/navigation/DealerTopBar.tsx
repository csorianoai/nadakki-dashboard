"use client";

import Link from "next/link";
import { Calculator } from "lucide-react";
import { ForgeLogo } from "../brand/ForgeLogo";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function DealerTopBar() {
  const { tenantSlug } = useTenant();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-forge-border bg-forge-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/credit-hub/dealer" className="flex items-center gap-2">
            <ForgeLogo size="sm" />
            <span className="hidden font-display font-bold text-forge-text sm:inline">Forge</span>
          </Link>

          {tenantSlug && (
            <span className="hidden rounded-md bg-forge-surface-elevated px-2 py-1 text-xs text-forge-text-muted md:inline-block">
              {tenantSlug}
            </span>
          )}
        </div>

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <Link href="/credit-hub/dealer" className="text-forge-text transition-colors hover:text-forge-primary">
            {t.dealer.top_nav_dashboard}
          </Link>
          <Link
            href="/credit-hub/dealer/applications"
            className="text-forge-text transition-colors hover:text-forge-primary"
          >
            Solicitudes
          </Link>
          <Link
            href="/credit-hub/dealer/preapproval"
            className="inline-flex items-center gap-1.5 text-forge-text transition-colors hover:text-forge-primary"
          >
            <Calculator className="h-4 w-4" aria-hidden />
            {t.dealer.top_nav_simulator}
          </Link>
        </nav>
      </div>
    </header>
  );
}
