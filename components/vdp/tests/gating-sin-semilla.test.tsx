import { render, screen } from "@testing-library/react";
import type { Vehicle } from "@/lib/vehicles";

jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `$ ${n}` }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/VehicleCard", () => ({
  VehicleCard: ({ vehicle }: { vehicle: Vehicle }) => <div data-vehicle-id={vehicle.id} />,
}));
jest.mock("@/lib/api/ai-features", () => ({
  getPriceConfidence: jest.fn(async (_id: string, price: number) => ({
    lo: price, mid: price, hi: price, top: price, pos: 50, pctBetter: 0, sampleCount: 0, fromBackend: false,
  })),
}));

import { SimilarVehicles } from "@/components/vdp/SimilarVehicles";
import { StickyHeader } from "@/components/vdp/StickyHeader";
import { PriceEvaluation } from "@/components/vdp/PriceEvaluation";
import { VEHICLES_SEED } from "@/lib/vehicles";

const seed = VEHICLES_SEED[0]!;
const real: Vehicle = { ...seed, id: 3, refId: "uuid-real-1" };

describe("gating: nada de semilla con vehiculo real (refId)", () => {
  it("SimilarVehicles no pinta nada con refId y si en la semilla", () => {
    const a = render(<SimilarVehicles vehicle={real} />);
    expect(a.container.querySelector("[data-vehicle-id]")).toBeNull();
    expect(screen.queryByText(/Vehículos similares/)).toBeNull();
    a.unmount();
    render(<SimilarVehicles vehicle={{ ...seed, refId: undefined }} />);
    expect(screen.getByText(/Vehículos similares/)).toBeTruthy();
  });

  const props = { stuck: true, onPrev: jest.fn(), onNext: jest.fn(), navIndex: 3, navTotal: 400 };
  it("StickyHeader no pinta contador ni flechas con refId aunque el id colisione con la semilla", () => {
    render(<StickyHeader vehicle={real} {...props} />);
    expect(screen.queryByText(/3 de 400/)).toBeNull();
    expect(screen.queryByLabelText("Anterior")).toBeNull();
    expect(screen.queryByLabelText("Siguiente")).toBeNull();
  });
  it("StickyHeader pinta contador en la semilla", () => {
    render(<StickyHeader vehicle={{ ...seed, refId: undefined }} {...props} />);
    expect(screen.getByText(/3 de 400/)).toBeTruthy();
  });

  it("PriceEvaluation se oculta si el backend no dio datos de mercado", async () => {
    const { container } = render(<PriceEvaluation vehicle={real} />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText(/Análisis de precio/)).toBeNull();
  });
});
