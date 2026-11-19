import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

let mockTenant: string | null = "1303e38c-efb0-5a09-8ffe-a5f948a74d32";
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockTenant }) }));
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ tenantName: "Baylara" }) }));
const mockFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockFetch(...a) }));

import Panel from "@/components/advertising/GoogleAdsIntelligencePanel";

const ok = (d: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => d });
const bad = () => Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
const MODS = {
  modules: [
    { module_id: "m13", title: "Conversion Tracking", status: "not_ready" },
    { module_id: "m06", title: "Smart Bidding", status: "blocked", dependencies: ["m13"], blocked_reason: "AME scheduler no activo" },
  ],
};

beforeEach(() => { mockFetch.mockReset(); mockTenant = "1303e38c-efb0-5a09-8ffe-a5f948a74d32"; });

test("sin tenant no hay llamadas", () => {
  mockTenant = null;
  render(<Panel />);
  fireEvent.click(screen.getByRole("button", { name: /Google Ads Intelligence/ }));
  expect(screen.getByText("Inicia sesión para ver el estado")).toBeTruthy();
  expect(mockFetch).not.toHaveBeenCalled();
});

test("con tenant: módulos y motivos sin JSON", async () => {
  mockFetch.mockImplementation((u: string) => (u.includes("modules") ? ok(MODS) : ok({ score: 70 })));
  const { container } = render(<Panel />);
  fireEvent.click(screen.getByRole("button", { name: /Google Ads Intelligence/ }));
  await waitFor(() => expect(screen.getByText(/Requiere completar: Conversion Tracking/)).toBeTruthy());
  expect(screen.getByText("Tenant: Baylara")).toBeTruthy();
  expect(screen.getByTestId("tracking-status").textContent).toMatch(/pendiente/);
  expect(container.textContent).not.toContain("{");
  const body = JSON.parse(mockFetch.mock.calls.find((c) => c[0].includes("evaluate-fit"))[1].body);
  expect(body.tenant_id).toBe(mockTenant);
});

test("fallo de una llamada no oculta la otra", async () => {
  mockFetch.mockImplementation((u: string) => (u.includes("modules") ? ok(MODS) : bad()));
  render(<Panel />);
  fireEvent.click(screen.getByRole("button", { name: /Google Ads Intelligence/ }));
  await waitFor(() => expect(screen.getByText("No pudimos cargar esta parte")).toBeTruthy());
  expect(screen.getByText("Smart Bidding")).toBeTruthy();
});
