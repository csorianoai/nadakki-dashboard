jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { mapDocuments } from "@/lib/realtor/documentos/api";

const doc = { id: "d1", subject_type: "listing", doc_type: "listing_agreement", status: "active", title: "SYNTH Acuerdo" };

describe("mapDocuments (C-RE-OLA3 documentos)", () => {
  it("traduce DocumentView a fila", () => {
    expect(mapDocuments([doc])).toEqual([
      { id: "d1", name: "SYNTH Acuerdo", operation: { es: "Acuerdo de listado · Listado", en: "Listing agreement · Listing" }, status: "active" },
    ]);
  });
  it("descarta filas inválidas, nunca inventa", () => {
    expect(mapDocuments([{ ...doc, status: "x" }, { ...doc, doc_type: "x" }, { ...doc, title: "" }, { ...doc, id: null }, 5])).toEqual([]);
    expect(mapDocuments([])).toEqual([]);
  });
});
