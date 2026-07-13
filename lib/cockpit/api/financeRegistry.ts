import { platformFetch } from "@/lib/platformApi";
import { fetchOrDemo } from "./fetchOrDemo";
import type {
  RegistryEntityType,
  RegistryEntityTypesResponse,
  RegistryProfession,
  RegistryProfessionsResponse,
} from "../types-finance";

export function listProfessions(coreCode: string) {
  return fetchOrDemo<RegistryProfessionsResponse>(
    `/api/v1/cockpit/registry/professions?core=${encodeURIComponent(coreCode)}`,
    () => ({ data_source: "demo", professions: [] }),
  );
}

export function createProfession(body: Omit<RegistryProfession, "id">) {
  return platformFetch<RegistryProfession>("/api/v1/cockpit/registry/professions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProfession(id: string, body: Partial<RegistryProfession>) {
  return platformFetch<RegistryProfession>(`/api/v1/cockpit/registry/professions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProfession(id: string) {
  return platformFetch<void>(`/api/v1/cockpit/registry/professions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function listEntityTypes(coreCode: string) {
  return fetchOrDemo<RegistryEntityTypesResponse>(
    `/api/v1/cockpit/registry/entity-types?core=${encodeURIComponent(coreCode)}`,
    () => ({ data_source: "demo", entity_types: [] }),
  );
}

export function createEntityType(body: Omit<RegistryEntityType, "id">) {
  return platformFetch<RegistryEntityType>("/api/v1/cockpit/registry/entity-types", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEntityType(id: string, body: Partial<RegistryEntityType>) {
  return platformFetch<RegistryEntityType>(`/api/v1/cockpit/registry/entity-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteEntityType(id: string) {
  return platformFetch<void>(`/api/v1/cockpit/registry/entity-types/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
