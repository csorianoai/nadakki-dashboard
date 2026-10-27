import { buildBody, createProperty, EMPTY_FORM, fetchOwnerOptions, fetchPropertyForm, missingFields, updateProperty } from "@/lib/realtor/propiedades/write";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({}),
}));

const PID = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";
const ok = (body: unknown, status = 200) => ({ status, json: async () => body });
beforeEach(() => mockApiFetch.mockReset());

describe("buildBody", () => {
  it("alta: solo lo escrito, dirección con país, unidad con habitaciones y baños como texto", () => {
    const b = buildBody({ ...EMPTY_FORM, country: "DO", city: "Santo Domingo", jurisdiction: "DO", propertyType: "house",
      ownerId: OWNER, unitLabel: "A1", bedrooms: "3", bathrooms: "2.5" });
    expect(b).toEqual({ address: { country: "DO", city: "Santo Domingo" }, jurisdiction: "DO", property_type: "house",
      owner_contact_id: OWNER, unit: { unit_label: "A1", bedrooms: 3, bathrooms: "2.5" } });
    expect(JSON.stringify(b)).not.toMatch(/tenant/i);
  });
  it("sin unidad ni propietario no los envía", () => {
    const b = buildBody({ ...EMPTY_FORM, country: "DO", jurisdiction: "DO", propertyType: "land" });
    expect(b).toEqual({ address: { country: "DO" }, jurisdiction: "DO", property_type: "land" });
  });
});

describe("missingFields", () => {
  it("vacío: faltan país, jurisdicción y tipo", () => {
    expect(missingFields(EMPTY_FORM)).toEqual(["country", "jurisdiction", "propertyType"]);
  });
  it("completo y con formato válido: nada falta", () => {
    expect(missingFields({ ...EMPTY_FORM, country: "DO", jurisdiction: "DO", propertyType: "house", yearBuilt: "1999" })).toEqual([]);
  });
  it("año o unidad con formato inválido se marcan", () => {
    const f = { ...EMPTY_FORM, country: "DO", jurisdiction: "DO", propertyType: "house", yearBuilt: "99", unitLabel: "A1", bedrooms: "x" };
    expect(missingFields(f)).toEqual(["yearBuilt", "unit"]);
  });
});

describe("createProperty / updateProperty", () => {
  const form = { ...EMPTY_FORM, country: "DO", jurisdiction: "DO", propertyType: "house" };
  it("POST /properties devuelve el id y no manda tenant", async () => {
    mockApiFetch.mockResolvedValue(ok({ id: PID }, 201));
    expect(await createProperty(form)).toEqual({ ok: true, id: PID });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe("/api/v1/realestate/properties");
    expect(init.method).toBe("POST");
    expect(JSON.stringify(mockApiFetch.mock.calls)).not.toMatch(/tenant/i);
  });
  it("PATCH /properties/{id}; sin propietario envía owner_contact_id null (desasigna)", async () => {
    mockApiFetch.mockResolvedValue(ok({ id: PID }));
    expect(await updateProperty(PID, form)).toEqual({ ok: true, id: PID });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(`/api/v1/realestate/properties/${PID}`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body).owner_contact_id).toBeNull();
  });
  it.each([[422, "validation"], [400, "validation"], [403, "forbidden"], [401, "forbidden"], [404, "notfound"], [500, "other"]])(
    "estado %i → %s", async (status, reason) => {
      mockApiFetch.mockResolvedValue(ok({}, status as number));
      expect(await createProperty(form)).toEqual({ ok: false, reason });
    });
  it("red caída → other", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await createProperty(form)).toEqual({ ok: false, reason: "other" });
  });
});

describe("fetchPropertyForm / fetchOwnerOptions", () => {
  it("precarga la ficha con la primera unidad", async () => {
    mockApiFetch.mockResolvedValue(ok({ id: PID, address: { country: "DO", city: "Santiago" }, jurisdiction: "DO", property_type: "house",
      year_built: 1999, owner_contact_id: OWNER, units: [{ unit_label: "A1", bedrooms: 2, bathrooms: "1.5" }] }));
    expect(await fetchPropertyForm(PID)).toMatchObject({ country: "DO", city: "Santiago", yearBuilt: "1999", ownerId: OWNER, unitLabel: "A1", bedrooms: "2", bathrooms: "1.5" });
  });
  it("404 o red caída → null", async () => {
    mockApiFetch.mockResolvedValueOnce(ok({}, 404));
    expect(await fetchPropertyForm(PID)).toBeNull();
    mockApiFetch.mockRejectedValueOnce(new Error("net"));
    expect(await fetchPropertyForm(PID)).toBeNull();
  });
  it("propietarios desde GET /contacts; fallo → lista vacía", async () => {
    mockApiFetch.mockResolvedValueOnce(ok({ items: [{ id: OWNER, kind: "person", display_label: "María P." }, { id: 5 }], next_cursor: null }));
    expect(await fetchOwnerOptions()).toEqual([{ id: OWNER, label: "María P." }]);
    mockApiFetch.mockResolvedValueOnce(ok({}, 403));
    expect(await fetchOwnerOptions()).toEqual([]);
  });
});
