import { BANK_APPLICATION_AUTH_TOKEN_KEY } from "@/lib/bank-application-detail/constants";
import { buildDecideHeaders, newIdempotencyKey, submitBankDecision } from "@/lib/bank-decision/submit-decision";
import { makeBankTestJwt } from "../bank-application-detail/test-token";

describe("submit-decision", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    localStorage.clear();
  });

  test("newIdempotencyKey returns string", () => {
    expect(typeof newIdempotencyKey()).toBe("string");
    expect(newIdempotencyKey().length).toBeGreaterThan(10);
  });

  test("buildDecideHeaders includes role actor and idempotency", () => {
    const jwt = makeBankTestJwt("tenant-a");
    const h = buildDecideHeaders(jwt, "actor-uuid-1", "idem-1");
    expect(h.Authorization).toContain("Bearer");
    expect(h["X-Tenant-ID"]).toBe("tenant-a");
    expect(h["X-Role"]).toBe("BANK_ANALYST");
    expect(h["X-Actor-ID"]).toBe("actor-uuid-1");
    expect(h["Idempotency-Key"]).toBe("idem-1");
  });

  test("submitBankDecision parses 200 JSON", async () => {
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("t"));
    const body = {
      decision_id: "d1",
      application_id: "a1",
      decision_type: "APPROVE",
      decided_at: "2026-01-01T12:00:00Z",
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body }) as unknown as typeof fetch;
    const out = await submitBankDecision(
      "a1",
      { decision_type: "APPROVE", reason_codes: ["RC001_APPROVE"], adverse_action: false },
      "11111111-1111-4111-8111-111111111111",
    );
    expect(out.decision_id).toBe("d1");
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toContain("/api/v2/credit/applications/a1/decide");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body).decision_type).toBe("APPROVE");
  });

  test("serializes the full approved contract and strips legacy fields at the HTTP boundary", async () => {
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("t"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ decision_id: "d1", application_id: "a1", decision_type: "APPROVE", decided_at: "2026-01-01T12:00:00Z" }),
    }) as unknown as typeof fetch;

    await submitBankDecision(
      "a1",
      {
        decision_type: "APPROVE",
        reason_codes: [],
        notes: "Notas del analista",
        approved_terms: { approved_amount: 555555, interest_rate: 9.5, term_months: 60 },
        lender_code: "pilot",
        justification: "Campo legacy no permitido",
      } as never,
      "11111111-1111-4111-8111-111111111111",
    );

    const payload = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(payload).toMatchObject({
      decision_type: "APPROVE",
      reason_codes: ["RC001_APPROVE"],
      approved_terms: { approved_amount: 555555, interest_rate: 9.5, term_months: 60 },
      notes: "Notas del analista",
    });
    expect(payload).not.toHaveProperty("lender_code");
    expect(payload).not.toHaveProperty("justification");
  });

  test("submitBankDecision maps 409 to HttpError", async () => {
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("t"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ code: "CONFLICT" }),
    }) as unknown as typeof fetch;
    await expect(
      submitBankDecision(
        "a1",
        { decision_type: "APPROVE", reason_codes: ["RC001_APPROVE"], adverse_action: false },
        "11111111-1111-4111-8111-111111111111",
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
