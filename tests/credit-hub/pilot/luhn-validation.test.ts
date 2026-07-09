import { validateDominicanCedula } from "@/lib/credit/validators/dominican-id";

describe("luhn-validation (cédula DO)", () => {
  it("rejects invalid checksum", () => {
    expect(validateDominicanCedula("12345678901")).toBe(false);
  });

  it("accepts valid test cédula", () => {
    expect(validateDominicanCedula("05300030532")).toBe(true);
  });
});
