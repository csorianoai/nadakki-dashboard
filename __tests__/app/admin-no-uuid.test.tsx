/** @jest-environment jsdom */
import React from "react";
import { render, waitFor } from "@testing-library/react";

const A = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let mockAuth: { tenantId: string | null; tenantName: string } = { tenantId: A, tenantName: "Mapaal" };
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockAuth.tenantId }) }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/components/ui/NavigationBar", () => ({ __esModule: true, default: () => null }));
jest.mock("@/lib/api/qa", () => ({
  getAuthMetaStatus: jest.fn().mockResolvedValue({}),
  getAuthGoogleStatus: jest.fn().mockResolvedValue({}),
  testAgentDryRun: jest.fn().mockResolvedValue({}),
}));

const PAGES: [string, () => { default: React.ComponentType }][] = [
  ["api-keys", () => require("@/app/admin/api-keys/page")],
  ["billing", () => require("@/app/admin/billing/page")],
  ["usage", () => require("@/app/admin/usage/page")],
  ["qa", () => require("@/app/admin/qa/page")],
  ["landing-readiness", () => require("@/app/advertising/landing-readiness/page")],
  ["audit", () => require("@/app/audit/page")],
];

beforeEach(() => {
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}), text: async () => "{}" });
});

describe.each(PAGES)("%s: sin UUID visible", (_n, load) => {
  it("muestra el nombre del tenant, el id solo en atributos", async () => {
    mockAuth = { tenantId: A, tenantName: "Mapaal" };
    const Page = load().default;
    const { container } = render(<Page />);
    await waitFor(() => expect(container.textContent).toContain("Mapaal"));
    expect(container.textContent).not.toMatch(UUID_RE);
  });
  it("sin nombre disponible muestra «—», nunca el UUID", async () => {
    mockAuth = { tenantId: A, tenantName: "—" };
    const Page = load().default;
    const { container } = render(<Page />);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.textContent).not.toMatch(UUID_RE);
  });
});
