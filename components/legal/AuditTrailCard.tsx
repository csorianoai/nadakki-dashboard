import type { TrazabilidadAuditoria } from "@/lib/legal-api";

export function AuditTrailCard({ trazabilidad }: { trazabilidad: TrazabilidadAuditoria }) {
  const hashPreview =
    trazabilidad.knowledge_pack_hash && trazabilidad.knowledge_pack_hash.length > 24
      ? `${trazabilidad.knowledge_pack_hash.slice(0, 24)}…`
      : trazabilidad.knowledge_pack_hash ?? "—";

  const packLabel =
    trazabilidad.knowledge_pack_id != null || trazabilidad.knowledge_pack_version != null
      ? `${trazabilidad.knowledge_pack_id ?? "—"} v${trazabilidad.knowledge_pack_version ?? "—"}`
      : "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <h4 className="font-medium mb-2 flex items-center justify-between">
        <span>Trazabilidad de auditoría</span>
        {trazabilidad.knowledge_pack_verified ? (
          <span className="text-xs bg-green-100 text-green-900 px-2 py-0.5 rounded">✓ Pack verificado</span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">⚠️ Pack pendiente</span>
        )}
      </h4>
      <dl className="space-y-1 text-slate-700">
        <div className="flex gap-2">
          <dt className="text-slate-500 min-w-[140px]">Cadena de agentes:</dt>
          <dd className="font-mono text-xs">{(trazabilidad.cadena_agentes ?? []).join(" → ")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500 min-w-[140px]">Knowledge pack:</dt>
          <dd className="font-mono text-xs">{packLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500 min-w-[140px]">Hash:</dt>
          <dd className="font-mono text-xs">{hashPreview}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500 min-w-[140px]">Timestamp:</dt>
          <dd className="text-xs">{trazabilidad.timestamp}</dd>
        </div>
      </dl>
    </div>
  );
}
