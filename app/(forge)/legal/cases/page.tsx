"use client";

import Link from "next/link";
import { CaseList } from "@/components/legal/cases/CaseList";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function LegalCasesListPage() {
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data, isLoading, isError, refetch } = useLegalCases(effectiveTenantId);

  if (!tenantHydrated || (!effectiveTenantId && !tenantError)) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        {m.list.loading}
      </p>
    );
  }
  if (!effectiveTenantId || tenantError) {
    return (
      <div className="space-y-3" role="alert">
        <p className="text-sm text-zinc-300">
          No pudimos identificar tu cuenta para cargar los expedientes. Vuelve al panel Legal e inténtalo de nuevo.
        </p>
        <Link href="/legal" className="text-sm text-violet-400 underline">
          Volver al panel Legal
        </Link>
      </div>
    );
  }

  return (
    <main id="main-content" className="min-h-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.list.title}</h1>
        </div>
        <Link
          href="/legal/cases/new"
          className="inline-flex items-center rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {m.list.create_button}
        </Link>
      </header>
      <CaseList tenantId={effectiveTenantId} cases={data?.cases ?? []} loading={isLoading} error={isError} onRetry={() => void refetch()} />
    </main>
  );
}
