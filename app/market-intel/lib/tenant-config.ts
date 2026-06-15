/** MEE tenant currency profiles — ported from design-system/mee/mee-data.jsx. */

export interface MeeTenant {
  cur: string;
  code: string;
  fx_to_usd: number;
  locale: string;
}

export const MEE_TENANTS: Record<string, MeeTenant> = {
  DO: { cur: "RD$", code: "DOP", fx_to_usd: 62, locale: "es-DO" },
  CO: { cur: "COP$", code: "COP", fx_to_usd: 4100, locale: "es-CO" },
  MX: { cur: "MX$", code: "MXN", fx_to_usd: 18, locale: "es-MX" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  DO: "🇩🇴",
  CO: "🇨🇴",
  MX: "🇲🇽",
};

export function getTenantByCountryIso(countryIso: string): MeeTenant {
  const key = countryIso.toUpperCase();
  return MEE_TENANTS[key] ?? MEE_TENANTS.DO;
}

export function countryFlag(iso: string): string {
  const key = iso.toUpperCase();
  if (COUNTRY_FLAGS[key]) return COUNTRY_FLAGS[key];
  if (key.length === 2) {
    const codePoints = [...key].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return iso;
}

export const COUNTRY_DISPLAY: Record<string, string> = {
  DO: "República Dominicana",
  CO: "Colombia",
  MX: "México",
};

export function countryDisplayName(iso: string): string {
  const key = iso.toUpperCase();
  return COUNTRY_DISPLAY[key] ?? key;
}
