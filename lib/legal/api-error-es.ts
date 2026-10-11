/**
 * DASH-LEGAL L2a: errores del backend Legal en español llano.
 *
 * Las cadenas de entrada son las que emite nadakki-ai-suite (medidas en main):
 * - `insufficient_role: requires one of (...)`   attorney_role_check.py
 * - `sin unidad organizativa resoluble`          guarda_capacidad.py
 * - `capability_denied:<cap>:<ReasonCode>`        guarda_capacidad.py + access/entitlements.py
 * - `tenant_mismatch` / `TENANT_MISMATCH`         auth_v2_service.py / RLSMiddleware
 * - `{error_code: "PASSWORD_CHANGE_REQUIRED"}`    auth_v2_service.py
 * - `missing_auth`, `token_expired`, ...          auth_v2_service.py (401)
 */

const CAPABILITY_REASONS: Record<string, string> = {
  NO_ACTIVE_SUBSCRIPTION: "Tu organización no tiene una suscripción activa que incluya Legal.",
  TRIAL_EXPIRED: "El periodo de prueba de tu organización terminó.",
  GRACE_PERIOD_EXPIRED: "La suscripción de tu organización está vencida.",
  SUBSCRIPTION_SUSPENDED: "La suscripción de tu organización está suspendida.",
  SUBSCRIPTION_CANCELLED: "La suscripción de tu organización está cancelada.",
  CAPABILITY_NOT_INCLUDED: "Tu plan no incluye esta función de Legal.",
  UPGRADE_REQUIRED: "Tu plan no incluye esta función de Legal.",
  ADD_ON_REQUIRED: "Esta función de Legal requiere un complemento que tu plan no tiene.",
  CAPABILITY_DISABLED: "Esta función de Legal está desactivada para tu organización.",
  LIMIT_REACHED: "Tu organización alcanzó el límite de uso de esta función.",
  UNIT_NOT_IN_TENANT: "Tu unidad organizativa no pertenece a esta organización.",
  TENANT_MISMATCH: "La organización seleccionada no coincide con tu sesión.",
  TARGET_CORE_NOT_READY: "Esta función de Legal todavía no está habilitada.",
  FEATURE_FLAG_DISABLED: "Esta función de Legal todavía no está habilitada.",
  PROVIDER_UNAVAILABLE: "El servicio necesario para esta función no está disponible ahora.",
  // Estos ReasonCode llegan en minúsculas (services/access/entitlements.py:64-66 y legacy).
  capability_not_in_archetype: "Esta función de Legal no está disponible para el tipo de organización de tu despacho.",
  no_beneficiary_entitlement: "Tu organización no tiene habilitado el acceso a Legal.",
  no_organization_unit: "Tu usuario no tiene una unidad organizativa asignada, y Legal la necesita para esta acción.",
  no_active_subscription: "Tu organización no tiene una suscripción activa que incluya Legal.",
  capability_disabled_for_plan: "Tu plan no incluye esta función de Legal.",
};

const CONTACT = "Si crees que es un error, contacta al administrador de tu despacho.";

/** Texto del cuerpo de error del backend: `detail` (str, dict o lista), `message` o `error`. */
export function backendDetail(body: unknown): string {
  if (!body || typeof body !== "object") return typeof body === "string" ? body : "";
  const o = body as Record<string, unknown>;
  const d = o.detail;
  if (typeof d === "string") return d;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const dd = d as Record<string, unknown>;
    return String(dd.error_code ?? dd.code ?? dd.message ?? "");
  }
  if (Array.isArray(d)) return "validation_error";
  return String(o.code ?? o.error_code ?? o.message ?? o.error ?? "");
}

/** Mensaje en español llano para un error HTTP del backend Legal. */
export function legalErrorToSpanish(status: number, detail: string): string {
  const d = (detail || "").trim();
  if (status === 0) return "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  if (status === 401) return "Tu sesión no es válida o expiró. Vuelve a iniciar sesión.";
  if (/PASSWORD_CHANGE_REQUIRED/i.test(d)) return "Debes cambiar tu contraseña antes de continuar.";
  if (/^insufficient_role/i.test(d)) {
    return `Tu rol no tiene permiso para esta acción. Solo pueden hacerla los abogados o administradores del despacho. ${CONTACT}`;
  }
  if (/unidad organizativa/i.test(d)) {
    return `Tu usuario no tiene una unidad organizativa asignada, y Legal la necesita para esta acción. ${CONTACT}`;
  }
  if (/tenant_mismatch/i.test(d)) return `${CAPABILITY_REASONS.TENANT_MISMATCH} Cambia de organización o vuelve a iniciar sesión.`;
  const cap = /^capability_denied:[^:]+:([A-Za-z_]+)/.exec(d);
  if (cap) return `${CAPABILITY_REASONS[cap[1]] ?? "Tu organización no tiene acceso a esta función de Legal."} ${CONTACT}`;
  if (status === 403) return `No tienes permiso para esta acción. ${CONTACT}`;
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 408) return "La consulta tardó demasiado. Inténtalo de nuevo o acórtala.";
  if (status === 409) return "La acción no es posible en el estado actual del expediente.";
  if (status === 422) return "Algunos datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.";
  if (status === 429) return "Has hecho demasiadas solicitudes seguidas. Espera unos segundos e inténtalo de nuevo.";
  if (status >= 500) return `El servidor tuvo un problema (error ${status}). Inténtalo más tarde.`;
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}

/** Para un error capturado: usa status/detail si los trae (LegalApiHttpError, APIError). */
export function legalCaughtErrorToSpanish(e: unknown): string {
  const o = (e ?? {}) as { status?: number; detail?: string; message?: unknown; error?: { detail?: unknown } };
  const status = typeof o.status === "number" ? o.status : 0;
  // LegalApiHttpError trae `detail`; APIError (lib/legal-api) lo trae en error.detail;
  // LegalApiError (lib/api/legal) guarda el detail del backend en `message`.
  const detail =
    typeof o.detail === "string"
      ? o.detail
      : backendDetail(o.error?.detail) || (typeof o.message === "string" ? o.message : "");
  return legalErrorToSpanish(status, detail);
}
