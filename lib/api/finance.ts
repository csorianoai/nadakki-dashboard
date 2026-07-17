/** Finance API for autos consumer. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { cuota, RATE } from "@/lib/finance";

export type FinanceCalculateResult = {
  monthly_payment_rd: number;
  financed_amount_rd: number;
  annual_rate: number;
  term_months: number;
  fromBackend: boolean;
};

const BANK_RATES: Record<string, number> = {
  credicefi: 0.135,
  piloto: 0.128,
  otro: 0.142,
};

function localCalculate(
  price: number,
  downPct: number,
  term: number,
  bankSlug: string,
): FinanceCalculateResult {
  const rate = BANK_RATES[bankSlug] ?? RATE;
  const principal = price * (1 - downPct / 100);
  const r = rate / 12;
  const monthly =
    term <= 0 || r <= 0 ? 0 : (principal * r) / (1 - (1 + r) ** -term);
  return {
    monthly_payment_rd: Math.round(monthly),
    financed_amount_rd: Math.round(principal),
    annual_rate: rate,
    term_months: term,
    fromBackend: false,
  };
}

export async function calculateFinance(
  price: number,
  downPct: number,
  term: number,
  bankSlug: string,
): Promise<FinanceCalculateResult> {
  try {
    const res = await autosFetch<{
      monthly_payment_rd: number;
      financed_amount_rd: number;
      annual_rate: number;
      term_months: number;
    }>("/api/v1/autos/finance/calculate", {
      method: "POST",
      body: JSON.stringify({
        price_rd: price,
        down_payment_pct: downPct,
        term_months: term,
        bank_slug: bankSlug,
      }),
    });
    if (!res) throw new Error("empty");
    return { ...res, fromBackend: true };
  } catch (error) {
    console.warn("Finance backend down, using local calc", error);
    return localCalculate(price, downPct, term, bankSlug);
  }
}

export async function createApplication(data: Record<string, unknown>): Promise<{ id?: string; fromBackend: boolean }> {
  try {
    const res = await autosFetch<{ id: string }>("/api/v1/autos/finance/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { id: res?.id, fromBackend: true };
  } catch (error) {
    console.warn("Application backend down", error);
    return { fromBackend: false };
  }
}

export async function matchApproval(): Promise<{ score?: number; fromBackend: boolean }> {
  try {
    const res = await autosFetch<{ match_score?: number }>("/api/v1/autos_ai/match_my_approval", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { score: res?.match_score, fromBackend: true };
  } catch {
    return { score: 87, fromBackend: false };
  }
}
