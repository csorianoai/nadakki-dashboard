import React from "react";
import { render, screen } from "@testing-library/react";
import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import type { Vehicle as BackendVehicle } from "@/types/autos";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/components/ui/slider", () => ({ Slider: () => null }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
jest.mock("@/components/autos/FinancingLeadButton", () => ({ FinancingLeadButton: () => null }));
jest.mock("@/lib/autos-portal/hooks/useFinancingBridge", () => ({ useFinancingBridge: () => ({}) }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `ARS ${n}` }));
jest.mock("@/lib/api/ai-features", () => ({
  getPriceConfidence: async () => ({ lo: 90, mid: 100, hi: 110, top: 120, pos: 40, pctBetter: 4, sampleCount: 12, fromBackend: true }),
  getVehicleHistory: async () => ({ events: [] }),
}));
const fetchMock = jest.fn(async () => { throw new Error("sin red"); });
(globalThis as any).fetch = fetchMock;

import { PaymentCalculator } from "@/components/vdp/PaymentCalculator";
import { TrustChips } from "@/components/vdp/TrustChips";
import { PriceEvaluation } from "@/components/vdp/PriceEvaluation";
import { Gallery } from "@/components/vdp/Gallery";
import { HistorialAI } from "@/components/vdp/HistorialAI";
import { MatchScore } from "@/components/vdp/MatchScore";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

const v: any = {
  id: 3, make: "Toyota", model: "Corolla", year: 2020, price: 1000, loc: "Cordoba",
  type: "SUV", km: 10, trans: "AT", fuel: "Nafta", badge: "Precio justo", match: 82, grad: "red",
  verified: false, featuresLine: "",
};
const PROHIBIDO = /Precio justo|15 usuarios|Banco Piloto|Credicefi|47 vendidos|82\s*%|match/i;

describe("F-27 ficha sin datos inventados", () => {
  it("PaymentCalculator: sin bancos, tasas ni 'Precio Justo verificado'", () => {
    const { container } = render(<PaymentCalculator vehicle={v} vehicleRefId="u" />);
    expect(container.textContent).not.toMatch(PROHIBIDO);
    expect(container.textContent).not.toMatch(/Banco|13\.5|12\.8|14\.2/);
  });
  it("TrustChips: sin '15 usuarios'", () => {
    const { container } = render(<TrustChips />);
    expect(container.textContent).not.toMatch(PROHIBIDO);
  });
  it("PriceEvaluation: sin 'vendidos en RD' ni Credicefi", async () => {
    const { container } = render(<PriceEvaluation vehicle={v} />);
    await screen.findByText(/Análisis de precio/);
    expect(container.textContent).not.toMatch(/Credicefi|vendidos en RD|47/);
  });
  it("MatchScore y tarjetas no muestran match inventado", () => {
    const m = render(<MatchScore match={undefined} />);
    expect(m.container.firstChild).toBeNull();
    for (const variant of ["grid", "list"] as const) {
      const { container } = render(<VehicleCard vehicle={{ ...v, badge: "" }} variant={variant} />);
      expect(container.textContent).not.toMatch(/82|match/i);
    }
  });
  it("Gallery: numero REAL de fotos, no 18+(id*3)%12", () => {
    const { container } = render(<Gallery vehicle={{ ...v, photoCount: 7 }} />);
    expect(container.textContent).toContain("1/7");
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(5);
  });
  it("Gallery: sin dato de fotos no pinta contador ni miniaturas", () => {
    const { container } = render(<Gallery vehicle={v} />);
    expect(container.textContent).not.toMatch(/\d+\/\d+/);
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(0);
  });
  it("HistorialAI: fotos reales o nada; sin '342 ventas' ni rating inventado", () => {
    const a = render(<HistorialAI vehicle={{ ...v, photoCount: 4 }} />);
    expect(a.container.textContent).toContain("4 fotos");
    expect(a.container.textContent).not.toMatch(/342|estrellas|undefined/);
    a.unmount();
    const b = render(<HistorialAI vehicle={v} />);
    expect(b.container.textContent).not.toMatch(/fotos|342|estrellas|undefined/);
  });
  it("el mapper toma photo_count del backend", () => {
    const base = { id: "u1", make: "A", model: "B", year: 2020, condition: "used" } as unknown as BackendVehicle;
    expect(mapBackendVehicle({ ...base, photo_count: 9 } as any).photoCount).toBe(9);
    expect(mapBackendVehicle(base).photoCount).toBeUndefined();
  });
});
