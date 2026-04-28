import { z } from "zod";
import { registerCreditHubSpanishZodErrorMap } from "@/lib/credit-hub/i18n/zod-error-map";

describe("Zod Spanish error map (credit-hub)", () => {
  beforeAll(() => {
    registerCreditHubSpanishZodErrorMap();
  });

  it("returns Spanish for invalid email", () => {
    const result = z.string().email().safeParse("not-an-email");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Correo electrónico inválido");
    }
  });

  it("returns Spanish for min length", () => {
    const result = z.string().min(5).safeParse("abc");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Mínimo 5 caracteres");
    }
  });

  it("returns Spanish for invalid date", () => {
    const result = z.coerce.date().safeParse("not-a-date");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBeTruthy();
    }
  });
});
