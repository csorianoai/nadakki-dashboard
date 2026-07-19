"use client";

import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useJurisdictions, useKnowledgePackStatus } from "@/hooks/legal/useJurisdictions";
import { LegalPackStatusBadge } from "@/components/legal/LegalPackStatusBadge";
import { LegalContentHonestyBadges } from "@/components/legal/LegalContentHonestyBadges";
import { CASE_TYPE_LABELS } from "@/lib/legal/cases/case-type-labels";

function JurisdictionPackRow({ tenantId, code }: { tenantId: string; code: string }) {
  const pack = useKnowledgePackStatus(tenantId, code);
  const status = pack.data?.pack_status ?? pack.data?.jurisdiction;
  return (
    <tr className="border-t border-zinc-800">
      <td className="py-2 font-mono uppercase">{code}</td>
      <td className="py-2">
        <LegalPackStatusBadge status={status} />
      </td>
      <td className="py-2 font-mono text-xs">{pack.data?.pack_hash?.slice(0, 16) ?? "—"}…</td>
      <td className="py-2 tabular-nums">{pack.data?.leyes_cargadas ?? "—"}</td>
    </tr>
  );
}

export default function LegalConfigClient() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const jurisdictions = useJurisdictions(effectiveTenantId);
  const doPack = useKnowledgePackStatus(effectiveTenantId, "do");

  if (!tenantHydrated) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-red-400">{tenantError ?? "Tenant no disponible"}</p>;
  }

  const caseTypes = Object.entries(CASE_TYPE_LABELS);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-medium">Configuración Legal Core</h2>
        <p className="mt-1 text-sm text-zinc-500">Manifest real desde knowledge-pack y jurisdicciones expuestas.</p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="font-medium mb-2">Knowledge pack activo (DO)</h3>
        <LegalContentHonestyBadges
          badges={
            (doPack.data?.pack_status ?? "").toLowerCase() === "verified" ? [] : ["DRAFT"]
          }
        />
        <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-zinc-400">Estado</dt>
            <dd className="mt-1">
              <LegalPackStatusBadge status={doPack.data?.pack_status} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Hash</dt>
            <dd className="font-mono text-xs">{doPack.data?.pack_hash ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Leyes cargadas</dt>
            <dd>{doPack.data?.leyes_cargadas ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Artículos L1</dt>
            <dd>{doPack.data?.articulos_level_1 ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 overflow-x-auto">
        <h3 className="font-medium mb-3">Jurisdicciones indexadas</h3>
        <table className="w-full text-sm text-left">
          <thead className="text-zinc-400 text-xs uppercase">
            <tr>
              <th className="pb-2">Código</th>
              <th className="pb-2">Pack</th>
              <th className="pb-2">Hash</th>
              <th className="pb-2">Leyes</th>
            </tr>
          </thead>
          <tbody>
            {(jurisdictions.jurisdictions ?? []).map((j) => (
              <JurisdictionPackRow key={j.code} tenantId={effectiveTenantId} code={j.code} />
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="font-medium mb-3">Tipos de expediente (case_types) — portal</h3>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          {caseTypes.map(([value, label]) => (
            <li key={value} className="flex items-center justify-between gap-2 rounded border border-zinc-800 px-3 py-2">
              <span>{label}</span>
              <code className="text-xs text-zinc-500">{value}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
