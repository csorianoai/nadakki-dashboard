const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

import { fetchDetail, fetchTemplates, openOperation, sendToReview, setMilestone, uploadDocument } from "@/components/realtor/operaciones/escritura";

const U = "00000000-0000-4000-8000-0000000052";
const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
beforeEach(() => mockApiFetch.mockReset());

describe("escritura de operaciones (APIs P3)", () => {
  it("abre la operación: POST sin tenant en el cuerpo, con parte y dinero como texto", async () => {
    mockApiFetch.mockResolvedValue(res(201, { id: `${U}01` }));
    const r = await openOperation({ propertyId: `${U}02`, templateId: `${U}03`, contactId: `${U}04`, price: "1800", currency: "USD" });
    expect(r).toEqual({ ok: true, id: `${U}01` });
    const [path, init] = mockApiFetch.mock.calls[0];
    expect(path).toBe("/api/v1/realestate/operations");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ kind: "rental", property_id: `${U}02`, template_id: `${U}03`, agreed_price: { amount: "1800", currency: "USD" }, parties: [{ contact_id: `${U}04`, role: "tenant" }] });
    expect(body).not.toHaveProperty("tenant_id");
  });
  it("sin contacto ni precio no manda parties ni agreed_price; un 422 se devuelve con su estado", async () => {
    mockApiFetch.mockResolvedValue(res(422));
    expect(await openOperation({ propertyId: `${U}02`, templateId: `${U}03` })).toEqual({ ok: false, status: 422 });
    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body)).toEqual({ kind: "rental", property_id: `${U}02`, template_id: `${U}03` });
  });
  it("un fallo de red no revienta: ok false, status 0", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await openOperation({ propertyId: "a", templateId: "b" })).toEqual({ ok: false, status: 0 });
  });
  it("lee plantillas activas de alquiler y el detalle con sus hitos", async () => {
    mockApiFetch.mockResolvedValueOnce(res(200, { items: [{ id: "t1", name: "Alquiler", kind: "rental", is_active: true }, { id: "t2", name: "Off", kind: "rental", is_active: false }], next_cursor: null }));
    expect(await fetchTemplates()).toEqual([{ id: "t1", name: "Alquiler" }]);
    expect(mockApiFetch.mock.calls[0][0]).toContain("/operation-templates?kind=rental");
    mockApiFetch.mockResolvedValueOnce(res(200, { operation: { id: "o1", status: "draft" }, milestones: [{ id: "m1", label: "Docs", position: 2, required: true, status: "pending" }, { id: "m0", label: "Inicio", position: 1, required: false, status: "done" }, { nope: 1 }] }));
    const d = await fetchDetail("o1");
    expect(d?.status).toBe("draft");
    expect(d?.milestones.map((m) => m.id)).toEqual(["m0", "m1"]);
    mockApiFetch.mockResolvedValueOnce(res(404));
    expect(await fetchDetail("o1")).toBeNull();
  });
  it("avanza un hito con PATCH y motivo solo si se omite", async () => {
    mockApiFetch.mockResolvedValue(res(200));
    expect(await setMilestone("o1", "m1", "done")).toEqual({ ok: true });
    expect(mockApiFetch.mock.calls[0][0]).toBe("/api/v1/realestate/operations/o1/milestones/m1");
    expect(mockApiFetch.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body)).toEqual({ status: "done" });
    await setMilestone("o1", "m1", "skipped", "no aplica");
    expect(JSON.parse(mockApiFetch.mock.calls[1][1].body)).toEqual({ status: "skipped", skip_reason: "no aplica" });
  });
  it("sube el documento: bytes en el cuerpo, metadatos en la query, sujeto = la operación", async () => {
    mockApiFetch.mockResolvedValue(res(201));
    const file = new File(["hola"], "contrato 1.pdf", { type: "application/pdf" });
    expect(await uploadDocument("o1", file, "lease_agreement", "Contrato")).toEqual({ ok: true });
    const [path, init] = mockApiFetch.mock.calls[0];
    const q = new URL(path, "http://x").searchParams;
    expect(Object.fromEntries(q)).toEqual({ subject_type: "operation", subject_id: "o1", doc_type: "lease_agreement", title: "Contrato", file_name: "contrato 1.pdf" });
    expect(init.body).toBe(file);
    expect(init.headers["Content-Type"]).toBe("application/pdf");
  });
  it("envía a revisión con solo operation_id; 409 = ya hay una pendiente", async () => {
    mockApiFetch.mockResolvedValue(res(409));
    expect(await sendToReview("o1")).toEqual({ ok: false, status: 409 });
    expect(mockApiFetch.mock.calls[0][0]).toBe("/api/v1/realestate/broker-desk/items");
    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body)).toEqual({ operation_id: "o1" });
  });
});
