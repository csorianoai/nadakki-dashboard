"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

interface SignatureFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function SignatureField({ value, onChange }: SignatureFieldProps) {
  const t = useTranslations();
  const today = new Date().toLocaleDateString("es-DO");

  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4" aria-labelledby="sig-heading">
      <h3 id="sig-heading" className="text-lg font-semibold text-white">
        {t.consent.public.signature_section_title}
      </h3>
      <p className="text-xs leading-relaxed text-slate-400">{t.consent.public.signature_explanation}</p>

      <div>
        <label htmlFor="public-consent-full-name" className="mb-1 block text-sm font-medium text-slate-300">
          {t.consent.public.full_name_label} <span className="text-rose-400">*</span>
        </label>
        <input
          id="public-consent-full-name"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.consent.public.full_name_placeholder}
          className="h-12 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          data-testid="signature-input"
          autoComplete="name"
          autoCapitalize="words"
        />
      </div>

      <p className="text-xs text-slate-500">
        {t.consent.public.today_date_label}{" "}
        <span className="tabular-nums">{today}</span>
      </p>
    </section>
  );
}
