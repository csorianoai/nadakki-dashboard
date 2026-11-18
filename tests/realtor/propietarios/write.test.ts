import { buildMandateBody, createMandate, EMPTY_MANDATE, fetchContactOptions, fetchPropertyOptions, missingMandateFields } from "@/lib/realtor/propietarios/write";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({}),
}));

const CID = "22222222-2222-4222-8222-222222222222";
const PID = "11111111-1111-4111-8111-111111111111";
const ok = (body: unknown, status = 200) => ({ status, json: async () => body });
const full = { ...EMPTY_MANDATE, contactId: CID, role: "landlord", propertyId: PID, kind: "exclusive", sharePct: "100", startsOn: "2026-10-01" };
beforeEach(() => mockApiFetch.mockReset());

describe("createMandate: negativos primero", () => {
  it.each([[422, "validation"], [400, "validation"], [403, "forbidden"], [401, "forbidden"], [404, "notfound"], [409, "conflict"], [500, "other"]])(
    "estado %i → %s", async (status, reason) => {
      mockApiFetch.mockResolvedValue(ok({}, status as number));
      expect(await createMandate(full)).toEqual({ ok: false, reason });
    });
  it("red caída → other", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await createMandate(full)).toEqual({ ok: false, reason: "other" });
  });
  it("formulario inválido: no llama al servidor", async () => {
    expect(await createMandate(EMPTY_MANDATE)).toEqual({ ok: false, reason: "validation" });
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe("missingMandateFields", () => {
  it("vacío: faltan contacto, rol, propiedad, tipo, participación e inicio", () => {
    expect(missingMandateFields(EMPTY_MANDATE)).toEqual(["contactId", "role", "propertyId", "kind", "sharePct", "startsOn"]);
  });
  it("completo: nada falta", () => expect(missingMandateFields(full)).toEqual([]));
  it("participación fuera de rango o con formato inválido, y fin anterior al inicio", () => {
    expect(missingMandateFields({ ...full, sharePct: "0" })).toEqual(["sharePct"]);
    expect(missingMandateFields({ ...full, sharePct: "100.01" })).toEqual(["sharePct"]);
    expect(missingMandateFields({ ...full, sharePct: "abc" })).toEqual(["sharePct"]);
    expect(missingMandateFields({ ...full, commissionPct: "x" })).toEqual(["commissionPct"]);
    expect(missingMandateFields({ ...full, endsOn: "2026-09-01" })).toEqual(["endsOn"]);
  });
});

describe("buildMandateBody / positivo", () => {
  it("solo lo escrito y nunca el tenant", () => {
    const b = buildMandateBody({ ...full, endsOn: "2027-10-01", commissionPct: "3" });
    expect(b).toEqual({ contact_id: CID, role: "landlord", property_id: PID, kind: "exclusive", share_pct: "100", starts_on: "2026-10-01",
      ends_on: "2027-10-01", commission_pct: "3", status: "draft" });
    expect(JSON.stringify(b)).not.toMatch(/tenant/i);
  });
  it("POST /owners devuelve ok y no manda tenant", async () => {
    mockApiFetch.mockResolvedValue(ok({ id: "x" }, 201));
    expect(await createMandate(full)).toEqual({ ok: true });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe("/api/v1/realestate/owners");
    expect(init.method).toBe("POST");
    expect(JSON.stringify(mockApiFetch.mock.calls)).not.toMatch(/tenant/i);
  });
});

describe("opciones", () => {
  it("contactos y propiedades; fallo → lista vacía", async () => {
    mockApiFetch.mockResolvedValueOnce(ok({ items: [{ id: CID, display_label: "Ana P." }, { id: 5 }] }));
    expect(await fetchContactOptions()).toEqual([{ id: CID, label: "Ana P." }]);
    mockApiFetch.mockResolvedValueOnce(ok({ items: [{ id: PID, address: { country: "DO", city: "Santiago", street_line_1: "Calle 1" } }] }));
    expect(await fetchPropertyOptions()).toEqual([{ id: PID, label: "Calle 1, Santiago, DO" }]);
    mockApiFetch.mockResolvedValueOnce(ok({}, 503));
    expect(await fetchPropertyOptions()).toEqual([]);
    mockApiFetch.mockRejectedValueOnce(new Error("net"));
    expect(await fetchContactOptions()).toEqual([]);
  });
});
