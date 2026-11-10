import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "tenant-sesion" }),
}));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/advertising/google-ads",
}));
jest.mock("@/components/preflight/PreflightResultModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/advertising/components/AdvertisingDashboardLive", () => ({
  AdvertisingDashboardLive: () => null,
}));

import GoogleAdsPage from "@/app/advertising/google-ads/page";
import GoogleAdsExecutionFlow from "@/components/google-ads/GoogleAdsExecutionFlow";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const FILES = [
  "app/advertising/google-ads/page.tsx",
  "app/advertising/components/AgentsPanel.tsx",
  "components/google-ads/GoogleAdsExecutionFlow.tsx",
];
const FIJAS = ["$500", "45%", "92%", "342", "5.2%"];

let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  (global as any).fetch = fetchMock;
});

describe("barrido del codigo fuente", () => {
  it.each(FILES)("%s sin Math.random ni tenant 'demo'", (f) => {
    const src = read(f);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/X-Tenant-ID['"]?\s*:\s*['"]demo['"]/);
  });
  it("page.tsx no trae las seis cifras fijas", () => {
    const src = read(FILES[0]);
    for (const f of ["\"$500\"", "\"45%\"", "\"92%\"", "\"5.2%\"", "value: 24", "value: 342"]) {
      expect(src).not.toContain(f);
    }
  });
});

describe("pagina Google Ads", () => {
  it("no pinta cifras fijas y muestra 'Sin datos aún'", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { container } = render(<GoogleAdsPage />);
    const text = container.textContent || "";
    for (const f of FIJAS) expect(text).not.toContain(f);
    expect(text).toContain("Sin datos aún");
    expect(text).toContain("Budget Pacing Agent");
  });
});

describe("GoogleAdsExecutionFlow", () => {
  it("con modules/status vacio nada sale completado ni 'hace ... d'", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ modules: [] }) });
    const { container } = render(<GoogleAdsExecutionFlow />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText(/Platform Fundamentals/)).not.toBeNull());
    const text = container.textContent || "";
    expect(text).not.toMatch(/hace .*\bd\b/);
    expect(text).toContain("0 / 15");
    expect(text).not.toMatch(/Score:/);
    for (const f of FIJAS) expect(text).not.toContain(f);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/google-ads/modules/status");
    expect(init.headers["X-Tenant-ID"]).toBe("tenant-sesion");
  });

  it("si el fetch falla queda vacio, sin datos de muestra", async () => {
    fetchMock.mockRejectedValue(new Error("red"));
    const { container } = render(<GoogleAdsExecutionFlow />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 0));
    const text = container.textContent || "";
    expect(text).not.toMatch(/Platform Fundamentals/);
    expect(text).not.toMatch(/hace .*\bd\b/);
  });
});
