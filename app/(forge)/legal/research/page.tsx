import { Suspense } from "react";
import LegalResearchClient from "@/components/legal/LegalResearchClient";

export default function LegalForgeResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-forge-sm text-forgeGray-500">Cargando Research…</div>
      }
    >
      <LegalResearchClient />
    </Suspense>
  );
}
