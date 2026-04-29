import type { ReactNode } from "react";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <DemoBannerStrong />
      <div className="container mx-auto p-6 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Legal Intelligence</h1>
          <p className="text-slate-600 mt-1">
            Asistencia jurídica automatizada para departamentos legales institucionales
          </p>
        </header>
        <LegalDisclaimer />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
