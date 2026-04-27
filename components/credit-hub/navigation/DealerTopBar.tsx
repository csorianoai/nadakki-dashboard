"use client";

import Link from "next/link";
import { ForgeLogo } from "../brand/ForgeLogo";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function DealerTopBar() {
  const { tenantSlug } = useTenant();

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
            Dashboard
          </Link>
          <Link
            href="/credit-hub/dealer/applications"
            className="text-forge-text transition-colors hover:text-forge-primary"
          >
            Solicitudes
          </Link>
        </nav>
      </div>
    </header>
  );
}
