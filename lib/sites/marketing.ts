/**
 * Datos del panel de marketing del Resumen de «Mi web» (BC-04). Solo APIs que ya existen:
 *  - Contactos: listLeads (lib/sites/client.ts:123, GET /sites/{id}/leads, C-SITES-LEADS 1.1.0).
 *  - Ads, conexión: getGoogleAdsTenantReadiness (lib/api/googleAdsTenantReadiness.ts:55).
 *  - Ads, cuentas y métricas: /google-ads/accounts y /google-ads/metrics, los mismos que usa
 *    components/google-ads/MetricasGoogleAds.tsx:35 y :69 (routers/google_ads_metrics_router.py).
 * GA4: el backend no tiene lectura (medido 18-nov-2026), así que no hay función que devuelva cifras.
 * El sitio público no se enlaza: el contrato Site (C-SITES-ADMIN-API) no trae su dirección.
 */
import { apiFetch } from "@/lib/api/fetch-client";
import { getGoogleAdsTenantReadiness } from "@/lib/api/googleAdsTenantReadiness";
import { listLeads } from "./client";
import type { Bi } from "./copy-util";

export const MKT: Record<string, Bi> = {
  title: { es: "Marketing de tu web", en: "Your website's marketing" },
  loading: { es: "Cargando…", en: "Loading…" },
  contactsTitle: { es: "Contactos de la web", en: "Website contacts" },
  contactsTotal: { es: "Total", en: "Total" },
  contacts7: { es: "Últimos 7 días", en: "Last 7 days" },
  contacts30: { es: "Últimos 30 días", en: "Last 30 days" },
  contactsMore: { es: "o más (se muestran los primeros 1.000)", en: "or more (first 1,000 shown)" },
  contactsError: { es: "No pudimos leer los contactos ahora.", en: "We couldn't read the contacts right now." },
  contactsLink: { es: "Ver contactos", en: "See contacts" },
  adsTitle: { es: "Google Ads (últimos 30 días)", en: "Google Ads (last 30 days)" },
  adsSpend: { es: "Gasto", en: "Spend" },
  adsClicks: { es: "Clics", en: "Clicks" },
  adsImpr: { es: "Impresiones", en: "Impressions" },
  adsConv: { es: "Conversiones", en: "Conversions" },
  adsConnect: { es: "Google Ads no está conectado para esta cuenta.", en: "Google Ads isn't connected for this account." },
  adsConnectLink: { es: "Conectar Google Ads", en: "Connect Google Ads" },
  adsPick: { es: "Tienes varias cuentas de Google Ads: elige una en la pantalla de Google Ads.", en: "You have several Google Ads accounts: pick one on the Google Ads screen." },
  adsNoTenant: { es: "No hay una cuenta de Nadakki activa en la sesión.", en: "There's no active Nadakki account in this session." },
  adsError: { es: "No pudimos leer Google Ads ahora.", en: "We couldn't read Google Ads right now." },
  adsLink: { es: "Abrir Google Ads", en: "Open Google Ads" },
  gaTitle: { es: "Analytics: próximamente", en: "Analytics: coming soon" },
  gaBody: { es: "Nadakki aún no lee Google Analytics 4. Mientras tanto, consulta tus visitas en Google Analytics.", en: "Nadakki doesn't read Google Analytics 4 yet. Meanwhile, check your visits in Google Analytics." },
  gaLink: { es: "Abrir Google Analytics", en: "Open Google Analytics" },
  demo: { es: "Modo demostración: aquí no se muestran cifras.", en: "Demo mode: no figures are shown here." },
};

export const ENLACES = {
  contactos: "/mi-web/contactos",
  googleAds: "/advertising/google-ads",
  conectar: "/marketing/social-connections",
  analytics: "https://analytics.google.com/",
} as const;

const PAGINAS = 10;
const POR_PAGINA = 100;
const DIA = 86_400_000;

export interface Contactos { total: number; d7: number; d30: number; completo: boolean }

/** Cuenta contactos por fecha de creación; lee como mucho 1.000 (10 páginas de 100). */
export async function cargarContactos(siteId: string, ahora: number = Date.now()): Promise<Contactos> {
  const fechas: number[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < PAGINAS; i++) {
    const p = await listLeads(siteId, { limit: POR_PAGINA, ...(cursor ? { cursor } : {}) });
    for (const l of p.items) fechas.push(Date.parse(l.created_at));
    if (!p.next_cursor) return contar(fechas, ahora, true);
    cursor = p.next_cursor;
  }
  return contar(fechas, ahora, false);
}

function contar(fechas: number[], ahora: number, completo: boolean): Contactos {
  const desde = (dias: number) => fechas.filter((f) => Number.isFinite(f) && f >= ahora - dias * DIA).length;
  return { total: fechas.length, d7: desde(7), d30: desde(30), completo };
}

export interface Totales { cost_micros: number; clicks: number; impressions: number; conversions: number; moneda: string | null }
export type Ads =
  | { k: "sin-tenant" } | { k: "sin-conexion" } | { k: "elegir-cuenta" } | { k: "ok"; t: Totales };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

class ErrorAds extends Error {}

async function leer(url: string): Promise<{ status: number; body: unknown }> {
  const r = await apiFetch(url, { headers: { Accept: "application/json" } });
  return { status: r.status, body: r.ok ? await r.json().catch(() => null) : null };
}

/** Estado de conexión y totales de 30 días del tenant de la sesión (nunca de la URL). */
export async function cargarAds(tenantId: string | null): Promise<Ads> {
  if (!tenantId) return { k: "sin-tenant" };
  const rd = await getGoogleAdsTenantReadiness(tenantId);
  if (rd.ok === false) throw new ErrorAds(rd.error);
  if (!rd.data.api_connected || rd.data.overall_status === "disconnected") return { k: "sin-conexion" };
  const base = `/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads`;
  const ac = await leer(`${base}/accounts`);
  if (ac.status === 409) return { k: "sin-conexion" };
  const lista = (ac.body as { data?: { accounts?: unknown } } | null)?.data?.accounts;
  if (!Array.isArray(lista)) throw new ErrorAds("accounts");
  const elegibles = lista.filter(
    (c) => c && c.readable === true && c.manager === false && /^\d{10}$/.test(String(c.customer_id)),
  ) as Array<{ customer_id: string; currency_code: string | null }>;
  if (elegibles.length === 0) return { k: "sin-conexion" };
  if (elegibles.length > 1) return { k: "elegir-cuenta" };
  const q = new URLSearchParams({ customer_id: elegibles[0].customer_id, date_range: "LAST_30_DAYS" });
  const me = await leer(`${base}/metrics?${q}`);
  if (me.status === 409) return { k: "sin-conexion" };
  const camp = (me.body as { data?: { campaigns?: unknown } } | null)?.data?.campaigns;
  if (!Array.isArray(camp)) throw new ErrorAds("metrics");
  const t: Totales = { cost_micros: 0, clicks: 0, impressions: 0, conversions: 0, moneda: elegibles[0].currency_code ?? null };
  for (const c of camp as Array<Record<string, unknown>>) {
    t.cost_micros += num(c.cost_micros); t.clicks += num(c.clicks);
    t.impressions += num(c.impressions); t.conversions += num(c.conversions);
  }
  return { k: "ok", t };
}
