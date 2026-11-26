"use client";
import { use } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { EstudioGenioPanel } from "@/components/legal/cases/EstudioGenioPanel";
import { errorGenio } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
export default function EstudioGenioPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = use(params);
    const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
    const c = useLegalCase(effectiveTenantId, id);
    if (!tenantHydrated || c.isLoading)
        return <p role="status">{m.loading}</p>;
    if (!effectiveTenantId || tenantError)
        return <p role="alert">{m.tenant}</p>;
    if (c.error || !c.data)
        return <div role="alert">{errorGenio(c.error)} <button onClick={() => void c.refetch()}>{m.retry}</button></div>;
    return <main id="main-content" className="space-y-6"><CaseDetailHeader legalCase={c.data}/><EstudioGenioPanel key={`${effectiveTenantId}:${id}`} tenantId={effectiveTenantId} caseId={id}/></main>;
}
