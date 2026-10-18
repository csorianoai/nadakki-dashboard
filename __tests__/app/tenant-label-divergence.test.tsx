/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import { TenantLabel } from "@/components/ui/TenantLabel";

const SESSION_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const OTHER_ID = "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let mockAuth = { tenantId: SESSION_ID as string | null, tenantName: "Mapaal" };
let mockCtxId: string | null = SESSION_ID;
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockCtxId }) }));

describe("TenantLabel: el nombre solo se muestra si corresponde al id operativo", () => {
  it("ids iguales: muestra el nombre", () => {
    mockAuth = { tenantId: SESSION_ID, tenantName: "Mapaal" };
    mockCtxId = SESSION_ID;
    expect(render(<TenantLabel />).container.textContent).toBe("Mapaal");
  });
  it("TenantContext apunta a otro tenant: «—», nunca el nombre de la sesión ni el UUID", () => {
    mockAuth = { tenantId: SESSION_ID, tenantName: "Mapaal" };
    mockCtxId = OTHER_ID;
    const { container } = render(<TenantLabel prefix="Tenant: " />);
    expect(container.textContent).toBe("Tenant: —");
    expect(container.textContent).not.toMatch(UUID_RE);
  });
  it("prop tenantId (id real de la petición) distinto del de sesión: «—»", () => {
    mockAuth = { tenantId: SESSION_ID, tenantName: "Mapaal" };
    mockCtxId = SESSION_ID;
    const { container } = render(<TenantLabel tenantId="fallback-tenant" />);
    expect(container.textContent).toBe("—");
  });
  it("prop tenantId igual al de sesión: nombre, id solo en title", () => {
    mockAuth = { tenantId: SESSION_ID, tenantName: "Mapaal" };
    mockCtxId = OTHER_ID;
    const { container } = render(<TenantLabel tenantId={SESSION_ID} />);
    expect(container.textContent).toBe("Mapaal");
    expect(container.querySelector("span")?.getAttribute("title")).toBe(SESSION_ID);
  });
  it("sin id operativo: «—»", () => {
    mockAuth = { tenantId: SESSION_ID, tenantName: "Mapaal" };
    mockCtxId = null;
    expect(render(<TenantLabel />).container.textContent).toBe("—");
  });
});
