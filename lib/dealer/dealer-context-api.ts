/**
 * El dealer del usuario sale del BACKEND. El Local Storage es solo cache.
 *
 * Contrato publicado en backend #1501 y verificado en produccion
 * (api.nadakki.com/openapi.json) y en `origin/main`:
 *
 *   GET /api/v1/autos/me/dealer-context
 *   -> 200 {"assignments": [{dealer_id, organization_unit_id, dealer_name}]}
 *
 *   routers/autos_portal_router.py:983-1001   el handler
 *   routers/autos_portal_router.py:940-952    el SELECT con los tres campos
 *   services/access/route_registry.py:176     capability: autos.api.access
 *
 * El tenant y el usuario salen SOLO del token: el endpoint no acepta ninguno por
 * parametro. Y el backend NO ELIGE: con varias asignaciones devuelve todas, y con
 * ninguna devuelve 200 con lista vacia. Su propio docstring lo dice: "Un dealer
 * por defecto seria mostrarle el inventario de otro".
 *
 * Por que hace falta esto: `setDealerAccessContext`
 * (lib/dealer/access-context.ts:122) no tiene ningun llamador real, y el login
 * (contexts/AuthContext.tsx:100-112) solo guarda el tenant. Doce ficheros leen el
 * contexto del Local Storage y lo encuentran vacio, asi que
 * `resolveDealerAccessContext` devuelve `no_dealer` y las pantallas del dealer se
 * cierran solas. Esta es la pieza que lo rellena desde la fuente.
 *
 * Aqui NO se elige nunca. Con varias asignaciones se BORRA el binding y se
 * informa: elegir la primera es ensenarle a alguien el inventario de otro
 * concesionario.
 */

import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import { clearDealerAccessContext, setDealerAccessContext } from "@/lib/dealer/access-context";

export const DEALER_CONTEXT_PATH = "/api/v1/autos/me/dealer-context";

export type DealerAssignment = {
  dealerId: string;
  organizationUnitId: string | null;
  dealerName: string | null;
};

/** Lanzado cuando la respuesta no tiene la forma del contrato. */
export class DealerContextShapeError extends Error {
  constructor(motivo: string) {
    super(`DEALER_CONTEXT_FORMA_INVALIDA: ${motivo}`);
    this.name = "DealerContextShapeError";
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** String no vacio, o null. No convierte numeros ni objetos a texto. */
function textoOpcional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Parseo ESTRICTO. Una asignacion sin `dealer_id` utilizable no se arregla
 * sola: si se dejara pasar, el binding quedaria a medias y la pantalla pediria
 * el inventario de `undefined`.
 */
export function parseDealerAssignments(body: unknown): DealerAssignment[] {
  const raiz = record(body);
  if (!raiz) throw new DealerContextShapeError("el cuerpo no es un objeto");
  const crudas = raiz.assignments;
  if (!Array.isArray(crudas)) throw new DealerContextShapeError("assignments no es un array");

  return crudas.map((cruda, i) => {
    const item = record(cruda);
    if (!item) throw new DealerContextShapeError(`assignments[${i}] no es un objeto`);

    const dealerId = textoOpcional(item.dealer_id);
    if (!dealerId) throw new DealerContextShapeError(`assignments[${i}].dealer_id ausente o vacio`);

    const unidadCruda = item.organization_unit_id;
    if (unidadCruda !== null && unidadCruda !== undefined && typeof unidadCruda !== "string") {
      throw new DealerContextShapeError(`assignments[${i}].organization_unit_id no es string ni null`);
    }

    return {
      dealerId,
      organizationUnitId: textoOpcional(unidadCruda),
      dealerName: textoOpcional(item.dealer_name),
    };
  });
}

/** Lanza `AccessApiError` en error HTTP y `DealerContextShapeError` en forma invalida. */
export async function fetchMyDealerContext(): Promise<DealerAssignment[]> {
  const response = await apiFetch(DEALER_CONTEXT_PATH, {
    headers: { Accept: "application/json" },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, DEALER_CONTEXT_PATH);
  return parseDealerAssignments(body);
}

export type DealerContextSync =
  | { estado: "sincronizado"; assignment: DealerAssignment }
  | { estado: "sin_asignacion" }
  | { estado: "multiples"; total: number }
  /** Error HTTP: lleva el reason_code REAL del backend, no uno fabricado. */
  | { estado: "error_http"; reason_code: string | null; status: number }
  | { estado: "forma_invalida"; motivo: string }
  /** Sin tenant en la sesion no hay con que escribir el binding. */
  | { estado: "sin_tenant" };

/**
 * Sincroniza el binding del dealer desde el backend.
 *
 * Solo escribe con UNA asignacion. Con cero o con varias BORRA el binding, para
 * que no quede un dealer de una sesion anterior respondiendo por esta. Ante
 * cualquier error --HTTP o de forma-- NO escribe ni borra: un fallo de red no es
 * motivo para desasignar a nadie.
 */
export async function syncDealerContextFromBackend(tenantId: string | null | undefined): Promise<DealerContextSync> {
  const tenant = textoOpcional(tenantId);
  if (!tenant) return { estado: "sin_tenant" };

  let assignments: DealerAssignment[];
  try {
    assignments = await fetchMyDealerContext();
  } catch (error) {
    if (error instanceof AccessApiError) {
      return { estado: "error_http", reason_code: error.reason_code, status: error.status };
    }
    if (error instanceof DealerContextShapeError) {
      return { estado: "forma_invalida", motivo: error.message };
    }
    throw error;
  }

  if (assignments.length === 0) {
    clearDealerAccessContext();
    return { estado: "sin_asignacion" };
  }

  if (assignments.length > 1) {
    // NUNCA assignments[0]: el backend devuelve todas justamente para no elegir.
    clearDealerAccessContext();
    return { estado: "multiples", total: assignments.length };
  }

  const assignment = assignments[0]!;
  setDealerAccessContext({
    tenantId: tenant,
    dealerId: assignment.dealerId,
    organizationUnitId: assignment.organizationUnitId,
  });
  return { estado: "sincronizado", assignment };
}
