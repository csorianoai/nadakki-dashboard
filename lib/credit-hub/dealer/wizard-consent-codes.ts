/**
 * Códigos de consentimiento que exige el backend (tenant_config consents_required) a partir de las
 * casillas del asistente. Antes se enviaban los nombres de los campos del formulario y el backend
 * respondía 409 consent_incomplete (ronda 3 de Cowork, DB-CODEX-16).
 */
export const CONSENT_CODE_LABELS: Record<string, string> = {
  LEY_172_13: "Ley 172-13",
  BURO: "consulta de buró",
  DATA_POLICY: "política de tratamiento de datos",
};

export function consentCodesAccepted(c: { terms: boolean; bureau: boolean; dataProcessing: boolean }): string[] {
  const codes: string[] = [];
  if (c.terms) codes.push("LEY_172_13");
  if (c.bureau) codes.push("BURO");
  if (c.dataProcessing) codes.push("DATA_POLICY");
  return codes;
}

/** Mensaje para el usuario cuando el backend rechaza la firma por autorizaciones que faltan. */
export function consentIncompleteMessage(missing: string[]): string {
  const names = missing.map((m) => CONSENT_CODE_LABELS[m] ?? m);
  return `No se pudo firmar: faltan autorizaciones obligatorias (${names.join(", ")}).`;
}
