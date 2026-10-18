/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { TenantLabel } from "@/components/ui/TenantLabel";

const UUID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let mockAuth: { tenantId: string | null; tenantName: string } = { tenantId: UUID, tenantName: "Mapaal" };
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockAuth.tenantId }) }));

describe("TenantLabel", () => {
  it("muestra el nombre del tenant y deja el id solo en title", () => {
    mockAuth = { tenantId: UUID, tenantName: "Mapaal" };
    const { container } = render(<TenantLabel prefix="Tenant: " />);
    expect(container.textContent).toBe("Tenant: Mapaal");
    expect(container.textContent).not.toMatch(UUID_RE);
    expect(screen.getByText("Tenant: Mapaal").getAttribute("title")).toBe(UUID);
  });
  it("sin nombre muestra «—», nunca el UUID", () => {
    mockAuth = { tenantId: UUID, tenantName: "—" };
    const { container } = render(<TenantLabel prefix="Tenant: " />);
    expect(container.textContent).toBe("Tenant: —");
  });
  it("si el nombre es un UUID muestra «—»", () => {
    mockAuth = { tenantId: UUID, tenantName: UUID };
    const { container } = render(<TenantLabel />);
    expect(container.textContent).toBe("—");
  });
});

describe("pantallas corregidas no pintan UUID", () => {
  const pages = ["admin/api-keys", "admin/billing", "admin/qa", "admin/usage", "advertising/landing-readiness"];
  it.each(pages)("%s usa TenantLabel y no interpola tenantId en texto", (p) => {
    const src = require("fs").readFileSync(`app/${p}/page.tsx`, "utf8") as string;
    expect(src).toContain("TenantLabel");
    expect(src).not.toMatch(/Tenant: \{(tenantId|effectiveTenant)/);
    expect(src).not.toMatch(/font-mono">\{tenantId\}/);
  });
});
