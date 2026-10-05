/**
 * Datos del Command Center v2. SOLO fuentes que ya existen y estan montadas
 * (N6/N7, docs/decisions/N6_N7_METRIC_REGISTRY_Y_REPORTES.md en nadakki-ai-suite).
 * Lo demas queda "aun no disponible" con su sello, sin cifras.
 *
 * Calidad: si la respuesta trae `quality`, manda la del backend. Si no la trae
 * (hoy ninguna la trae), se usa la clasificacion FIRMADA en N6 para esa fuente,
 * y el tooltip lo dice.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import { calidadDesdeBackend, type Calidad } from "@/lib/dcc/calidad";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

export type Cifra = { valor: number; calidad: Calidad; nota: string };

/** D-N6-1 (firmada): stock = disponible + reservado. */
export const ESTADOS_STOCK = new Set(["disponible", "reservado"]);

function calidadDe(body: unknown, firmadaN6: Calidad): Calidad {
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  return rec && rec.quality !== undefined ? calidadDesdeBackend(rec.quality) : firmadaN6;
}

async function leerJson(path: string): Promise<unknown> {
  const response = await apiFetch(path, { headers: { Accept: "application/json" } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

function totalDe(body: unknown): number {
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const total = rec.total;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0) {
    throw new Error("DCC_RESPUESTA_SIN_TOTAL");
  }
  return total;
}

/** inventory_units@1.0 — N6: PARCIAL mientras el conteo se arme sobre la lista. */
export async function fetchUnidadesEnStock(dealerId: string): Promise<Cifra> {
  const vehiculos = await fetchDealerInventory(dealerId);
  const enStock = vehiculos.filter((v) => ESTADOS_STOCK.has((v.status ?? "").toLowerCase())).length;
  return {
    valor: enStock,
    calidad: {
      estado: "parcial",
      cubiertos: null,
      total: null,
      motivo: "Conteo armado sobre la lista del inventario; falta el conteo del backend por dealer",
    },
    nota: "Disponibles y reservadas",
  };
}

/** lead_count@1.0 — N6: VERIFICADA para el total historico por dealer. */
export async function fetchLeadsTotal(tenantId: string, dealerId: string): Promise<Cifra> {
  const body = await leerJson(
    `/api/v1/autos/tenants/${encodeURIComponent(tenantId)}/dealers/${encodeURIComponent(dealerId)}/leads?page=1&page_size=1`,
  );
  return { valor: totalDe(body), calidad: calidadDe(body, { estado: "verificado" }), nota: "Total histórico" };
}

/** financing_applications@1.0 — N6: VERIFICADA para el total del dealer via la lista. */
export async function fetchSolicitudesTotal(): Promise<Cifra> {
  const body = await leerJson("/api/v2/credit/applications?limit=1&offset=0");
  return { valor: totalDe(body), calidad: calidadDe(body, { estado: "verificado" }), nota: "Total histórico" };
}

export type TarjetaInicio = {
  id: string;
  titulo: string;
  metricKey: string;
  /** Capability que decide el backend; null = no aplica todavia (sin endpoint). */
  capability: string | null;
  /** Por que no hay cifra hoy (tooltip), o null si esta conectada. */
  falta: string | null;
};

/** Orden de la rejilla. `falta` != null => tarjeta "aun no disponible", sin cifra. */
export const TARJETAS_INICIO: TarjetaInicio[] = [
  { id: "stock", titulo: "Unidades en stock", metricKey: "inventory_units@1.0", capability: "autos.inventory.list", falta: null },
  { id: "capital", titulo: "Capital en inventario", metricKey: "inventory_capital@1.0", capability: null, falta: "Falta endpoint: suma de costos por dealer sobre el stock" },
  { id: "dias", titulo: "Días en inventario", metricKey: "inventory_age_days@1.0", capability: null, falta: "Falta endpoint: promedio y máximo por dealer" },
  { id: "potencial", titulo: "Ingreso potencial", metricKey: "potential_revenue@1.0", capability: null, falta: "Falta endpoint: suma de precios de lista del stock" },
  { id: "margen", titulo: "Margen bruto del mes", metricKey: "gross_margin@1.0 · gross_margin_pct@1.0", capability: null, falta: "Falta endpoint: margen por dealer y mes" },
  { id: "leads", titulo: "Leads", metricKey: "lead_count@1.0", capability: "autos.leads.crm", falta: null },
  { id: "respuesta", titulo: "Tiempo de respuesta a leads", metricKey: "lead_response_time@1.0", capability: null, falta: "Falta endpoint: mediana de primer contacto" },
  { id: "conversion-leads", titulo: "Conversión de leads", metricKey: "lead_conversion_rate@1.0", capability: null, falta: "Falta endpoint: tasa calculada en el backend" },
  { id: "solicitudes", titulo: "Solicitudes de crédito", metricKey: "financing_applications@1.0", capability: "credit.applications.view", falta: null },
  { id: "ofertas", titulo: "Ofertas listas", metricKey: "financing_offers_ready@1.0", capability: null, falta: "Falta endpoint: conteo por dealer" },
  { id: "fondeo", titulo: "Conversión a fondeo", metricKey: "finance_conversion_rate@1.0", capability: null, falta: "Falta endpoint: DISBURSED por dealer (D-N6-3)" },
  { id: "actividad", titulo: "Actividad reciente", metricKey: "—", capability: null, falta: "Falta endpoint: no hay feed de actividad del dealer" },
];

export const CAPABILITIES_INICIO = TARJETAS_INICIO.map((t) => t.capability).filter((c): c is string => c !== null);
