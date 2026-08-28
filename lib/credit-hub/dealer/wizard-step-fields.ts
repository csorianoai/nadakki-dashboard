export function buildWizardStepFields(payload: Record<string, unknown>, step: number): Record<string, unknown> {
  const objectFields = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

  if (step === 0) return { ...objectFields(payload.applicant), ...objectFields(payload.employment) };
  if (step === 1) return { ...objectFields(payload.consents) };
  if (step === 2) return { ...objectFields(payload.financial), ...objectFields(payload.vehicle) };
  return {
    ...objectFields(payload.co_debtor),
    ...(Array.isArray(payload.documents) ? { documents: payload.documents } : {}),
    ...(Array.isArray(payload.documentos) ? { documentos: payload.documentos } : {}),
  };
}
