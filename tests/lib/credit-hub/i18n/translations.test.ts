import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

describe("Spanish translations DO (credit-hub)", () => {
  it("has all required common keys", () => {
    expect(CREDIT_HUB_ES_DO.common.submit).toBe("Enviar solicitud");
    expect(CREDIT_HUB_ES_DO.common.cancel).toBe("Cancelar");
    expect(CREDIT_HUB_ES_DO.common.next).toBe("Siguiente");
  });

  it("has validation messages in Spanish", () => {
    expect(CREDIT_HUB_ES_DO.validation.invalid_cedula).toContain("Cédula");
    expect(CREDIT_HUB_ES_DO.validation.required_field).toBe("Campo obligatorio");
  });

  it("has status translations", () => {
    expect(CREDIT_HUB_ES_DO.status.approved).toBe("Aprobado");
    expect(CREDIT_HUB_ES_DO.status.rejected).toBe("Rechazado");
  });

  it("supports parameterized validation messages", () => {
    expect(CREDIT_HUB_ES_DO.validation.min_length(3)).toBe("Mínimo 3 caracteres");
    expect(CREDIT_HUB_ES_DO.validation.age_min(18)).toBe("Edad mínima requerida: 18 años");
  });

  it("has document counter helper", () => {
    expect(CREDIT_HUB_ES_DO.documents.counter(2, 9)).toBe("2 de 9 documentos recibidos");
  });
});
