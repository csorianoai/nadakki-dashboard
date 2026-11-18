import type { Bi } from "../copy-util";
import type { Severity } from "../types";

export const PUB: Record<string, Bi> = {
  title: { es: "Publicar su sitio", en: "Publish your website" },
  status: { es: "Estado actual", en: "Current status" },
  check: { es: "Revisar antes de publicar", en: "Review before publishing" },
  publish: { es: "Publicar", en: "Publish" },
  unpublish: { es: "Despublicar", en: "Unpublish" },
  working: { es: "Procesando…", en: "Working…" },
  scope: { es: "Se publica todo el sitio.", en: "The whole website is published." },
  demoSim: { es: "Simulación en modo DEMO: no se publicó nada real.", en: "DEMO simulation: nothing real was published." },
  published: { es: "Publicado. Su sitio ya está en línea.", en: "Published. Your website is now online." },
  publishedWarn: { es: "Avisos que conviene revisar:", en: "Warnings worth reviewing:" },
  review: { es: "En revisión: faltan aprobaciones manuales", en: "In review: manual approvals are missing" },
  reviewBody: { es: "Aún no está publicado. Falta aprobar:", en: "It is not published yet. Pending approval:" },
  manualRule: { es: "Aprobación manual pendiente", en: "Manual approval pending" },
  blockedTitle: { es: "No se pudo publicar: hay reglas que lo impiden", en: "Could not publish: some rules prevent it" },
  readyTitle: { es: "Revisión lista", en: "Review done" },
  readyYes: { es: "Nada impide publicar.", en: "Nothing prevents publishing." },
  readyNo: { es: "Hay puntos que impiden publicar.", en: "Some items prevent publishing." },
  unknownResult: { es: "El servicio respondió algo inesperado. El sitio no se marcó como publicado.", en: "The service gave an unexpected answer. The website was not marked as published." },
  unpublished: { es: "Despublicado. Su sitio ya no está en línea.", en: "Unpublished. Your website is no longer online." },
  confirmTitle: { es: "¿Despublicar el sitio?", en: "Unpublish the website?" },
  confirmBody: { es: "Sus visitantes dejarán de ver el sitio hasta que lo publique de nuevo.", en: "Visitors will stop seeing the website until you publish it again." },
  confirmYes: { es: "Sí, despublicar", en: "Yes, unpublish" },
  confirmNo: { es: "Cancelar", en: "Cancel" },
  rule: { es: "Regla", en: "Rule" },
  field: { es: "Campo", en: "Field" },
  severity: { es: "Gravedad", en: "Severity" },
  goTo: { es: "Ir a la página", en: "Go to the page" },
  block: { es: "bloque", en: "block" },
  accept: { es: "Aceptar este aviso", en: "Accept this warning" },
  justification: { es: "Justificación (obligatoria)", en: "Justification (required)" },
  expires: { es: "Vale hasta (fecha futura)", en: "Valid until (future date)" },
  confirmAccept: { es: "Confirmar aceptación", en: "Confirm acceptance" },
  cancel: { es: "Cancelar", en: "Cancel" },
  needJustification: { es: "Escriba la justificación.", en: "Write the justification." },
  needFuture: { es: "Elija una fecha de caducidad posterior a hoy.", en: "Choose an expiry date after today." },
  accepted: { es: "Aviso aceptado hasta", en: "Warning accepted until" },
  history: { es: "Historial de revisiones", en: "Review history" },
  historyEmpty: { es: "Todavía no hay revisiones registradas.", en: "No reviews recorded yet." },
  historyDemo: { es: "El historial no está disponible en modo DEMO.", en: "History is not available in DEMO mode." },
  historyError: { es: "No pudimos cargar el historial.", en: "We could not load the history." },
  more: { es: "Ver más", en: "Show more" },
  findings: { es: "puntos", en: "items" },
  loading: { es: "Cargando…", en: "Loading…" },
  errTitle: { es: "No se pudo completar la acción", en: "The action could not be completed" },
  noSite: { es: "No hay un sitio elegido.", en: "No website selected." },
  ok: { es: "Aprobado", en: "Passed" },
};

export const SEV: Record<Severity, Bi & { icon: string }> = {
  block: { es: "Bloquea", en: "Blocks", icon: "■" },
  warn: { es: "Aviso", en: "Warning", icon: "▲" },
  info: { es: "Información", en: "Information", icon: "●" },
};

export const RESULT: Record<string, Bi & { icon: string }> = {
  pass: { es: "Aprobado", en: "Passed", icon: "●" },
  warn: { es: "Con avisos", en: "With warnings", icon: "▲" },
  block: { es: "Bloqueado", en: "Blocked", icon: "■" },
};

export const ESTADOS: Record<string, Bi> = {
  draft: { es: "Borrador", en: "Draft" },
  in_review: { es: "En revisión", en: "In review" },
  published: { es: "Publicado", en: "Published" },
  suspended: { es: "Suspendido", en: "Suspended" },
};

/** Codigo estable del servidor -> lenguaje llano. */
export const ERR: Record<string, Bi> = {
  NOT_FOUND: { es: "Sitio no encontrado. No existe en su cuenta.", en: "Website not found. It does not exist in your account." },
  TENANT_MISMATCH: { es: "Su sesión no corresponde a esta cuenta. Cierre sesión y entre de nuevo.", en: "Your session does not match this account. Sign out and sign in again." },
  FORBIDDEN: { es: "Su usuario no tiene permiso para esta acción.", en: "Your user cannot do this." },
  UNAUTHENTICATED: { es: "Su sesión venció. Entre de nuevo.", en: "Your session expired. Sign in again." },
  OVERRIDE_NOT_ALLOWED: { es: "Este punto no se puede aceptar: solo los avisos pueden aceptarse.", en: "This item cannot be accepted: only warnings can be accepted." },
  VALIDATION_ERROR: { es: "Revise los datos: el servicio no los aceptó.", en: "Check the data: the service did not accept it." },
  CONFLICT: { es: "El sitio cambió mientras trabajaba. Recargue e intente de nuevo.", en: "The website changed meanwhile. Reload and try again." },
  IDEMPOTENCY_KEY_REUSED: { es: "Esta operación ya se había enviado con otros datos. Recargue e intente de nuevo.", en: "This operation was already sent with other data. Reload and try again." },
  RATE_LIMITED: { es: "Demasiados intentos. Espere un momento.", en: "Too many attempts. Wait a moment." },
  PUBLISH_BLOCKED: { es: "La publicación está bloqueada por reglas.", en: "Publishing is blocked by rules." },
  NETWORK: { es: "Sin conexión. Puede intentarlo de nuevo: no se duplicará la operación.", en: "No connection. You can try again: the operation will not be duplicated." },
  DEFAULT: { es: "Ocurrió un error inesperado. Intente de nuevo más tarde.", en: "An unexpected error occurred. Please try again later." },
};
