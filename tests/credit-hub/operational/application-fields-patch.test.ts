import { applicationFieldsPatchBody } from "@/lib/credit-hub/api/operationalClient";

describe("application fields patch contract", () => {
  test("uses the backend changes key", () => {
    expect(applicationFieldsPatchBody({ applicant: { full_name: "Ana" } })).toEqual({
      changes: { applicant: { full_name: "Ana" } },
    });
  });

  test("mutation back to fields fails the contract", () => {
    const body = applicationFieldsPatchBody({ requested_amount: "100" });
    expect(body).toHaveProperty("changes");
    expect(body).not.toHaveProperty("fields");
  });
});
