/**
 * Cowork en produccion (26-nov, portal del concesionario en Argentina): la ficha publica mostraba "Agregar al carrito"
 * y un "Trade-in" que no enviaba nada, y la tarjeta decia "0 km" cuando el backend no informa el kilometraje.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import type { Vehicle } from "@/lib/vehicles";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "rav4" }),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock("@/lib/loading", () => ({ MIN_LOADING_MS: 0 }));
const RAV4: Vehicle = {
  id: 7, refId: "rav4", make: "Toyota", model: "RAV4", year: 2021, price: 14000000, currency: "ARS", loc: "Córdoba",
  type: "SUV", km: 0, kmDesconocido: true, trans: "Automática", fuel: "Nafta", grad: "red", verified: false, featuresLine: "",
};
jest.mock("@/lib/api/vehicles", () => ({ getVehicleConsumer: async () => ({ vehicle: RAV4, fromBackend: true }) }));
// Si la ficha los montara, aparecerian estos textos.
jest.mock("@/components/autos/AddToCartButton", () => ({ AddToCartButton: () => <button>Agregar al carrito</button> }));
jest.mock("@/components/vdp/TradeIn", () => ({ TradeIn: () => <h2>¿Trade-in?</h2> }));
const stub = (n: string) => ({ [n]: () => null });
jest.mock("@/components/vdp/Breadcrumb", () => stub("VdpBreadcrumb"));
jest.mock("@/components/vdp/Gallery", () => stub("Gallery"));
jest.mock("@/components/vdp/PriceEvaluation", () => stub("PriceEvaluation"));
jest.mock("@/components/vdp/SimilarVehicles", () => stub("SimilarVehicles"));
jest.mock("@/components/vdp/ContactSeller", () => stub("ContactSeller"));
jest.mock("@/components/vdp/FinancingBridgeStatus", () => stub("FinancingBridgeStatus"));
jest.mock("@/components/search/DemoModeBadge", () => stub("DemoModeBadge"));
jest.mock("@/components/vehicle/VehicleCardSkeleton", () => stub("VehicleCardSkeleton"));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `ARS ${n}` }));
jest.mock("@/components/system/AutosErrorBoundary", () => ({
  AutosErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/vdp/StickyHeader", () => ({
  StickyHeader: () => null,
  useVdpNavigation: () => ({ navIndex: 0, navTotal: 0, goPrev: jest.fn(), goNext: jest.fn() }),
}));

import Page from "@/app/autos/vehiculo/[id]/page";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleHeader } from "@/components/vdp/VehicleHeader";
import { SpecTabs } from "@/components/vdp/SpecTabs";
import { kmTexto } from "@/components/vehicle/km";

describe("ficha publica del concesionario", () => {
  it("sin carrito ni trade-in, y sin '0 km' si el kilometraje no llego", async () => {
    const { container } = render(<Page />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("2021 Toyota RAV4"));
    expect(container.textContent).not.toMatch(/carrito|Trade-in/i);
    expect(container.textContent).not.toMatch(/\b0 km/);
    expect(screen.getByRole("heading", { level: 1 }).nextElementSibling).toHaveTextContent("Córdoba · Automática");
  });
});

describe("kilometraje", () => {
  it("desconocido no se muestra; un 0 real o un valor, si", () => {
    expect(kmTexto({ km: 0, kmDesconocido: true })).toBeNull();
    expect(kmTexto({ km: 0 })).toBe("0 km");
    expect(kmTexto({ km: 38400 })).toBe("38,400 km");
  });
  it.each(["grid", "list"] as const)("tarjeta %s sin '0 km' inventado", (variant) => {
    const { container, unmount } = render(<VehicleCard vehicle={RAV4} variant={variant} />);
    expect(container.textContent).not.toMatch(/\b0 km/);
    expect(screen.queryByTestId("vehicle-km")).toBeNull();
    unmount();
    render(<VehicleCard vehicle={{ ...RAV4, km: 52100, kmDesconocido: false }} variant={variant} />);
    expect(screen.getByTestId("vehicle-km")).toHaveTextContent("52,100 km");
  });
  it("cabecera y especificaciones omiten el dato", () => {
    const h = render(<VehicleHeader vehicle={RAV4} />);
    expect(h.container.textContent).not.toMatch(/km/);
    h.unmount();
    const s = render(<SpecTabs vehicle={RAV4} />);
    expect(s.container.textContent).not.toMatch(/Kilometraje/);
  });
});
