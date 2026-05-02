/**
 * Credit Hub toast copy for flows that need explicit EN/ES (Item 3 wiring).
 * Bank decision, document upload, and dealer wizard submission/autosave use this module
 * keyed off `tenantConfig.locale` (Forge) or `TenantSettings.language` (legacy /credit).
 */

export type ForgeToastLang = "es" | "en";

export function forgeToastLangFromLocale(locale: string | undefined): ForgeToastLang {
  if (!locale) return "es";
  const l = locale.toLowerCase();
  if (l.startsWith("en")) return "en";
  return "es";
}

/** Stable short display id for toast lines (e.g. `APP-` + compact token from the real id). */
export function formatToastApplicationId(rawId: string): string {
  const id = rawId.trim();
  if (!id) return "APP-????";
  const upper = id.toUpperCase();
  if (upper.startsWith("APP-")) return id.replace(/^app-/i, "APP-");
  const compact = id.replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length <= 10) return `APP-${compact.toUpperCase()}`;
  return `APP-${compact.slice(0, 8).toUpperCase()}`;
}

const BANK = {
  es: {
    applicationApproved: (id: string) => `Solicitud ${id} aprobada.`,
    applicationRejected: (id: string) => `Solicitud ${id} rechazada.`,
    decisionSaveError: (detail?: string) =>
      `No se pudo guardar la decisión. Inténtalo de nuevo.${detail ? ` (${detail})` : ""}`,
  },
  en: {
    applicationApproved: (id: string) => `Application ${id} approved.`,
    applicationRejected: (id: string) => `Application ${id} rejected.`,
    decisionSaveError: (detail?: string) =>
      `Could not save decision. Please retry.${detail ? ` (${detail})` : ""}`,
  },
} as const;

const WIZARD = {
  es: {
    draftSaved: "Borrador guardado",
    draftSaveFailed: "No se pudo guardar el borrador",
    retry: "Reintentar",
    requestSubmitted: (displayId: string) => `Solicitud enviada — ${displayId}`,
  },
  en: {
    draftSaved: "Draft saved",
    draftSaveFailed: "Could not save draft",
    retry: "Retry",
    requestSubmitted: (displayId: string) => `Application submitted — ${displayId}`,
  },
} as const;

const DOCUMENT = {
  es: {
    uploaded: "Documento cargado",
    uploadFailed: (detail?: string) =>
      `No se pudo subir el documento.${detail ? ` ${detail}` : ""}`,
  },
  en: {
    uploaded: "Document uploaded",
    uploadFailed: (detail?: string) =>
      `Could not upload document.${detail ? ` ${detail}` : ""}`,
  },
} as const;

export function forgeBankDecisionToasts(lang: ForgeToastLang) {
  return BANK[lang];
}

export function forgeWizardToasts(lang: ForgeToastLang) {
  return WIZARD[lang];
}

export function forgeDocumentUploadToasts(lang: ForgeToastLang) {
  return DOCUMENT[lang];
}
