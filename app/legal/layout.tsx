import type { ReactNode } from "react";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";
import { LegalSubNav } from "@/components/legal/LegalSubNav";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 text-slate-900 dark:text-slate-100">
      <DemoBannerStrong />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LegalSubNav />
        <div className="mt-2">{children}</div>
        <div className="mt-8">
          <LegalDisclaimer />
        </div>
      </div>
    </div>
  );
}
