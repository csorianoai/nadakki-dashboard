jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { mapOwners } from "@/lib/realtor/propietarios/api";

const contact = { id: "00000000-0000-4000-8000-00000000c001", kind: "person", display_label: "SYNTH A.", active_roles: ["landlord"] };
const owner = { contact, owner_roles: ["landlord"], mandates_active: 2, properties_count: 3, metrics: [] };

describe("mapOwners (C-RE-OLA3)", () => {
  it("traduce rol, acuerdo y cantidad; no inventa propiedad ni precio", () => {
    expect(mapOwners([owner])).toEqual([
      { id: `${contact.id}:arrendador`, name: "SYNTH A.", role: "arrendador", property: null, propertiesCount: 3, priceUsd: null, agreement: "vigente", stage: null, followUp: null },
    ]);
  });
  it("una fila por rol vigente y sin mandatos activos el acuerdo es null", () => {
    const rows = mapOwners([{ ...owner, owner_roles: ["landlord", "seller"], mandates_active: 0 }]);
    expect(rows.map((r) => r.role)).toEqual(["arrendador", "vendedor"]);
    expect(rows.every((r) => r.agreement === null)).toBe(true);
  });
  it("descarta filas inválidas, nunca inventa", () => {
    expect(mapOwners([5, { ...owner, contact: {} }, { ...owner, owner_roles: ["tenant"] }, { contact }])).toEqual([]);
  });
});
