import { render, screen, waitFor } from "@testing-library/react";
import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import type { Vehicle as BackendVehicle } from "@/types/autos";

// DIAGNOSTICO: el backend no trae vendedor, valoraciones ni tiempo de respuesta,
// pero mapBackendVehicle los siembra y la ficha los pintaba como reales.
const backend = {
  id: "9001", make: "Toyota", model: "Hilux", year: 2021, price_rd: 5000000,
  province: "Mendoza", body_type: "SUV", mileage_km: 1000, transmission: "Manual",
  fuel_type: "Diesel", condition: "used", dealer_id: "d-1",
} as unknown as BackendVehicle;

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "9001" }),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/lib/loading", () => ({ MIN_LOADING_MS: 0 }));
jest.mock("@/lib/api/vehicles", () => ({
  getVehicleConsumer: async () => ({ vehicle: mapBackendVehicle(backend, 9001), fromBackend: true }),
}));
const stub = (n: string) => ({ [n]: () => null });
jest.mock("@/components/vdp/Breadcrumb", () => stub("VdpBreadcrumb"));
jest.mock("@/components/vdp/Gallery", () => stub("Gallery"));
jest.mock("@/components/vdp/VehicleHeader", () => stub("VehicleHeader"));
jest.mock("@/components/autos/AddToCartButton", () => stub("AddToCartButton"));
jest.mock("@/components/vdp/MatchScore", () => stub("MatchScore"));
jest.mock("@/components/vdp/SpecTabs", () => stub("SpecTabs"));
jest.mock("@/components/vdp/PriceEvaluation", () => stub("PriceEvaluation"));
jest.mock("@/components/vdp/PaymentCalculator", () => stub("PaymentCalculator"));
jest.mock("@/components/vdp/TradeIn", () => stub("TradeIn"));
jest.mock("@/components/vdp/SimilarVehicles", () => stub("SimilarVehicles"));
jest.mock("@/components/vdp/FinancingBridgeStatus", () => stub("FinancingBridgeStatus"));
jest.mock("@/components/vdp/VehicleChatWidget", () => stub("VehicleChatWidget"));
jest.mock("@/components/search/DemoModeBadge", () => stub("DemoModeBadge"));
jest.mock("@/components/vehicle/VehicleCardSkeleton", () => stub("VehicleCardSkeleton"));
jest.mock("@/components/system/AutosErrorBoundary", () => ({
  AutosErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/vdp/StickyHeader", () => ({
  StickyHeader: () => null,
  useVdpNavigation: () => ({ navIndex: 0, navTotal: 0, goPrev: jest.fn(), goNext: jest.fn() }),
}));

import Page from "@/app/autos/vehiculo/[id]/page";

describe("ficha publica con vehiculo del backend", () => {
  it("no muestra vendedor ni valoracion que el backend no dio", async () => {
    const { container } = render(<Page />);
    await waitFor(() => expect(container.querySelector("[data-testid='vdp-ready'], section, div")).toBeTruthy());
    await new Promise((r) => setTimeout(r, 20));
    const html = container.innerHTML;
    expect(html).not.toMatch(/Contactar/);
    expect(html).not.toMatch(/responde en/);
    expect(html).not.toMatch(/AutoMundo|Motores del Este|Autos del Cibao|Caribe Motors/);
    expect(screen.queryByText(/4\.5/)).toBeNull();
  });
});
