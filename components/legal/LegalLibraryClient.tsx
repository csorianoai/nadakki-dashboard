"use client";

import { LegalContentHonestyBadges } from "@/components/legal/LegalContentHonestyBadges";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

/** Library endpoints not mounted on production backend (probe 2026-07-19). */
export default function LegalLibraryClient() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-medium">Biblioteca legal</h2>
          <LegalContentHonestyBadges badges={["DEMO"]} />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Estado matriz: <strong>HUÉRFANO_BACKEND_NO_MONTADO</strong> —{" "}
          <code className="font-mono text-xs">GET /library/status</code> y{" "}
          <code className="font-mono text-xs">GET /library/search</code> responden 404 en producción.
        </p>
      </header>

      <LegalApiErrorPanel
        title="Biblioteca no expuesta en backend vivo"
        error={new Error('GET /api/v1/legal/library/status → 404 {"detail":"Not Found"}')}
        defectId="BD-007"
        hint="No se inventan documentos indexados. Cuando backend monte library, este panel consumirá el API real."
      />
    </div>
  );
}
