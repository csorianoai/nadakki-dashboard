/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import { TenantLabel, hideUuids } from "@/components/ui/TenantLabel";

const A = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const B = "9d1e7a20-1b3c-4d5e-8f60-71829a3b4c5d";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let mockAuth: { tenantId: string | null; tenantName: string } = { tenantId: A, tenantName: "Mapaal" };
let mockCtxId: string | null = A;
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockCtxId }) }));

describe("TenantLabel: nombre solo si el id coincide con la sesión", () => {
  it("coinciden → nombre", () => {
    mockAuth = { tenantId: A, tenantName: "Mapaal" };
    mockCtxId = A;
    expect(render(<TenantLabel />).container.textContent).toBe("Mapaal");
  });
  it("el contexto diverge de la sesión → «—», id solo en atributos", () => {
    mockAuth = { tenantId: A, tenantName: "Mapaal" };
    mockCtxId = B;
    const { container } = render(<TenantLabel prefix="Tenant: " />);
    expect(container.textContent).toBe("Tenant: —");
    expect(container.textContent).not.toMatch(UUID_RE);
    expect(container.querySelector("span")?.getAttribute("data-id")).toBe(B);
  });
  it("sin tenant en el contexto (FALLBACK) → «—»", () => {
    mockAuth = { tenantId: A, tenantName: "Mapaal" };
    mockCtxId = null;
    expect(render(<TenantLabel />).container.textContent).toBe("—");
  });
  it("id explícito: coincide → nombre; otro tenant → «—»", () => {
    mockAuth = { tenantId: A, tenantName: "Mapaal" };
    mockCtxId = A;
    expect(render(<TenantLabel id={A} />).container.textContent).toBe("Mapaal");
    expect(render(<TenantLabel id={B} />).container.textContent).toBe("—");
  });
});

describe("hideUuids", () => {
  it("sustituye un UUID por «—» y deja el resto", () => {
    expect(JSON.parse(JSON.stringify({ id: A, n: "Mapaal", k: 3 }, hideUuids))).toEqual({ id: "—", n: "Mapaal", k: 3 });
  });
});
