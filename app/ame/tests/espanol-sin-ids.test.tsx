/** C5: /ame en español, sin UUID para el cliente; override de tenant solo para platform_superadmin. */
import React from "react";
import { render } from "@testing-library/react";

const UUID = "1303e38c-efb0-5a09-8ffe-a5f948a74d32";
let roles: { role_key: string }[] = [];

jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: UUID }) }));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ allRoles: roles, tenant: { id: UUID, display_name: "Baylara" } }),
}));
jest.mock("@/hooks/useAMEStatus", () => ({
  useAMEStatus: () => ({
    data: { ame: { tenant: UUID, mode: "dry_run", overall_status: "idle" }, kpis: {}, last_run: { result: "blocked", mode: "dry_run" } },
    source: "live", loading: false, error: null,
  }),
}));
jest.mock("@/hooks/useAMERuns", () => ({
  useAMERuns: () => ({ data: { items: [], runs: [{ id: "r1", result: "failed", mode: "dry_run" }], total: 1, actions_feed: [{ id: "a1", status: "blocked", action: "pause", reason: "r" }, { id: "a2", status: "failed", action: "pause", reason: "r" }] }, source: "live", loading: false, error: null }),
}));

const INGLES = [
  "Read-only operational view", "Optional tenant override", "Header / Operational identity", "KPI strip",
  "Last Run", "No runs yet", "Runs Total", "Blocked", "Phases OK", "Dry Run", "Idle", "Refresh", "Default:", "Autopilot", "blocked", "failed",
];

function pintar(rolKey: string) {
  roles = [{ role_key: rolKey }];
  const Page = require("@/app/ame/page").default;
  return render(<Page />);
}

describe("/ame en español", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => "" }) as unknown as typeof fetch;
  });

  it("tenant_admin: sin UUID, sin textos en inglés y sin campo de override", () => {
    const { container } = pintar("tenant_admin");
    const texto = container.textContent ?? "";
    expect(texto).not.toContain(UUID);
    expect(texto).not.toContain("1303e38c");
    expect(container.innerHTML).not.toContain("1303e38c");
    for (const s of INGLES) expect(texto.toLowerCase()).not.toContain(s.toLowerCase());
    expect(texto).toContain("Baylara");
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("select")).toBeNull();
  });

  it("platform_superadmin: el override sigue", () => {
    const { container } = pintar("platform_superadmin");
    expect(container.querySelector("input, select")).not.toBeNull();
  });
});
