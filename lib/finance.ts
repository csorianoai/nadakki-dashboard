/** Nadakki Auto finance helpers — README §6.1 / §6.4. Do not alter formulas. */

export const RATE = 0.135;
export const DOP = 58.5;

export function cuota(price: number, downPct: number, term: number): number {
  const principal = price * (1 - downPct / 100);
  const r = RATE / 12;
  if (term <= 0 || r <= 0) return 0;
  return (principal * r) / (1 - (1 + r) ** -term);
}

export function isEligible(
  price: number,
  initial: number,
  maxMonthly: number,
  term = 60,
): boolean {
  const down = Math.min(90, Math.max(5, (initial / price) * 100));
  return cuota(price, down, term) <= maxMonthly && initial <= price * 0.9;
}

export function priceStatus(
  badge: string | undefined,
  match: number,
): "excelente" | "justo" | "sobre" {
  if (badge?.includes("Excelente")) return "excelente";
  if (match < 80) return "sobre";
  return "justo";
}
