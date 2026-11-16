/**
 * Textos del asistente "Campaña de correo y mensajes" (D6-CAMPANAS-ENCAUZAR).
 * Solo etiquetas visibles: los ids/valores que viajan al backend no cambian.
 */
export const WIZARD_TITLE = "Campaña de correo y mensajes";
export const GOOGLE_ADS_HREF = "/advertising/google-ads";
export const ZERO_AUDIENCE_NOTICE = "Aún no tienes contactos en este segmento";

export const OBJECTIVE_LABELS: Record<string, string> = {
  convert: "Convertir",
  engage: "Interesar",
  retain: "Retener",
  awareness: "Dar a conocer",
};

export const SCHEDULE_LABELS: Record<string, string> = {
  immediate: "Enviar ahora",
  scheduled: "Programar para después",
  "action-based": "Según una acción del contacto",
  recurring: "Recurrente",
};

export const CONVERSION_LABELS: Record<string, string> = {
  purchase: "Hizo una compra",
  signup: "Completó el registro",
  upgrade: "Cambió de plan",
  referral: "Recomendó a un amigo",
  review: "Dejó una opinión",
};

const SEGMENT_TYPE_LABELS: Record<string, string> = { dynamic: "Dinámico", static: "Fijo", system: "Del sistema" };
const CHANNEL_LABELS: Record<string, string> = {
  email: "Correo", sms: "SMS", push: "Notificación push", "in-app": "Mensaje en la app", banner: "Banner", whatsapp: "WhatsApp",
};

export function objectiveLabel(v: unknown): string {
  const k = String(v ?? "");
  return OBJECTIVE_LABELS[k] ?? k;
}
export function segmentTypeLabel(v: unknown): string {
  const k = String(v ?? "");
  return SEGMENT_TYPE_LABELS[k] ?? k;
}
export function channelLabel(v: unknown): string {
  const k = String(v ?? "");
  return CHANNEL_LABELS[k] ?? k;
}

const EXAMPLE_VALUES: Record<string, string> = {
  emoji: "🎁",
  key_message: "tu mensaje principal",
  name: "Nombre",
  first_name: "Nombre",
  nombre: "Nombre",
};

/** Sustituye cada {variable} por un ejemplo; `example` indica si hubo algún reemplazo. Nunca deja llaves. */
export function fillPreviewExample(text: string): { text: string; example: boolean } {
  let example = false;
  const out = text.replace(/\{\{?\s*([^{}]*?)\s*\}?\}/g, (_m, key: string) => {
    example = true;
    return EXAMPLE_VALUES[key.toLowerCase()] ?? "ejemplo";
  });
  return { text: out.replace(/[{}]/g, ""), example };
}
