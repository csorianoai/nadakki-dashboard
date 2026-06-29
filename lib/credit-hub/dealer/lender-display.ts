/** Human-readable lender names for ranking / offer cards. */
const LENDER_NAMES: Record<string, string> = {
  banco_popular_dr: "Banco Popular Dominicano",
  banreservas: "Banreservas",
  scotiabank_dr: "Scotiabank RD",
  banco_bhd: "BHD León",
  bhd: "BHD León",
  popular: "Banco Popular Dominicano",
};

export function lenderDisplayName(code: string, fallback?: string | null): string {
  const key = code.trim().toLowerCase().replace(/\s+/g, "_");
  if (LENDER_NAMES[key]) return LENDER_NAMES[key];
  if (fallback?.trim()) return fallback.trim();
  return code
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Simple fit score from approval rate + speed (dealer "a quién enviar"). */
export function computeBankFitScore(row: {
  approval_rate: number | null;
  avg_response_hours: number | null;
  offer_count: number;
}): number {
  const appr = row.approval_rate ?? 0;
  const speed = row.avg_response_hours != null ? Math.max(0, 1 - row.avg_response_hours / 72) : 0.5;
  const volume = Math.min(row.offer_count / 10, 1);
  return Math.round((appr * 0.5 + speed * 0.35 + volume * 0.15) * 100);
}
