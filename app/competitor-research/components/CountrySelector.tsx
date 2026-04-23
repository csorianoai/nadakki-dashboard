"use client";

import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";

const CODES = ["US", "MX", "DO", "ES", "AR", "BR"] as const;

export type CountryCode = (typeof CODES)[number];

export function CountrySelector({
  value,
  onChange,
  lang,
  id = "cr-country",
}: {
  value: string;
  onChange: (c: string) => void;
  lang: UILang;
  id?: string;
}) {
  const t = crStrings(lang);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-400">
        {t.countryLabel}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
        aria-label={t.countryLabel}
      >
        {CODES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
