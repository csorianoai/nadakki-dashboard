import { Suspense } from "react";
import LegalResearchClient from "@/components/legal/LegalResearchClient";

export default function LegalResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Cargando Research…</div>
      }
    >
      <LegalResearchClient />
    </Suspense>
  );
}
