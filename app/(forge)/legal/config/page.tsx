"use client";

import { useKnowledgePackInfo } from "@/hooks/useLegal";
import { PracticeAreaConfig } from "@/components/legal/PracticeAreaConfig";
import { PracticeAreaChipGroup } from "@/components/legal/PracticeAreaChipGroup";

export default function LegalForgeConfigPage() {
  const { info, loading } = useKnowledgePackInfo("do");

  if (loading) return <p>Cargando...</p>;
  if (!info) return <p className="text-red-600">No se pudo cargar info del knowledge pack</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-medium">Configuración Legal Core</h2>

      <div className="bg-white rounded-lg shadow border p-5">
        <PracticeAreaConfig activeAreas={info.practice_areas_covered ?? []} />
      </div>

      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="font-medium mb-3">Knowledge Pack — Jurisdicción {(info.jurisdiction ?? 'do').toUpperCase()}</h3>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Versión</dt>
            <dd className="font-mono">{(info.version ?? 'N/A')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Estado</dt>
            <dd>
              {(info.verification_status ?? info.status) === "verified" ? (
                <span className="text-green-700 font-medium">✓ Verified</span>
              ) : (
                <span className="text-amber-700 font-medium">⚠️ {info.verification_status ?? info.status ?? 'unknown'}</span>
              )}
            </dd>
          </div>
          {info.verified_by && (
            <div>
              <dt className="text-slate-500">Verificado por</dt>
              <dd>{info.verified_by}</dd>
            </div>
          )}
          {info.verified_at && (
            <div>
              <dt className="text-slate-500">Fecha verificación</dt>
              <dd>{new Date(info.verified_at).toLocaleDateString()}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">Hash SHA-256</dt>
            <dd className="font-mono text-xs">
              {(info.sha256_hash ?? info.pack_hash) && (info.sha256_hash ?? info.pack_hash).length > 32 ? `${(info.sha256_hash ?? info.pack_hash).slice(0, 32)}…` : ((info.sha256_hash ?? info.pack_hash) ?? "—")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Leyes codificadas</dt>
            <dd className="font-medium">{(info.leyes_codificadas_count ?? info.leyes_cargadas ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Artículos codificados</dt>
            <dd className="font-medium">{(info.articulos_codificados_count ?? info.articulos_cargados ?? 0)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-slate-500">Áreas de práctica</dt>
            <dd className="mt-1">
              <PracticeAreaChipGroup tags={info.practice_areas_covered ?? []} maxVisible={12} size="sm" />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
