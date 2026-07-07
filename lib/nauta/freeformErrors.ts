import { NAUTA_TASK_INSTRUCTION_MAX_LENGTH } from "./freeformConfig";

export type NautaFreeformErrorKind =
  | "freeform_denied"
  | "instruction_invalid"
  | "instruction_too_long"
  | "instruction_secret"
  | "generic";

export interface NautaFreeformErrorMessage {
  kind: NautaFreeformErrorKind;
  message: string;
}

export function resolveFreeformRunError(status: number, detail: string): NautaFreeformErrorMessage {
  const d = detail.toLowerCase();

  if (status === 403 && d.includes("freeform_not_allowed")) {
    return {
      kind: "freeform_denied",
      message:
        "Este empleado no admite instrucciones libres. Ejecute la plantilla predefinida sin texto personalizado.",
    };
  }

  if (status === 422) {
    if (d.includes("instruction_contains_secret")) {
      return {
        kind: "instruction_secret",
        message: "La instrucción no puede contener credenciales — usa el vault.",
      };
    }
    if (d.includes("task_instruction_too_long")) {
      return {
        kind: "instruction_too_long",
        message: `La instrucción supera el límite de ${NAUTA_TASK_INSTRUCTION_MAX_LENGTH} caracteres.`,
      };
    }
    if (d.includes("invalid_task_instruction")) {
      return {
        kind: "instruction_invalid",
        message: "La instrucción no es válida. Revise el texto e intente de nuevo.",
      };
    }
    return {
      kind: "instruction_invalid",
      message: detail.trim() || "Instrucción rechazada por el servidor.",
    };
  }

  return { kind: "generic", message: detail.trim() || "No se pudo iniciar la ejecución." };
}
