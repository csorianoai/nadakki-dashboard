import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";

/** C-RE-OLA3 1.0.0 (congelado), C-RE-CAREER getMyCareer, solo lectura. El tenant y el usuario salen del token en el servidor: el cliente no envía ninguno. */
export const CAREER_ME_PATH = "/api/v1/realestate/career/me";

export type CareerMetric = { key: string; value: number | null };
export type CareerVolume = { kind: "sale" | "rental"; currency: string; count: number; total: string };
export type CareerAchievementKey = "first_closing" | "ten_closings" | "first_showing" | "hundred_showings";
export type CareerAchievement = { key: CareerAchievementKey; earnedAt: string };
export type CareerSummary = {
  period: { from: string; to: string };
  metrics: CareerMetric[];
  volume: CareerVolume[];
  achievements: CareerAchievement[];
};

const ACHIEVEMENTS: readonly CareerAchievementKey[] = ["first_closing", "ten_closings", "first_showing", "hundred_showings"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** CareerSummary → vista. Elementos inválidos se descartan; sin forma base devuelve null (fail-closed). NO_DISPONIBLE → value null, nunca 0. */
export function parseCareer(body: unknown): CareerSummary | null {
  if (!isObj(body) || !isObj(body.period) || !isStr(body.period.from) || !isStr(body.period.to)) return null;
  if (!Array.isArray(body.metrics) || !Array.isArray(body.closed_volume) || !Array.isArray(body.achievements)) return null;
  const metrics: CareerMetric[] = [];
  for (const m of body.metrics) {
    if (!isObj(m) || !isStr(m.key)) continue;
    if (m.quality === "OK" && typeof m.value === "number" && Number.isInteger(m.value) && m.value >= 0) metrics.push({ key: m.key, value: m.value });
    else if (m.quality === "NO_DISPONIBLE") metrics.push({ key: m.key, value: null });
  }
  const volume: CareerVolume[] = [];
  for (const v of body.closed_volume) {
    if (!isObj(v) || (v.kind !== "sale" && v.kind !== "rental") || !isStr(v.currency) || !isStr(v.total)) continue;
    if (typeof v.count !== "number" || v.count < 1) continue;
    volume.push({ kind: v.kind, currency: v.currency, count: v.count, total: v.total });
  }
  const achievements: CareerAchievement[] = [];
  for (const a of body.achievements) {
    const key = isObj(a) ? ACHIEVEMENTS.find((k) => k === a.key) : undefined;
    if (isObj(a) && key && isStr(a.earned_at)) achievements.push({ key, earnedAt: a.earned_at });
  }
  return { period: { from: body.period.from, to: body.period.to }, metrics, volume, achievements };
}

/** true si hay algún dato real: conteo disponible, volumen o logro. Todo vacío o NO_DISPONIBLE → «Sin datos todavía». */
export function hasData(c: CareerSummary): boolean {
  return c.metrics.some((m) => m.value !== null) || c.volume.length > 0 || c.achievements.length > 0;
}

/** 404, 503, red caída, cuerpo inválido o sin datos → null. */
export async function fetchCareer(): Promise<CareerSummary | null> {
  try {
    const res = await apiFetch(CAREER_ME_PATH, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
    if (res.status !== 200) return null;
    const c = parseCareer(await res.json());
    return c && hasData(c) ? c : null;
  } catch {
    return null;
  }
}
