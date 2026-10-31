import React from "react";
import { render } from "@testing-library/react";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({
  useFmtPrecio: () => (n: number) => `ARS ${n}`,
}));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));

// Vehiculo como lo produce el mapper sin semillas: sin vendedor, rating ni reviews.
const v: any = {
  id: 7, make: "Toyota", model: "Corolla", year: 2020, price: 1000, loc: "Cordoba",
  type: "SUV", km: 10, trans: "AT", fuel: "Nafta", badge: "", match: 0, grad: "",
  verified: false, featuresLine: "",
};

describe.each(["grid", "list"] as const)("VehicleCard %s sin datos de vendedor", (variant) => {
  it("no lanza y no pinta vendedor ni valoracion", () => {
    const { container } = render(<VehicleCard vehicle={v} variant={variant} />);
    expect(container.textContent).not.toMatch(/ventas|undefined/);
    // sin vendedor no debe quedar un separador huerfano junto a la ubicacion
    expect(container.textContent).not.toMatch(/(^|\s)·\s*Cordoba|Cordoba\s*·(\s|$)/);
  });
});
