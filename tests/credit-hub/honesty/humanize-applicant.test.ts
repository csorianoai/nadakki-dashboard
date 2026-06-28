import { humanizeApplicant, shortFolio } from "@/lib/credit-hub/honesty/humanize-applicant";

describe("humanizeApplicant", () => {
  const base = {
    application_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    applicant_name: "",
    vehicle_make: null,
    vehicle_model: null,
    vehicle_year: null,
    requested_amount: "500000",
  };

  test("never uses raw UUID as primary label", () => {
    const h = humanizeApplicant(base, "DOP");
    expect(h.primaryLabel).toContain("Sin datos de cliente");
    expect(h.primaryLabel).not.toBe(base.application_id);
    expect(h.hasClientData).toBe(false);
  });

  test("shows real name when present", () => {
    const h = humanizeApplicant({ ...base, applicant_name: "María López" }, "DOP");
    expect(h.primaryLabel).toBe("María López");
    expect(h.hasClientData).toBe(true);
  });

  test("shortFolio truncates long ids", () => {
    expect(shortFolio(base.application_id)).toMatch(/^…/);
  });
});
