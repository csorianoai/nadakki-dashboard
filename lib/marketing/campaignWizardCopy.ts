/**
 * Textos del asistente "Campaña de correo y mensajes" (D6-CAMPANAS-ENCAUZAR).
 * Solo etiquetas visibles: los ids/valores que viajan al backend no cambian.
 */
export const WIZARD_TITLE = "Campaña de correo y mensajes";
export const GOOGLE_ADS_HREF = "/advertising/google-ads";
export const ZERO_AUDIENCE_NOTICE = "Aún no tienes contactos en este segmento";

/** Lee solo claves propias del mapa: "constructor" o "__proto__" no devuelven nada del prototipo. */
export function propia<T>(mapa: Record<string, T>, clave: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(mapa, clave) ? mapa[clave] : undefined;
}

export const OBJECTIVE_LABELS: Record<string, string> = {
  convert: "Convertir",
  engage: "Interesar",
  retain: "Retener",
  awareness: "Dar a conocer",
  recover: "Recuperar",
  reactivate: "Reactivar",
  onboard: "Dar la bienvenida",
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

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  dynamic: "Dinámico", static: "Fijo", system: "Del sistema",
  behavioral: "Por comportamiento", demographic: "Por perfil", value: "Por valor",
};
const CHANNEL_LABELS: Record<string, string> = {
  email: "Correo", sms: "SMS", push: "Notificación push", "in-app": "Mensaje en la app", banner: "Banner", whatsapp: "WhatsApp",
};

export function objectiveLabel(v: unknown): string {
  const k = String(v ?? "");
  return propia(OBJECTIVE_LABELS, k) ?? k;
}
export function segmentTypeLabel(v: unknown): string {
  const k = String(v ?? "");
  return propia(SEGMENT_TYPE_LABELS, k) ?? k;
}
export function channelLabel(v: unknown): string {
  const k = String(v ?? "");
  return propia(CHANNEL_LABELS, k) ?? k;
}
export function scheduleLabel(v: unknown): string {
  const k = String(v ?? "");
  return propia(SCHEDULE_LABELS, k) ?? k;
}

/** Nombre visible de una plantilla: las del sistema con nombre genérico «Objetivo — CANAL» se componen con objetivo + canal; el id no cambia. */
export function templateDisplayName(t: Record<string, unknown>, fallback: string): string {
  const sistema = t.source === "system" || t.is_system_template === true;
  const generico = new RegExp(`^${String(t.objective ?? "").replace(/[^\w-]/g, "")}\\s*[—–-]\\s*\\S+$`, "i").test(String(t.name ?? ""));
  if (sistema && t.objective && t.type && generico) return `${objectiveLabel(t.objective)} — ${channelLabel(t.type)}`;
  return String(t.name ?? fallback);
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
    return propia(EXAMPLE_VALUES, key.toLowerCase()) ?? "ejemplo";
  });
  return { text: out.replace(/[{}]/g, ""), example };
}
