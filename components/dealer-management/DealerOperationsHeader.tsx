"use client";

import Link from "next/link";
import { Building2, Cable, Gauge } from "lucide-react";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { DEALER_TOKENS } from "@/lib/dealer-management/tokens";

export function DealerOperationsHeader() {
  const branding = useDealerManagementBranding();
  const displayName = branding.data?.display_name?.trim() || "Nadakki Dealer Management";

  return (
    <header className={DEALER_TOKENS.header} data-testid="dealer-operations-header">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-2/10 text-brand-2">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-manrope text-lg font-extrabold text-nk-fg">{displayName}</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-nk-fg-muted">
              Centro de Operaciones
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Estado del dealer">
          <Link href="/autos/dealer/conexiones" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nk-border px-3 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2">
            <Cable className="h-4 w-4" aria-hidden="true" />
            Conexiones
          </Link>
          <Link href="/autos/dealer/estado" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nk-border px-3 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Estado
          </Link>
        </nav>
      </div>
    </header>
  );
}
