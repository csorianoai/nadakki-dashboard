import { LegalApiHttpError } from "@/lib/legal/parse-api-error";

/** Mensaje claro para el usuario según el estado HTTP; el detalle del backend va aparte. */
export function mensajeDeError(err: unknown, accion: "subir" | "parte" | "representacion"): string {
  const http = err instanceof LegalApiHttpError ? err : null;
  const que = accion === "subir" ? "subir documentos" : accion === "parte" ? "agregar partes" : "cambiar la representación";
  switch (http?.status) {
    case 401:
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case 403:
      return `Tu rol no permite ${que} en este expediente.`;
    case 404:
      return "No se encontró el expediente en tu institución.";
    case 409:
      return http.detail || "La operación entra en conflicto con lo que ya existe.";
    case 413:
      return http.detail || "El archivo es demasiado grande.";
    case 422:
      return http.detail || "Revisa los datos: hay un campo inválido o vacío.";
    case 503:
      return "El servicio no está disponible ahora mismo. No se guardó nada; intenta más tarde.";
    default:
      return http ? `No se pudo completar (HTTP ${http.status}). No se guardó nada.` : "No hubo respuesta del servidor. No se guardó nada.";
  }
}
