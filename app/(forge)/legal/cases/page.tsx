"use client";

import Link from "next/link";
import { CaseList } from "@/components/legal/cases/CaseList";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function LegalCasesListPage() {
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data, isLoading, isError, error } = useLegalCases(effectiveTenantId);

  if (!tenantHydrated) {
    return <p className="text-sm text-forgeInk-500">Cargando tenant…</p>;
  }
  if (!effectiveTenantId || tenantError) {
    return (
      <p className="text-sm text-forgeDanger-700" role="alert">
        {tenantError ?? "Tenant no disponible para expedientes"}
      </p>
    );
  }

  return (
    <main id="main-content" className="min-h-0">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-forgeInk-900">{m.list.title}</h1>
        <Link
          href="/legal/cases/new"
          className="inline-flex items-center rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50 hover:bg-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          {m.list.create_button}
        </Link>
      </header>
      <CaseList cases={data?.cases ?? []} loading={isLoading} error={isError ? (error as Error) : null} />
    </main>
  );
}
