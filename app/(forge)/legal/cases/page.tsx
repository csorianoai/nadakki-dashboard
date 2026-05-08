"use client";

import { GeistSans } from "geist/font/sans";
import { CaseList } from "@/components/legal/cases/CaseList";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { cn } from "@/lib/utils";

export default function LegalCasesListPage() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data, isLoading, isError, error } = useLegalCases(effectiveTenantId);

  const shellcn = cn(GeistSans.className, "dark isolate mx-auto max-w-screen-2xl px-6 text-zinc-100");

  if (!tenantHydrated) {
    return (
      <main id="main-content" className="min-h-0">
        <div className={shellcn}>
          <p className="text-sm text-zinc-400" role="status" aria-live="polite">
            Cargando contexto multitenant…
          </p>
        </div>
      </main>
    );
  }
  if (!effectiveTenantId || tenantError) {
    return (
      <main id="main-content" className="min-h-0">
        <div className={shellcn}>
          <p className="text-sm text-orange-400" role="alert">
            {tenantError ?? "Cliente sin tenant activo disponible"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className={cn(shellcn, "min-h-[70vh]")}>
      <div className="rounded-[32px] border border-zinc-800/80 bg-zinc-950/95 p-8 shadow-2xl shadow-black/40 ring-1 ring-zinc-800/60 backdrop-blur-2xl">
        <CaseList cases={data?.cases ?? []} loading={isLoading} error={isError ? (error as Error) : null} />
      </div>
    </main>
  );
}
