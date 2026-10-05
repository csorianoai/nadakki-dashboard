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
  /** "negocio" = fila "Estado del negocio" de la referencia v3; "mas" = resto de N6. */
  grupo: "negocio" | "mas";
  /** Unidad que acompana a la cifra (la cifra la da el backend). */
  unidad: string | null;
  /** Capability que decide el backend; null = no aplica todavia (sin endpoint). */
  capability: string | null;
  /** Por que no hay cifra hoy (tooltip), o null si esta conectada. */
  falta: string | null;
};

const t = (
  id: string, titulo: string, metricKey: string, grupo: TarjetaInicio["grupo"],
  unidad: string | null, capability: string | null, falta: string | null,
): TarjetaInicio => ({ id, titulo, metricKey, grupo, unidad, capability, falta });

/** Orden de la referencia v3. `falta` != null => "cifra no disponible", sin numero. */
export const TARJETAS_INICIO: TarjetaInicio[] = [
  t("stock", "Inventario", "inventory_units@1.0", "negocio", "unidades", "autos.inventory.list", null),
  t("capital", "Capital en inventario", "inventory_capital@1.0", "negocio", null, null, "Falta endpoint: suma de costos por dealer sobre el stock"),
  t("potencial", "Margen potencial", "potential_revenue@1.0 · gross_margin@1.0", "negocio", null, null, "Falta endpoint: precio de lista menos costo del stock, con cobertura"),
  t("leads", "Leads", "lead_count@1.0", "negocio", "leads", "autos.leads.crm", null),
  t("solicitudes", "Financiamiento", "financing_applications@1.0", "negocio", "solicitudes", "credit.applications.view", null),
  t("caja", "Caja / Cobranzas", "— (sin métrica en N6)", "negocio", null, null, "Falta métrica y endpoint de caja y cobranzas"),
  t("dias", "Días en inventario", "inventory_age_days@1.0", "mas", null, null, "Falta endpoint: promedio y máximo por dealer"),
  t("margen", "Margen bruto del mes", "gross_margin@1.0 · gross_margin_pct@1.0", "mas", null, null, "Falta endpoint: margen por dealer y mes"),
  t("respuesta", "Tiempo de respuesta a leads", "lead_response_time@1.0", "mas", null, null, "Falta endpoint: mediana de primer contacto"),
  t("conversion-leads", "Conversión de leads", "lead_conversion_rate@1.0", "mas", null, null, "Falta endpoint: tasa calculada en el backend"),
  t("ofertas", "Ofertas listas", "financing_offers_ready@1.0", "mas", null, null, "Falta endpoint: conteo por dealer"),
  t("fondeo", "Conversión a fondeo", "finance_conversion_rate@1.0", "mas", null, null, "Falta endpoint: DISBURSED por dealer (D-N6-3)"),
];

/** Secciones de la referencia sin fuente hoy: se pintan con su motivo, sin datos. */
export const SECCIONES_SIN_FUENTE = {
  brief: "Falta endpoint: brief del día (atención, oportunidades, riesgo) calculado sobre métricas versionadas",
  cola: "Falta endpoint: cola priorizada con umbral, recomendación y evidencia",
  salud: "Falta endpoint: cobertura y estado por área calculados en el backend",
  hoy: "Falta endpoint: no hay feed de actividad del dealer",
} as const;

export const CAPABILITIES_INICIO = TARJETAS_INICIO.map((t) => t.capability).filter((c): c is string => c !== null);
