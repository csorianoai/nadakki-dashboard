/** @jest-environment jsdom */
// PS-8-UUIDS (a)(b)(c): renderiza cada pantalla corregida con contextos y fetch simulados
// (la API devuelve el UUID del tenant) y comprueba el texto visible, no el código fuente.
import React from "react";
import { render, act, cleanup, fireEvent } from "@testing-library/react";

const UUID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let mockName = "Mapaal";
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true, tenantId: UUID, tenantName: mockName, role: "admin", plan: "pro",
    isLoading: false, error: null, login: async () => true, logout: () => {},
  }),
}));
jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    tenantId: UUID, settings: { name: "—", features: {}, limits: {} }, setTenantId: () => {},
    updateSettings: () => {}, isFeatureEnabled: () => false, checkLimit: () => true,
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({ tenantId: UUID }),
}));

const body = { tenant_id: UUID, tenantId: UUID, id: UUID, ok: true };
beforeEach(() => {
  // jsdom no trae Response: respuesta mínima compatible con lo que leen las pantallas.
  const res = () => ({
    ok: true, status: 200, statusText: "OK",
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "application/json" : null) },
    json: async () => body, text: async () => JSON.stringify(body), clone: res,
  });
  global.fetch = jest.fn(async () => res()) as unknown as typeof fetch;
});
afterEach(cleanup);

/* eslint-disable @typescript-eslint/no-require-imports */
const screens: Array<[string, () => React.ReactElement]> = [
  ["app/admin/api-keys/page.tsx", () => React.createElement(require("@/app/admin/api-keys/page").default)],
  ["app/admin/billing/page.tsx", () => React.createElement(require("@/app/admin/billing/page").default)],
  ["app/admin/config/page.tsx", () => React.createElement(require("@/app/admin/config/page").default)],
  ["app/admin/qa/page.tsx", () => React.createElement(require("@/app/admin/qa/page").default)],
  ["app/admin/usage/page.tsx", () => React.createElement(require("@/app/admin/usage/page").default)],
  ["app/admin/whatsapp/page.tsx", () => React.createElement(require("@/app/admin/whatsapp/page").default)],
  ["app/admin/sales-scripts/page.tsx", () => React.createElement(require("@/app/admin/sales-scripts/page").default)],
  ["app/admin/onboarding/page.tsx", () => React.createElement(require("@/app/admin/onboarding/page").default)],
  ["app/advertising/landing-readiness/page.tsx", () => React.createElement(require("@/app/advertising/landing-readiness/page").default)],
  ["app/audit/page.tsx", () => React.createElement(require("@/app/audit/page").default)],
  ["app/sic/multitenant-config/page.tsx", () => React.createElement(require("@/app/sic/multitenant-config/page").default)],
  ["app/agents/execute/page.tsx", () => React.createElement(require("@/app/agents/execute/page").default)],
  ["app/billing/BillingPageClient.tsx", () => React.createElement(require("@/app/billing/BillingPageClient").default)],
  ["app/marketing/social-connections/SocialConnectionsClient.tsx", () => React.createElement(require("@/app/marketing/social-connections/SocialConnectionsClient").default)],
  ["app/credit/page.tsx", () => React.createElement(require("@/app/credit/page").default)],
  ["app/credit/new/NewApplicationClient.tsx", () => React.createElement(require("@/app/credit/new/NewApplicationClient").default)],
  ["app/tenants/[tenantId]/page.tsx", () => React.createElement(require("@/app/tenants/[tenantId]/page").default)],
];
/* eslint-enable @typescript-eslint/no-require-imports */

async function renderSettled(el: React.ReactElement) {
  let r!: ReturnType<typeof render>;
  await act(async () => {
    r = render(el);
  });
  await act(async () => {
    await new Promise((res) => setTimeout(res, 0));
  });
  return r.container;
}

describe("pantallas corregidas: el texto visible nunca contiene el UUID del tenant", () => {
  it.each(screens)("%s muestra el nombre y no el UUID", async (_f, make) => {
    mockName = "Mapaal";
    const c = await renderSettled(make());
    expect(c.textContent ?? "").not.toMatch(UUID_RE);
    expect(c.textContent).toContain("Mapaal");
  });
  it.each(screens)("%s sin nombre muestra «—», nunca el UUID", async (_f, make) => {
    mockName = "—";
    const c = await renderSettled(make());
    expect(c.textContent ?? "").not.toMatch(UUID_RE);
    expect(c.textContent).toContain("—");
  });
});

describe("GoogleAdsIntelligencePanel abierto", () => {
  it("muestra el nombre del tenant, no X-Tenant-ID con UUID", async () => {
    mockName = "Mapaal";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Panel = require("@/components/advertising/GoogleAdsIntelligencePanel").default;
    const c = await renderSettled(React.createElement(Panel));
    await act(async () => {
      fireEvent.click(c.querySelector("button") as HTMLButtonElement);
      await new Promise((res) => setTimeout(res, 0));
    });
    expect(c.textContent ?? "").not.toMatch(UUID_RE);
    expect(c.textContent).toContain("Tenant: Mapaal");
  });
});
