/**
 * Fotos de un vehiculo (D5). Contrato P4 parte 2, publicado en #1501 (backend #1549):
 * GET/POST `/api/v1/autos/vehicles/{id}/photos` (POST multipart, campo `file`) y
 * DELETE `.../photos/{media_id}`. El tenant sale SOLO del token: sin X-Tenant-ID.
 * Formato y tamano los decide el backend; el frente no duplica la validacion.
 * Sin datos personales en nombres de archivo (DECISION_CESAR P4: A): el backend
 * no devuelve `original_filename` y el frente tampoco manda el original.
 */

import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/** Capability con la que el backend registra las tres rutas. Depende del plan. */
export const PHOTOS_CAPABILITY = "autos.inventory.photos";

const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const PHOTO_ACCEPT = Object.keys(MIME_EXT).join(",");

export type VehiclePhoto = { id: string; url: string; isPrimary: boolean; order: number };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Miniatura si existe, si no la media, si no la del CDN. Sin id o sin url, fuera. */
export function parsePhotos(body: unknown): VehiclePhoto[] {
  const list = record(body)?.photos;
  if (!Array.isArray(list)) return [];
  return list
    .map((value, index) => {
      const rec = record(value);
      const id = text(rec?.id);
      const url = rec ? text(rec.thumbnail_url) ?? text(rec.medium_url) ?? text(rec.cdn_url) : null;
      if (!rec || !id || !url) return null;
      const order = typeof rec.display_order === "number" ? rec.display_order : index;
      return { id, url, isPrimary: rec.is_primary === true, order };
    })
    .filter((photo): photo is VehiclePhoto => photo !== null)
    .sort((a, b) => a.order - b.order);
}

/** Nombre neutro: ni dominio, ni cliente, ni DNI. Solo la extension del tipo. */
export function nombreNeutro(file: File): string {
  return `foto.${MIME_EXT[file.type] ?? "jpg"}`;
}

/** Formato malo (otro archivo) no es foto corrupta (reexportarla) ni fallo nuestro (reintentar). */
export type PhotoErrorKind = "otro_archivo" | "reexportar" | "reintentar" | "tope" | "despliegue" | "no_es_tuyo" | "otro";

export type PhotoError = { kind: PhotoErrorKind; reasonCode: string; message: string };

const POR_MOTIVO: Record<string, [PhotoErrorKind, string]> = {
  unsupported_mime_type: ["otro_archivo", "Formato no admitido. Solo JPG, PNG o WebP."],
  empty_file: ["otro_archivo", "El archivo está vacío."],
  file_too_large: ["reintentar", "La foto supera el tamaño máximo (10 MB)."],
  max_photos_reached: ["tope", "Este vehículo ya tiene el máximo de fotos."],
  metadata_strip_failed: ["reexportar", "No pudimos procesar la foto. Volvé a exportarla y subila de nuevo."],
  storage_error: ["reintentar", "No pudimos guardar la foto ahora mismo. Intentalo de nuevo."],
  media_storage_unconfigured: ["despliegue", "Las fotos no están configuradas en este entorno."],
  not_found: ["no_es_tuyo", "Este vehículo no es de tu concesionario o ya no existe."],
};

export const PHOTO_ERROR_HINT: Record<PhotoErrorKind, string> = {
  otro_archivo: "Elegí otro archivo.",
  reexportar: "Reexportá la misma foto desde la cámara o el teléfono.",
  reintentar: "Podés reintentar.",
  tope: "Eliminá una foto antes de subir otra.",
  despliegue: "No es un problema tuyo: avisá a soporte.",
  no_es_tuyo: "Volvé al inventario.",
  otro: "",
};

/** El texto en castellano del backend manda; la tabla solo cubre su ausencia. */
export function photoError(error: unknown): PhotoError {
  if (!(error instanceof AccessApiError)) {
    return { kind: "reintentar", reasonCode: "NETWORK", message: "No hubo respuesta del servidor." };
  }
  const reasonCode = error.reason_code ?? `HTTP_${error.status}`;
  const [kind, fallback] = POR_MOTIVO[reasonCode.split(":")[0]] ?? [
    error.status === 404 ? "no_es_tuyo" : "otro",
    `No se pudo completar la operación (${reasonCode}).`,
  ];
  return { kind, reasonCode, message: text(record(error.detail)?.detail) ?? fallback };
}

export function vehiclePhotosPath(vehicleId: string, mediaId?: string): string {
  const base = `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/photos`;
  return mediaId ? `${base}/${encodeURIComponent(mediaId)}` : base;
}

async function call(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await apiFetch(path, { ...init, headers: { Accept: "application/json" } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

export async function fetchVehiclePhotos(vehicleId: string): Promise<VehiclePhoto[]> {
  return parsePhotos(await call(vehiclePhotosPath(vehicleId)));
}

/** Sin Content-Type: el navegador pone el boundary del multipart. */
export function uploadVehiclePhoto(vehicleId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append("file", file, nombreNeutro(file));
  return call(vehiclePhotosPath(vehicleId), { method: "POST", body: form });
}

export function deleteVehiclePhoto(vehicleId: string, mediaId: string): Promise<unknown> {
  return call(vehiclePhotosPath(vehicleId, mediaId), { method: "DELETE" });
}
