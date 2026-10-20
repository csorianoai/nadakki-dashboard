/** UI copy for documents/consents the platform does not validate yet (honest optional labeling). */

export const WIZARD_OPTIONAL_ID_DOC_NOTICE =
  "Documento opcional — la validación automática de identidad no está activa en este entorno.";

export const WIZARD_OPTIONAL_BANK_STATEMENTS_NOTICE =
  "Documento opcional — no hay verificación automática de estados financieros en este entorno.";

/** DECISION_CESAR (DB-CODEX-16, ronda 3): la autorización de buró es obligatoria para firmar. */
export const WIZARD_BUREAU_REQUIRED_NOTICE =
  "La autorización de consulta a buró es obligatoria para firmar el consentimiento.";

export function wizardDocumentOptionalNotice(key: string): string | null {
  if (key === "id_front" || key === "id_back") return WIZARD_OPTIONAL_ID_DOC_NOTICE;
  if (key === "bank_statements") return WIZARD_OPTIONAL_BANK_STATEMENTS_NOTICE;
  return null;
}
