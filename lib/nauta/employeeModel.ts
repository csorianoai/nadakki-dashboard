import type { NautaEmployee } from "@/lib/nauta/types";
import {
  getCatalogByRoleId,
  NAUTA_CATALOG,
  type NautaCatalogEntry,
  type NautaCatalogStatus,
  type NautaExpedienteView,
  type NautaRiskLevelKey,
} from "@/lib/nauta/catalogMeta";

export type { NautaExpedienteView };

export interface NautaEnrichedEmployee extends NautaCatalogEntry {
  /** API instance id when available */
  api_id?: string;
  /** Raw API status when available */
  api_status?: string;
}

const API_STATUS_MAP: Record<string, NautaCatalogStatus> = {
  prioridad: "prioridad",
  priority: "prioridad",
  listo: "listo",
  ready: "listo",
  active: "listo",
  laboratorio: "laboratorio",
  laboratory: "laboratorio",
  lab: "laboratorio",
  concepto: "concepto",
  concept: "concepto",
  draft: "concepto",
};

export function mapApiStatusToCatalog(status: string): NautaCatalogStatus | undefined {
  return API_STATUS_MAP[status.toLowerCase()];
}

/** Merge API employees with catalog metadata — catalog is display source of truth. */
export function enrichEmployees(apiEmployees: NautaEmployee[]): NautaEnrichedEmployee[] {
  const byRole = new Map(apiEmployees.map((e) => [e.role_id, e]));

  return NAUTA_CATALOG.map((catalog) => {
    const api = byRole.get(catalog.role_id);
    const mappedStatus = api?.status ? mapApiStatusToCatalog(api.status) : undefined;
    return {
      ...catalog,
      role_name: api?.role_name?.trim() || catalog.role_name,
      department_id: api?.department_id?.trim() || catalog.department_id,
      catalog_status: mappedStatus ?? catalog.catalog_status,
      api_id: api?.id,
      api_status: api?.status,
    };
  });
}

export function getEmployeeByRoleId(
  employees: NautaEnrichedEmployee[],
  roleId: string,
): NautaEnrichedEmployee | undefined {
  return employees.find((e) => e.role_id === roleId) ?? getCatalogByRoleId(roleId);
}

export type { NautaRiskLevelKey, NautaCatalogStatus };
