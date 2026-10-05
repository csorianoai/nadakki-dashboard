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

export type Cifra = {
  valor: number;
  calidad: Calidad;
  nota: string;
  /** Solo inventario: filas que devolvio el backend y cuantas estan en borrador. */
  cargados?: number;
  borradores?: number;
};

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
  const estado = (v: { status: string | null }) => (v.status ?? "").toLowerCase();
  const enStock = vehiculos.filter((v) => ESTADOS_STOCK.has(estado(v))).length;
  const borradores = vehiculos.filter((v) => estado(v) === "draft").length;
  return {
    valor: enStock,
    calidad: {
      estado: "parcial",
      cubiertos: null,
      total: null,
      motivo: "Conteo armado sobre la lista del inventario; falta el conteo del backend por dealer",
    },
    // Distingue "sin stock cargado" de "stock cargado en borrador" (el importador
    // de la plantilla v4 puede crear vehiculos en `draft`, que no son stock).
    nota: `de ${vehiculos.length} cargados · ${borradores} en borrador`,
    cargados: vehiculos.length,
    borradores,
  };
}

/** lead_count@1.0 — N6: VERIFICADA para el total historico por dealer. */
export async function fetchLeadsTotal(tenantId: string, dealerId: string): Promise<Cifra> {
  const body = await leerJson(
    `/api/v1/autos/tenants/${encodeURIComponent(tenantId)}/dealers/${encodeURIComponent(dealerId)}/leads?page=1&page_size=1`,
  );
  return { valor: totalDe(body), calidad: calidadDe(body, { estado: "verificado" }), nota: "Total histórico" };
}

/** Fila de `GET .../dealers/{dealer_id}/leads` (solo los campos que se pintan). */
export type LeadDealer = {
  id: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  buyer_message: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  finance_interested: boolean | null;
  created_at: string | null;
};

export type PaginaLeads = { leads: LeadDealer[]; total: number; page: number; hasNext: boolean };

/** Lista paginada de leads del dealer: la misma ruta (tenant UUID) que `fetchLeadsTotal`. */
export async function fetchLeadsPagina(tenantId: string, dealerId: string, page = 1, pageSize = 20): Promise<PaginaLeads> {
  const body = await leerJson(
    `/api/v1/autos/tenants/${encodeURIComponent(tenantId)}/dealers/${encodeURIComponent(dealerId)}/leads?page=${page}&page_size=${pageSize}`,
  );
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (!Array.isArray(rec.leads)) throw new Error("DCC_RESPUESTA_SIN_LEADS");
  return { leads: rec.leads as LeadDealer[], total: totalDe(body), page, hasNext: rec.has_next === true };
}

/** "1 lead" / "N leads". */
export function textoLeads(n: number, fmt: (n: number) => string = String): string {
  return `${fmt(n)} ${n === 1 ? "lead" : "leads"}`;
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
  unidad: string | null;
  /** Capability que decide el backend; null = sin endpoint todavia. */
  capability: string | null;
  /** Por que no hay cifra hoy: SOLO para el tooltip. */
  falta: string | null;
};

/** Fila "Estado del negocio" de la referencia v3: seis KPI, en este orden. */
export const TARJETAS_INICIO: TarjetaInicio[] = [
  { id: "stock", titulo: "Inventario", metricKey: "inventory_units@1.0", unidad: "en stock", capability: "autos.inventory.list", falta: null },
  { id: "capital", titulo: "Capital", metricKey: "inventory_capital@1.0", unidad: null, capability: null, falta: "Falta endpoint: suma de costos por dealer sobre el stock" },
  { id: "margen", titulo: "Margen", metricKey: "gross_margin@1.0", unidad: null, capability: null, falta: "Falta endpoint: margen por dealer, con cobertura" },
  { id: "leads", titulo: "Leads", metricKey: "lead_count@1.0", unidad: "total", capability: "autos.leads.crm", falta: null },
  { id: "solicitudes", titulo: "Financiamiento", metricKey: "financing_applications@1.0", unidad: "solicitudes", capability: "credit.applications.view", falta: null },
  { id: "caja", titulo: "Caja", metricKey: "— (sin métrica en N6)", unidad: null, capability: null, falta: "Falta métrica y endpoint de caja y cobranzas" },
];

/** Motivo tecnico de cada seccion sin fuente: solo tooltip. */
export const SECCIONES_SIN_FUENTE = {
  cola: "Falta endpoint: cola priorizada con umbral, recomendación y evidencia",
  salud: "Falta endpoint: cobertura y estado por área calculados en el backend",
  hoy: "Falta endpoint: no hay feed de actividad del dealer",
} as const;

export const CAPABILITIES_INICIO = TARJETAS_INICIO.map((t) => t.capability).filter((c): c is string => c !== null);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La ruta de leads lleva el tenant en el path: tiene que ser el UUID, nunca el slug. */
export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

/** Detalle de un error para el tooltip: codigo HTTP y motivo si los hay. */
export function detalleDeError(error: unknown): string {
  const rec = error && typeof error === "object" ? (error as { status?: unknown; reason_code?: unknown; message?: unknown }) : {};
  const partes = [
    typeof rec.status === "number" ? `HTTP ${rec.status}` : null,
    typeof rec.reason_code === "string" ? rec.reason_code : null,
    typeof rec.message === "string" ? rec.message : null,
  ].filter((p, i, arr): p is string => Boolean(p) && arr.indexOf(p) === i);
  return partes.join(" · ") || "Error desconocido";
}

/**
 * Brief del dia DETERMINISTA: una frase hecha solo con las cifras que llegaron
 * del backend (sin estimar ni inferir). Sin ninguna cifra, devuelve null.
 */
export function briefDeterminista(cifras: { stock?: Cifra; leads?: Cifra; solicitudes?: Cifra }, fmt: (n: number) => string): string | null {
  const partes: string[] = [];
  if (cifras.stock) {
    const { valor, cargados, borradores } = cifras.stock;
    let frase = `${fmt(valor)} ${valor === 1 ? "unidad" : "unidades"} en stock`;
    if (cargados !== undefined && borradores) frase += ` (${fmt(borradores)} en borrador de ${fmt(cargados)} cargadas)`;
    partes.push(frase);
  }
  if (cifras.leads) partes.push(`${fmt(cifras.leads.valor)} ${cifras.leads.valor === 1 ? "lead" : "leads"} en total`);
  if (cifras.solicitudes) {
    const n = cifras.solicitudes.valor;
    partes.push(`${fmt(n)} ${n === 1 ? "solicitud" : "solicitudes"} de crédito`);
  }
  if (partes.length === 0) return null;
  const ultima = partes.pop() as string;
  return `Hoy tienes ${partes.length ? `${partes.join(", ")} y ${ultima}` : ultima}.`;
}
