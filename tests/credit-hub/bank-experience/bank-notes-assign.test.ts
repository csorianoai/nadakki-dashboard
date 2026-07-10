import { isBankExperienceEndpointUnavailable } from "@/lib/credit-hub/api/bankExperienceClient";
import {
  initialsFromName,
  isBankNotesRole,
  isBankSupervisorRole,
  noteCategoryMeta,
} from "@/lib/credit-hub/bank/bankExperienceHelpers";
import { CHApiError } from "@/lib/credit-hub/api/client";

describe("bankExperienceHelpers", () => {
  test("bank notes role includes analyst and admin", () => {
    expect(isBankNotesRole("bank_analyst")).toBe(true);
    expect(isBankNotesRole("bank_admin")).toBe(true);
    expect(isBankNotesRole("dealer")).toBe(false);
    expect(isBankNotesRole("credit_admin")).toBe(false);
  });

  test("supervisor role for reassignment", () => {
    expect(isBankSupervisorRole("bank_admin")).toBe(true);
    expect(isBankSupervisorRole("bank_analyst")).toBe(false);
  });

  test("initialsFromName", () => {
    expect(initialsFromName("María López")).toBe("ML");
    expect(initialsFromName("Ana")).toBe("AN");
  });

  test("note category colors", () => {
    expect(noteCategoryMeta("RIESGO").label).toBe("Riesgo");
    expect(noteCategoryMeta("COMPLIANCE").label).toBe("Compliance");
    expect(noteCategoryMeta("SEGUIMIENTO").label).toBe("Seguimiento");
    expect(noteCategoryMeta("GENERAL").label).toBe("General");
  });
});

describe("bankExperienceClient", () => {
  test("404 marks endpoint unavailable", () => {
    expect(isBankExperienceEndpointUnavailable(new CHApiError("nf", 404))).toBe(true);
    expect(isBankExperienceEndpointUnavailable(new CHApiError("nf", 500))).toBe(false);
  });
});
