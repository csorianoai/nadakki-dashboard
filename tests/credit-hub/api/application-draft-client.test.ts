import { getApplicationDraft } from "@/lib/credit-hub/api/creditCoreClient";

const tenantId = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

function mockFetch(body: unknown) {
  Object.defineProperty(global, "fetch", {
    value: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      clone: () => ({ json: async () => body }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
    writable: true,
    configurable: true,
  });
}

describe("getApplicationDraft (respuesta real de DB-CODEX-12A)", () => {
  test("desempaqueta {data:{form_data}} y lee expires_at de la raíz", async () => {
    mockFetch({
      data: { form_data: { campo_a: "valor-a", campo_b: "valor-b" } },
      saved_at: "2026-10-17T10:00:00Z",
      expires_at: "2026-10-24T10:00:00Z",
    });
    const draft = await getApplicationDraft({ tenantId, applicationId: "app-1" });
    expect(draft).toEqual({
      formData: { campo_a: "valor-a", campo_b: "valor-b" },
      expiresAt: "2026-10-24T10:00:00Z",
    });
  });

  test("acepta data plano (formulario enviado sin envoltorio)", async () => {
    mockFetch({ data: { campo_a: "valor-a" }, expires_at: null });
    const draft = await getApplicationDraft({ tenantId, applicationId: "app-1" });
    expect(draft).toEqual({ formData: { campo_a: "valor-a" }, expiresAt: null });
  });

  test("conserva la forma plana anterior (form_data en la raíz)", async () => {
    mockFetch({ form_data: { campo_a: "valor-a" }, expires_at: "2026-10-24T10:00:00Z" });
    const draft = await getApplicationDraft({ tenantId, applicationId: "app-1" });
    expect(draft?.formData).toEqual({ campo_a: "valor-a" });
  });

  test("sin datos devuelve null", async () => {
    mockFetch({ saved_at: "x" });
    expect(await getApplicationDraft({ tenantId, applicationId: "app-1" })).toBeNull();
  });
});
