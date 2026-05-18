import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";

describe("bank application errors", () => {
  test("BankApplicationAuthError has stable name", () => {
    const e = new BankApplicationAuthError();
    expect(e.name).toBe("BankApplicationAuthError");
  });

  test("BankApplicationHttpError carries status and optional code", () => {
    const e = new BankApplicationHttpError("not found", 404, "NOT_FOUND");
    expect(e.status).toBe(404);
    expect(e.code).toBe("NOT_FOUND");
  });
});
