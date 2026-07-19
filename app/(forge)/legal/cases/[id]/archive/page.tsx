"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { postArchive } from "@/lib/legal/cases/legal-cases-api";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

export default function LegalCaseArchivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const m = useLegalCasesMessages();
  const router = useRouter();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error } = useLegalCase(effectiveTenantId, id);
  const mut = useMutation({
    mutationFn: () => postArchive(effectiveTenantId!, id, { reason: "Archivado desde portal legal" }),
    onSuccess: () => {
      router.push("/legal/cases");
    },
  });

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeGray-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      {mut.error ? (
        <LegalApiErrorPanel title="No se pudo archivar" error={mut.error} />
      ) : null}
      <section className="rounded-forge-md border border-forgeDanger-200 bg-forgeDanger-50 p-6 text-sm text-forgeGray-900">
        <h2 className="text-lg font-semibold">{m.archive.title}</h2>
        <p className="mt-2">{m.archive.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-forge-sm px-4 py-2 text-sm ring-1 ring-forgeGray-200"
            onClick={() => router.push(`/legal/cases/${id}`)}
          >
            {m.archive.back}
          </button>
          <button
            type="button"
            disabled={mut.isPending}
            className="rounded-forge-sm bg-forgeDanger-600 px-4 py-2 text-sm font-medium text-forgeGray-50 disabled:opacity-50"
            onClick={() => mut.mutate()}
          >
            {m.archive.confirm}
          </button>
        </div>
      </section>
    </main>
  );
}
