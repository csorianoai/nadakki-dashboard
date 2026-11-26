"use client";

import Link from "next/link";
import { useState } from "react";
import { ImportarExpedientes } from "@/components/legal/importacion/ImportarExpedientes";
import { CaseList } from "@/components/legal/cases/CaseList";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function LegalCasesListPage() {
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data, isLoading, isError, refetch } = useLegalCases(effectiveTenantId);
  const [importando, setImportando] = useState(false);

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
      <header data-compacto="" className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.list.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setImportando((v) => !v)}
          aria-expanded={importando}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Importar carpeta
        </button>
        <Link
          href="/legal/cases/new"
          className="inline-flex items-center rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {m.list.create_button}
        </Link>
        </div>
      </header>
      {importando && effectiveTenantId && (
        <ImportarExpedientes tenantId={effectiveTenantId} onCerrar={() => setImportando(false)} />
      )}
      <CaseList tenantId={effectiveTenantId} cases={data?.cases ?? []} loading={isLoading} error={isError} onRetry={() => void refetch()} />
    </main>
  );
}
