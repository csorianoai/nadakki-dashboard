/**
 * QA de Mapaal (26-nov): la RAV4 publicada trae price_amount 14000000 y price_currency "ARS" en
 * GET /api/v1/autos/vehicles/{id} (medido en qa-dealer-nadakki.nadakki.com), pero el portal decia
 * "Precio a consultar" porque el formateador solo miraba la moneda del branding del tenant, y el visitante
 * anonimo no tiene tenant (branding de "demo-tenant": 401). Ademas pintaba una cuota inventada
 * (60 meses al 13.5%) y un boton "Aplicar financiamiento" sin dato real de financiamiento.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleHeader } from "@/components/vdp/VehicleHeader";
import { ResultsMap } from "@/components/search/ResultsMap";
import { formatPrecioEnMoneda, PRECIO_A_CONSULTAR } from "@/components/vehicle/precio";
import { mapBackendVehicle } from "@/lib/api/vehicle-mapper";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }) }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
// Como en produccion para un visitante anonimo: el branding del tenant no trae moneda.
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => () => "Precio a consultar" }));

const RAV4 = mapBackendVehicle({
  id: "ef9b1e3a-6d13-47c8-9903-e409dff8637f", make: "Toyota", model: "RAV4", year: 2021, body_type: "SUV",
  transmission: "Automática", price_amount: 14000000, price_currency: "ARS", price_rd: null, status: "disponible",
} as never);
const SIN_PRECIO = mapBackendVehicle({ id: "x", make: "Ford", model: "Ranger", year: 2020, price_amount: null } as never);
const ARS = /\$\s?14\.000\.000/;

describe("precio con la moneda del vehiculo", () => {
  it("el mapper conserva importe y moneda del backend", () => {
    expect(RAV4.price).toBe(14000000);
    expect(RAV4.currency).toBe("ARS");
  });
  it("formatea ARS en es-AR", () => {
    expect(formatPrecioEnMoneda(14000000, "ARS")).toMatch(ARS);
    expect(formatPrecioEnMoneda(0, "ARS")).toBe(PRECIO_A_CONSULTAR);
    expect(formatPrecioEnMoneda(100, null)).toBeNull();
    expect(formatPrecioEnMoneda(100, "pesos")).toBeNull();
  });
  it.each(["grid", "list", "compact"] as const)("tarjeta %s muestra el precio real", (variant) => {
    const { container } = render(<VehicleCard vehicle={RAV4} variant={variant} />);
    expect(container.textContent).toMatch(ARS);
    expect(container.textContent).not.toContain("Precio a consultar");
  });
  it("la ficha publica muestra el precio real", () => {
    render(<VehicleHeader vehicle={RAV4} />);
    expect(screen.getByText(ARS)).toBeInTheDocument();
  });
  it("sin precio ni moneda sigue diciendo Precio a consultar", () => {
    const { container } = render(<VehicleCard vehicle={SIN_PRECIO} variant="grid" />);
    expect(container.textContent).toContain("Precio a consultar");
  });
  it("el mapa muestra el precio, no una cuota", () => {
    const { container } = render(<ResultsMap vehicles={[RAV4]} loading={false} />);
    expect(container.textContent).toMatch(ARS);
    expect(container.textContent).not.toMatch(/\/mes/);
  });
});

describe.each(["grid", "list"] as const)("tarjeta %s sin financiamiento inventado", (variant) => {
  it("no pinta cuota, APR ni boton de financiamiento", () => {
    const { container } = render(<VehicleCard vehicle={RAV4} variant={variant} />);
    expect(container.textContent).not.toMatch(/\/mes|APR|60 meses|13\.5|Aplicar financiamiento/);
    expect(container.querySelector('a[href*="financiar"]')).toBeNull();
    expect(screen.getByRole("link", { name: "Ver detalles" })).toHaveAttribute(
      "href",
      expect.stringContaining("ef9b1e3a-6d13-47c8-9903-e409dff8637f"),
    );
  });
});
