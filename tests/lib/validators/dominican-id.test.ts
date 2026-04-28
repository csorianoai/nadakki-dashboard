import { validateDominicanCedula, validatePassport } from "@/lib/credit/validators/dominican-id";

function withCheckDigit(firstTen: string): string {
  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    let product = Number(firstTen[i]) * multipliers[i];
    if (product >= 10) product = Math.floor(product / 10) + (product % 10);
    sum += product;
  }
  return `${firstTen}${(10 - (sum % 10)) % 10}`;
}

describe("validateDominicanCedula", () => {
  test("accepts valid cedulas using Dominican check digit", () => {
    const seeds = ["0010000000", "0311234567", "0530003053", "4021239876", "2234567890"];
    for (const seed of seeds) {
      expect(validateDominicanCedula(withCheckDigit(seed))).toBe(true);
    }
  });

  test("rejects invalid check digits and malformed values", () => {
    expect(validateDominicanCedula("05300030531")).toBe(false);
    expect(validateDominicanCedula("")).toBe(false);
    expect(validateDominicanCedula("abc")).toBe(false);
    expect(validateDominicanCedula("001-123")).toBe(false);
  });
});

describe("validatePassport", () => {
  test("accepts alphanumeric passports length 6 to 15", () => {
    expect(validatePassport("A123456")).toBe(true);
    expect(validatePassport("ab123456789")).toBe(true);
  });

  test("rejects invalid passports", () => {
    expect(validatePassport("A12")).toBe(false);
    expect(validatePassport("ABC 123")).toBe(false);
  });
});
