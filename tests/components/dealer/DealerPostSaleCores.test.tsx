/**
 * @jest-environment jsdom
 */

import fs from "fs";
import path from "path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { DealerPostSaleCores } from "@/components/dealer/DealerPostSaleCores";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("Dealer post-sale cores", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("READY shows open case, asiento, listing status and heartbeat fields", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/legal/cases")) {
        return jsonResponse(
          {
            cases: [
              { id: "case-open", state: "ACTIVE" },
              { id: "case-done", state: "CLOSED" },
            ],
          },
          200,
        );
      }
      if (url.includes("/api/v1/contable/asientos")) {
        return jsonResponse([{ id: "asi-1", status: "posted" }], 200);
      }
      if (url.includes("/api/marketing/scheduler/heartbeat")) {
        return jsonResponse({ alive: true, last_cycle: "2026-09-22T12:00:00Z" }, 200);
      }
      if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles")) {
        return jsonResponse({ vehicles: [{ id: "veh-1", status: "sold" }] }, 200);
      }
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerPostSaleCores />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-post-sale-ready")).toBeInTheDocument();
    expect(screen.getByText(/case-open/)).toBeInTheDocument();
    expect(screen.queryByText(/case-done/)).not.toBeInTheDocument();
    expect(screen.getByText(/asi-1 · posted/)).toBeInTheDocument();
    expect(screen.getByText(/veh-1 · sold/)).toBeInTheDocument();
    expect(screen.getByText(/alive: true/)).toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/marketing/scheduler/heartbeat"))).toBe(true);
  });

  test("ERROR fail-closed on 403 legal GET", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ detail: { reason_code: "DEFAULT_DENY" } }, 403));
    render(<DealerPostSaleCores />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-post-sale-error")).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-post-sale-ready")).not.toBeInTheDocument();
  });

  test("NO_FAKE_DATA: invented Casos legales 12 / Asientos 340 / Latido 3 min fail", async () => {
    const invented = "Casos legales: 12 · Asientos: 340 · Latido: hace 3 min";
    const src = fs.readFileSync(path.join(process.cwd(), "components/dealer/DealerPostSaleCores.tsx"), "utf8");
    expect(src).not.toContain(invented);
    expect(src).not.toMatch(/Casos legales:\s*12/);
    expect(src).not.toMatch(/Asientos:\s*340/);
    expect(src).not.toMatch(/Latido:\s*hace 3 min/);

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/legal/cases")) return jsonResponse({ cases: [] }, 200);
      if (url.includes("/api/v1/contable/asientos")) return jsonResponse([], 200);
      if (url.includes("/api/marketing/scheduler/heartbeat")) return jsonResponse({}, 200);
      if (url.includes("/api/v1/autos/dealers/")) return jsonResponse({ vehicles: [] }, 200);
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerPostSaleCores />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-post-sale-empty")).toBeInTheDocument();
    expect(screen.queryByText(invented)).not.toBeInTheDocument();
    expect(screen.queryByText(/Casos legales:\s*12/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Asientos:\s*340/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Latido:\s*hace 3 min/)).not.toBeInTheDocument();
  });
});
