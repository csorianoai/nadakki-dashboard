import type { CaseType } from "@/lib/legal/cases/case-types";

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  defensa_civil_cobro_pesos: "Defensa civil — cobro de pesos",
  recurso_apelacion_civil: "Recurso de apelación civil",
  caso_penal_imputado: "Caso penal — imputado",
  caso_penal_victima_querellante: "Caso penal — víctima/querellante",
  caso_penal_evaluacion_general: "Caso penal — evaluación general",
};
