import { assignContact, fetchPropertyAssignments, withdrawAssignment } from "@/lib/realtor/propiedades/asignaciones";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({}),
}));

const CID = "22222222-2222-4222-8222-222222222222";
const PID = "11111111-1111-4111-8111-111111111111";
const AID = "33333333-3333-4333-8333-333333333333";
const ok = (body: unknown, status = 200) => ({ status, json: async () => body });
const row = { id: AID, contact_id: CID, property_id: PID, assigned_at: "2026-10-24T01:00:00+00:00", withdrawn_at: null };
beforeEach(() => mockApiFetch.mockReset());

describe("assignContact: negativos primero", () => {
  it.each([[422, "validation"], [400, "validation"], [403, "forbidden"], [401, "forbidden"], [404, "notfound"], [409, "conflict"], [500, "other"]])(
    "estado %i → %s", async (status, reason) => {
      mockApiFetch.mockResolvedValue(ok({}, status as number));
      expect(await assignContact(CID, PID)).toEqual({ ok: false, reason });
    });
  it("red caída → other", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await assignContact(CID, PID)).toEqual({ ok: false, reason: "other" });
  });
  it("contacto vacío: no llama al servidor", async () => {
    expect(await assignContact("", PID)).toEqual({ ok: false, reason: "validation" });
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe("withdrawAssignment: negativos primero", () => {
  it.each([[403, "forbidden"], [404, "notfound"], [422, "validation"], [500, "other"]])("estado %i → %s", async (status, reason) => {
    mockApiFetch.mockResolvedValue(ok({}, status as number));
    expect(await withdrawAssignment(CID, AID)).toEqual({ ok: false, reason });
  });
});

describe("fetchPropertyAssignments", () => {
  it.each([403, 404, 422, 503])("estado %i → lista vacía", async (status) => {
    mockApiFetch.mockResolvedValue(ok({}, status));
    expect(await fetchPropertyAssignments(PID)).toEqual([]);
  });
  it("cuerpo sin items o red caída → lista vacía", async () => {
    mockApiFetch.mockResolvedValueOnce(ok({ nada: 1 }));
    expect(await fetchPropertyAssignments(PID)).toEqual([]);
    mockApiFetch.mockRejectedValueOnce(new Error("net"));
    expect(await fetchPropertyAssignments(PID)).toEqual([]);
  });
  it("descarta filas inválidas y no inventa", async () => {
    mockApiFetch.mockResolvedValue(ok({ items: [row, { id: AID }, null, "x"] }));
    expect(await fetchPropertyAssignments(PID)).toEqual([{ id: AID, contactId: CID, propertyId: PID, assignedAt: row.assigned_at }]);
  });
});

describe("positivo", () => {
  it("lee GET /properties/{id}/contacts", async () => {
    mockApiFetch.mockResolvedValue(ok({ items: [row] }));
    await fetchPropertyAssignments(PID);
    expect(mockApiFetch.mock.calls[0][0]).toBe(`/api/v1/realestate/properties/${PID}/contacts`);
  });
  it("asigna con POST /contacts/{id}/properties y solo property_id (sin tenant)", async () => {
    mockApiFetch.mockResolvedValue(ok(row, 201));
    expect(await assignContact(CID, PID)).toEqual({ ok: true });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(`/api/v1/realestate/contacts/${CID}/properties`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ property_id: PID });
  });
  it("retira con DELETE /contacts/{id}/properties/{assignment}", async () => {
    mockApiFetch.mockResolvedValue(ok({ ...row, withdrawn_at: "2026-10-25T00:00:00+00:00" }));
    expect(await withdrawAssignment(CID, AID)).toEqual({ ok: true });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(`/api/v1/realestate/contacts/${CID}/properties/${AID}`);
    expect(init.method).toBe("DELETE");
  });
});
