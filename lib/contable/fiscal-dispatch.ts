/**
 * Despacho fiscal por pais del tenant (backend #1497, FISCAL-DISPATCH).
 *
 * Medido sobre `origin/main` de nadakki-ai-suite, commit fad45670:
 *
 *   services/contable/fiscal_dispatch.py:30-39   fiscal_pack_for_country
 *   services/contable/fiscal_dispatch.py:36      raise FiscalDispatchError("AR_NOT_CONFIGURED", "AR")
 *   services/contable/fiscal_dispatch.py:51-68   require_rd_fiscal
 *   routers/contable/fiscal_rd_router.py:24-28   dependencies=[Depends(require_rd_fiscal)]
 *
 * La dependencia cubre TODO el prefijo /api/v1/contable/fiscal, asi que los seis
 * endpoints de NCF y DGII 606/607 responden igual. Forma exacta del error, de
 * `require_rd_fiscal`:
 *
 *   HTTP 409  {"detail": {"error": "<codigo>", "country": "<pais|null>"}}
 *
 * Y los cuatro codigos posibles: AR_NOT_CONFIGURED (pais AR),
 * FISCAL_COUNTRY_NOT_CONFIGURED (tenant sin pais), FISCAL_COUNTRY_UNSUPPORTED
 * (pais sin paquete) y TENANT_NOT_FOUND.
 *
 * AR_NOT_CONFIGURED no es un fallo: es la respuesta correcta para un tenant
 * argentino, porque la facturacion electronica de AR se gestiona en ARCA y fuera
 * de esta plataforma. "ARCA" no existe en el backend a proposito --es texto de
 * UI-- y por eso el mapeo vive aqui. Pintarlo como error tecnico, con su 409 y
 * su codigo, le diria al dealer que algo se rompio cuando no se rompio nada.
 */

import { apiFetch } from "@/lib/api/fetch-client";

export const FISCAL_PATH = "/api/v1/contable/fiscal/documents";

export const FISCAL_DISPATCH_CODES = {
  AR_NOT_CONFIGURED: "AR_NOT_CONFIGURED",
  FISCAL_COUNTRY_NOT_CONFIGURED: "FISCAL_COUNTRY_NOT_CONFIGURED",
  FISCAL_COUNTRY_UNSUPPORTED: "FISCAL_COUNTRY_UNSUPPORTED",
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
} as const;

/** El texto que pide producto, palabra por palabra. */
export const ARCA_TITULO = "Facturación electrónica: se gestiona en ARCA";

export const ARCA_DETALLE =
  "Para un tenant de Argentina, los comprobantes electrónicos se emiten en ARCA. Esta plataforma no los genera y no hay nada que configurar acá.";

export type EstadoFiscal =
  /** El paquete fiscal RD esta operativo: NCF y DGII 606/607. */
  | { tipo: "rd" }
  /** Tenant AR: informativo, NO es un error. */
  | { tipo: "arca"; titulo: string; detalle: string }
  /** El tenant no tiene pais fiscal configurado. Eso si hay que arreglarlo. */
  | { tipo: "sin_pais"; codigo: string }
  /** Pais con paquete fiscal sin construir todavia. */
  | { tipo: "pais_sin_paquete"; codigo: string; pais: string | null }
  /** Cualquier otra respuesta. Se muestra con su codigo, sin interpretarla. */
  | { tipo: "error"; codigo: string; status: number };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function texto(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Lee el cuerpo del 409. FastAPI envuelve el `detail`, asi que la forma real es
 * `{detail: {error, country}}`; se tolera tambien la forma plana por si algun
 * proxy la desenvuelve.
 */
export function leeCuerpoFiscal(body: unknown): { codigo: string | null; pais: string | null } {
  const raiz = record(body);
  if (!raiz) return { codigo: null, pais: null };
  const detalle = record(raiz.detail) ?? raiz;
  return {
    codigo: texto(detalle.error) ?? texto(detalle.reason_code),
    pais: texto(detalle.country),
  };
}

/**
 * Traduce la respuesta del backend a un estado de pantalla.
 *
 * Solo el 409 con AR_NOT_CONFIGURED se convierte en el aviso de ARCA. Un 409 con
 * otro codigo NO se disfraza de ARCA: un tenant sin pais fiscal tiene un
 * problema real de configuracion y decirle "se gestiona en ARCA" lo dejaria sin
 * arreglar.
 */
export function estadoFiscalDesdeRespuesta(status: number, body: unknown): EstadoFiscal {
  if (status >= 200 && status < 300) return { tipo: "rd" };

  const { codigo, pais } = leeCuerpoFiscal(body);

  if (status === 409 && codigo === FISCAL_DISPATCH_CODES.AR_NOT_CONFIGURED) {
    return { tipo: "arca", titulo: ARCA_TITULO, detalle: ARCA_DETALLE };
  }
  if (status === 409 && codigo === FISCAL_DISPATCH_CODES.FISCAL_COUNTRY_NOT_CONFIGURED) {
    return { tipo: "sin_pais", codigo };
  }
  if (status === 409 && codigo === FISCAL_DISPATCH_CODES.FISCAL_COUNTRY_UNSUPPORTED) {
    return { tipo: "pais_sin_paquete", codigo, pais };
  }
  return { tipo: "error", codigo: codigo ?? `HTTP_${status}`, status };
}

/** ARCA es informacion, no incidencia: la pantalla no debe pintarlo como fallo. */
export function esInformativo(estado: EstadoFiscal): boolean {
  return estado.tipo === "arca" || estado.tipo === "rd";
}

export async function fetchEstadoFiscal(tenantId: string): Promise<EstadoFiscal> {
  const response = await apiFetch(FISCAL_PATH, {
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return estadoFiscalDesdeRespuesta(response.status, body);
}
