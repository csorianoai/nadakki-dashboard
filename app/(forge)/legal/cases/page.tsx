"use client";

import Link from "next/link";
import { CaseList } from "@/components/legal/cases/CaseList";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
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
    <main id="main-content" className="min-h-0 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.nav.cases}</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">{m.list.title}</h1>
        </div>
        <Link
          href="/legal/cases/new"
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          {m.list.create_button}
        </Link>
      </header>
      {isError ? (
        <LegalErrorState message={m.list.error} onRetry={() => void refetch()} />
      ) : (
        <CaseList cases={data?.cases ?? []} loading={isLoading} error={null} />
      )}
    </main>
  );
}
