import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { VerificationsTab } from "@/components/credit-hub/bank/sections/VerificationsTab";

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: "tenant-1" }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({
  useCreditHubActor: () => ({ roleKey: "bank_analyst" }),
}));

jest.mock("@/lib/credit-hub/api/securityClient", () => ({
  getComplianceResults: jest.fn().mockResolvedValue({ results: [] }),
  getVehicleHistory: jest.fn().mockResolvedValue({ events: [] }),
  isSecurityEndpointUnavailable: () => false,
  complianceStatusFromResults: () => null,
  complianceMatchesFromResults: () => [],
}));

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <div className="credit-hub-forge">
        <VerificationsTab applicationId="app-1" vehicleVin="" />
      </div>
    </QueryClientProvider>,
  );
}

describe("VerificationsTab empty snapshots", () => {
  test("shows clear empty messages for KYC and pre-screen", async () => {
    renderTab();
    expect(await screen.findByText("No solicitada por el dealer")).toBeInTheDocument();
    expect(screen.getByText("No consultado")).toBeInTheDocument();
    expect(screen.getByText("Sin resultado de screening")).toBeInTheDocument();
  });
});
