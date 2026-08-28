import { applicationFieldsPatchBody, patchApplicationFields } from "@/lib/credit-hub/api/operationalClient";

describe("application fields patch contract", () => {
  test("uses the backend changes key", () => {
    expect(applicationFieldsPatchBody({ telefono_celular: "8095550000" })).toEqual({
      changes: { telefono_celular: "8095550000" },
    });
  });

  test("mutation back to fields fails the contract", () => {
    const body = applicationFieldsPatchBody({ requested_amount: "100" });
    expect(body).toHaveProperty("changes");
    expect(body).not.toHaveProperty("fields");
  });

  test("asks the server with flat fields and accepts its 200 response", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
      {
        ok: true,
        status: 200,
        clone: () => ({ json: async () => ({ edit_count: 1 }) }),
      } as Response,
    );
    globalThis.fetch = fetchMock;

    await expect(
      patchApplicationFields({
        tenantId: "tenant-a",
        applicationId: "app-a",
        fields: { telefono_celular: "8095550000", plazo_meses: 48 },
      }),
    ).resolves.toEqual({ edit_count: 1 });

    const request = fetchMock.mock.calls[0];
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      changes: { telefono_celular: "8095550000", plazo_meses: 48 },
    });
    globalThis.fetch = originalFetch;
  });

  test("mutation with nested applicant payload is rejected before a request", () => {
    expect(() => applicationFieldsPatchBody({ applicant: { full_name: "Ana" } })).toThrow(/campos planos/);
  });
});
