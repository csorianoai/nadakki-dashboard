/** AI features API — price confidence + vehicle history. */

import { autosFetch } from "@/lib/autos-consumer-api";

export type PriceConfidenceResult = {
  lo: number | null;
  mid: number | null;
  hi: number | null;
  top: number | null;
  pos: number | null;
  pctBetter: number | null;
  sampleCount: number | null;
  fromBackend: boolean;
};

export type VehicleHistoryResult = {
  events: Array<{ label: string; status: string }>;
  verifications: string[];
  fromBackend: boolean;
};

export async function getPriceConfidence(
  vehicleId: number | string,
  _priceFallback?: number,
): Promise<PriceConfidenceResult> {
  try {
    const res = await autosFetch<{
      price_lo_rd: number;
      price_mid_rd: number;
      price_hi_rd: number;
      price_top_rd: number;
      position_pct: number;
      pct_below_market: number;
      sample_count: number;
    }>("/api/v1/autos_ai/price_confidence", {
      method: "POST",
      body: JSON.stringify({ vehicle_id: String(vehicleId) }),
    });
    if (!res) throw new Error("empty");
    return {
      lo: res.price_lo_rd,
      mid: res.price_mid_rd,
      hi: res.price_hi_rd,
      top: res.price_top_rd,
      pos: res.position_pct,
      pctBetter: res.pct_below_market,
      sampleCount: res.sample_count,
      fromBackend: true,
    };
  } catch (error) {
    console.warn("Price confidence backend unavailable", error);
    return {
      lo: null,
      mid: null,
      hi: null,
      top: null,
      pos: null,
      pctBetter: null,
      sampleCount: null,
      fromBackend: false,
    };
  }
}

export async function getVehicleHistory(vehicleId: number | string): Promise<VehicleHistoryResult> {
  try {
    const res = await autosFetch<{
      events: Array<{ label: string; status: string }>;
      verifications: string[];
    }>(`/api/v1/autos_ai/vehicle_history/${vehicleId}`);
    if (!res) throw new Error("empty");
    return { ...res, fromBackend: true };
  } catch (error) {
    console.warn("Vehicle history backend unavailable", error);
    return {
      events: [],
      verifications: [],
      fromBackend: false,
    };
  }
}
