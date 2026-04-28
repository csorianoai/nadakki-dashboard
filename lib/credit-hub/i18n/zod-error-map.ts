import { z, type ZodErrorMap } from "zod";

export const spanishCreditHubErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: "Tipo inválido" };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "Correo electrónico inválido" };
      if (issue.validation === "url") return { message: "URL inválida" };
      if (issue.validation === "uuid") return { message: "Identificador inválido" };
      return { message: "Texto inválido" };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string")
        return { message: `Mínimo ${issue.minimum} caracteres` };
      if (issue.type === "number") return { message: `El valor mínimo es ${issue.minimum}` };
      if (issue.type === "array") return { message: `Selecciona al menos ${issue.minimum} elemento(s)` };
      return { message: "Valor muy pequeño" };
    case z.ZodIssueCode.too_big:
      if (issue.type === "string")
        return { message: `Máximo ${issue.maximum} caracteres` };
      if (issue.type === "number") return { message: `El valor máximo es ${issue.maximum}` };
      return { message: "Valor muy grande" };
    case z.ZodIssueCode.invalid_date:
      return { message: "Fecha inválida" };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Valor no permitido" };
    default:
      return { message: ctx.defaultError };
  }
};

/** Registers Spanish messages for Zod parse errors (credit-hub scope). */
export function registerCreditHubSpanishZodErrorMap(): void {
  z.setErrorMap(spanishCreditHubErrorMap);
}
