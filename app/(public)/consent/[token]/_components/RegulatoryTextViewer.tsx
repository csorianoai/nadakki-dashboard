"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

function regulatoryTitle(t: CreditHubTranslations, code: string): string {
  const map: Record<string, string> = {
    LEY_172_13: t.consent.public.regulatory_title_LEY_172_13,
    BURO: t.consent.public.regulatory_title_BURO,
    DATA_POLICY: t.consent.public.regulatory_title_DATA_POLICY,
  };
  return map[code] ?? code;
}

interface RegulatoryTextViewerProps {
  consentsRequired: string[];
  regulatoryTexts: Record<string, string>;
}

export function RegulatoryTextViewer({ consentsRequired, regulatoryTexts }: RegulatoryTextViewerProps) {
  const t = useTranslations();

  return (
    <section className="space-y-4" aria-labelledby="regulatory-heading">
      <h3 id="regulatory-heading" className="text-lg font-semibold text-white">
        {t.consent.public.consents_section_title}
      </h3>
      <div className="space-y-3">
        {consentsRequired.map((c) => {
          const title = regulatoryTitle(t, c);
          const text = regulatoryTexts[c] ?? "";
          return (
            <details key={c} className="overflow-hidden rounded-lg border border-slate-700">
              <summary className="cursor-pointer p-4 font-medium text-slate-100 hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                {title}
              </summary>
              <div className="max-h-96 overflow-y-auto border-t border-slate-800 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {text || "—"}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
