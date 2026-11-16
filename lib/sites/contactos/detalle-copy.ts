import type { Bi } from "../copy-util";

export const CD: Record<string, Bi> = {
  detailTitle: { es: "Detalle del contacto", en: "Contact details" },
  loadingDetail: { es: "Cargando detalle…", en: "Loading details…" },
  errDetail: { es: "No se puede mostrar el contacto", en: "The contact cannot be shown" },
  close: { es: "Cerrar detalle", en: "Close details" },
  message: { es: "Mensaje", en: "Message" },
  consents: { es: "Consentimiento por canal", en: "Consent by channel" },
  textVersion: { es: "versión del texto", en: "text version" },
  granted: { es: "Concedido", en: "Granted" }, denied: { es: "Denegado", en: "Denied" }, revoked: { es: "Revocado", en: "Revoked" },
  clicks: { es: "Identificadores de clic", en: "Click identifiers" },
  clickNone: { es: "Sin identificadores (consentimiento denegado o desconocido)", en: "No identifiers (consent denied or unknown)" },
  clickAbsent: { es: "Sin clic publicitario registrado", en: "No ad click recorded" },
  clickEmpty: { es: "Consentimiento concedido, pero sin identificadores", en: "Consent granted, but no identifiers" },
  revoke: { es: "Revocar consentimiento", en: "Revoke consent" },
  confirmTitle: { es: "¿Revocar el consentimiento de este canal? Dejará de ser contactable por él.", en: "Revoke consent for this channel? The contact will no longer be reachable through it." },
  confirm: { es: "Sí, revocar", en: "Yes, revoke" }, cancel: { es: "Cancelar", en: "Cancel" },
  revoking: { es: "Revocando…", en: "Revoking…" },
  alreadyRevoked: { es: "Consentimiento ya revocado: no hay nada más que hacer.", en: "Consent already revoked: nothing more to do." },
  errRevoke: { es: "No se pudo revocar. Puede reintentar: se usará la misma solicitud.", en: "Could not revoke. You can retry: the same request will be used." },
  revokedOk: { es: "Consentimiento revocado.", en: "Consent revoked." },
};
