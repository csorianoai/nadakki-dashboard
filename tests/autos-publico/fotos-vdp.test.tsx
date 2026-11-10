/** F4C-1-FOTOS-VDP: fotos reales en ficha y tarjeta; sin fotos no hay cifras ni miniaturas falsas. */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }) }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `ARS ${n}` }));

import { Gallery } from "@/components/vdp/Gallery";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

const base: any = {
  id: 3, make: "Toyota", model: "Corolla", year: 2020, price: 1000, loc: "Cordoba",
  type: "SUV", km: 10, trans: "AT", fuel: "Nafta", grad: "linear-gradient(red,blue)",
  verified: false, featuresLine: "",
};
const tres = ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg", "https://cdn.test/c.jpg"];

describe("Gallery", () => {
  it("3 fotos reales -> contador 1/3 y 3 miniaturas con su imagen", () => {
    const { container } = render(<Gallery vehicle={{ ...base, photos: tres, primaryPhotoUrl: tres[0] }} />);
    expect(container.textContent).toContain("1/3");
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(3);
    expect(container.querySelector(`img[src='${tres[0]}']`)).not.toBeNull();
  });
  it("sin fotos -> sin contador ni miniaturas y texto 'Sin fotos todavia'", () => {
    const { container } = render(<Gallery vehicle={base} />);
    expect(screen.getByText(/Sin fotos todav[ií]a/i)).toBeTruthy();
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(0);
    expect(container.textContent).not.toMatch(/\d+\/\d+/);
  });
  it("sin fotos: ninguna cifra 18/..29/ en el DOM, para varios ids", () => {
    for (const id of [1, 2, 3, 7, 10, 41]) {
      const { container, unmount } = render(<Gallery vehicle={{ ...base, id }} />);
      expect(container.innerHTML.match(/\b(1[89]|2\d)\//g)?.length ?? 0).toBe(0);
      unmount();
    }
  });
});

describe("VehicleCard", () => {
  it("usa la foto principal cuando existe", () => {
    for (const variant of ["grid", "list"] as const) {
      const { container, unmount } = render(
        <VehicleCard vehicle={{ ...base, primaryPhotoUrl: tres[0] }} variant={variant} />,
      );
      expect(container.querySelector(`img[src='${tres[0]}']`)).not.toBeNull();
      unmount();
    }
  });
  it("sin foto usa el degradado y ninguna imagen", () => {
    const { container } = render(<VehicleCard vehicle={base} variant="grid" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).toContain("linear-gradient");
  });
});
