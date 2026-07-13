"use client";

import { useSearchParams } from "next/navigation";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import Link from "next/link";

export default function CockpitFinanceTenantClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const highlightedCore = searchParams.get("highlighted_core");

  return (
    <div className="space-y-6" data-testid="finance-tenant-stub">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">
          Tenant: <strong>{slug}</strong>
          {highlightedCore ? (
            <>
              {" "}
              · core: <code className="font-mono">{highlightedCore}</code>
            </>
          ) : null}
        </p>
      </header>
      <FinanceSubNav />
      <p className="rounded-xl border border-cockpit-border bg-cockpit-surface p-6 text-sm text-cockpit-muted">
        Vista consolidada del tenant — pendiente F6. Drill-down desde matriz registrado.
      </p>
      <Link href="/cockpit/finance/matrix" className="text-sm text-cockpit-accent hover:underline">
        ← Volver a matriz
      </Link>
    </div>
  );
}
