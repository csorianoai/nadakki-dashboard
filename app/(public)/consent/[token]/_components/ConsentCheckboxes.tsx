"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

function checkboxLabel(t: CreditHubTranslations, code: string): string {
  const map: Record<string, string> = {
    LEY_172_13: t.consent.public.checkbox_LEY_172_13,
    BURO: t.consent.public.checkbox_BURO,
    DATA_POLICY: t.consent.public.checkbox_DATA_POLICY,
  };
  return map[code] ?? code;
}

interface ConsentCheckboxesProps {
  consents: string[];
  accepted: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}

export function ConsentCheckboxes({ consents, accepted, onChange }: ConsentCheckboxesProps) {
  const t = useTranslations();

  return (
    <fieldset className="space-y-3" data-testid="consent-checkboxes">
      <legend className="sr-only">{t.consent.public.consents_section_title}</legend>
      {consents.map((c) => {
        const id = `consent-cb-${c}`;
        return (
          <div key={c} className="flex items-start gap-3">
            <input
              id={id}
              type="checkbox"
              checked={accepted[c] ?? false}
              onChange={(e) => onChange({ ...accepted, [c]: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              data-testid={`consent-checkbox-${c.toLowerCase()}`}
            />
            <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-slate-200">
              {checkboxLabel(t, c)}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
