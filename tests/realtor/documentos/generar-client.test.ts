import { generateDocument, GEN_DOC_TYPES } from "@/lib/realtor/documentos/generate";
import { COPY } from "@/lib/realtor/documentos/copy";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const OP = "11111111-1111-4111-8111-111111111111";

beforeEach(() => mockApiFetch.mockReset());

describe("generateDocument: negativos primero", () => {
  it.each([
    [403, "forbidden"],
    [404, "not_found"],
    [409, "conflict"],
    [422, "invalid"],
    [502, "storage"],
    [500, "error"],
  ])("%s -> %s", async (status, reason) => {
    mockApiFetch.mockResolvedValue({ status });
    expect(await generateDocument(OP, "lease_agreement")).toEqual({ ok: false, reason });
  });

  it("un fallo de red se traduce a error, sin lanzar", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await generateDocument(OP, "receipt")).toEqual({ ok: false, reason: "error" });
  });

  it("cada causa tiene texto ES y EN", () => {
    for (const k of ["forbidden", "genNotFound", "genConflict", "genInvalid", "genStorage", "genError", "genOk"] as const) {
      expect(COPY.es[k]).toBeTruthy();
      expect(COPY.en[k]).toBeTruthy();
    }
    for (const t of GEN_DOC_TYPES) expect(COPY.es.genDocTypes[t] && COPY.en.genDocTypes[t]).toBeTruthy();
  });
});

describe("generateDocument: positivo", () => {
  it("201: POST sin cuerpo ni tenant, con doc_type en la query", async () => {
    mockApiFetch.mockResolvedValue({ status: 201 });
    expect(await generateDocument(OP, "sale_contract")).toEqual({ ok: true });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(`/api/v1/realestate/operations/${OP}/documents/generate?doc_type=sale_contract`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });
});
