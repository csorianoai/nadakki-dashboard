"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

interface OtpInputFieldProps {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}

export function OtpInputField({ value, onChange, error }: OtpInputFieldProps) {
  const t = useTranslations();

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4" aria-labelledby="otp-heading">
      <h3 id="otp-heading" className="text-lg font-semibold text-white">
        {t.consent.public.otp_section_title}
      </h3>
      <p className="text-sm text-slate-300">{t.consent.public.otp_explanation}</p>

      <div>
        <label htmlFor="public-consent-otp" className="mb-1 block text-sm font-medium text-slate-300">
          {t.consent.public.otp_input_label}
        </label>
        <input
          id="public-consent-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-14 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-center text-2xl tabular-nums tracking-widest text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          data-testid="otp-input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "otp-err" : undefined}
        />
      </div>

      {error ? (
        <p id="otp-err" className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
