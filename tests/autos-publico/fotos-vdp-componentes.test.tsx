/** F4C-1-FOTOS-VDP parte 2/2: Gallery y VehicleCard con fotos reales, sin cifras inventadas. */
import React from "react";
import { render } from "@testing-library/react";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }) }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `ARS ${n}` }));

import { Gallery } from "@/components/vdp/Gallery";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

const base: any = {
  id: 3, make: "Toyota", model: "Corolla", year: 2020, price: 1000, km: 1, loc: "Cordoba",
  trans: "Auto", fuel: "Nafta", featuresLine: "", grad: "linear-gradient(#111,#222)", badge: "", match: undefined,
};
const urls = ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg"];
const fotos = urls.map((cdn_url, position) => ({ cdn_url, position }));

describe("Gallery", () => {
  it("3 fotos -> '1/3' y 3 miniaturas", () => {
    const { container } = render(<Gallery vehicle={{ ...base, photos: fotos, primary_photo_url: urls[0] }} />);
    expect(container.textContent).toContain("1/3");
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(3);
  });
  it("sin fotos -> sin contador ni miniaturas y texto 'Sin fotos todavia'", () => {
    const { container } = render(<Gallery vehicle={base} />);
    expect(container.textContent).toContain("Sin fotos todavia");
    expect(container.querySelectorAll("button[aria-label^='Foto']").length).toBe(0);
    // El texto no puede quedar dentro de un role=img (hijos presentacionales: no se anunciaria).
    const el = Array.from(container.querySelectorAll("*")).filter((n) => n.textContent?.includes("Sin fotos todavia")).pop()!;
    expect(el.closest("[role='img']")).toBeNull();
    expect(container.textContent).not.toMatch(/\d+\/\d+/);
    expect(container.innerHTML.match(/18\//g)?.length ?? 0).toBe(0);
  });
});

describe("Gallery solo con foto principal", () => {
  it("pinta la foto real y no el estado 'Sin fotos todavia'", () => {
    const { container } = render(<Gallery vehicle={{ ...base, primary_photo_url: urls[0] }} />);
    expect(container.querySelector(`img[src='${urls[0]}']`)).not.toBeNull();
    expect(container.textContent).not.toContain("Sin fotos todavia");
  });
});

describe("VehicleCard", () => {
  it.each(["grid", "list", "compact"] as const)("%s usa la foto principal", (variant) => {
    const { container } = render(<VehicleCard vehicle={{ ...base, primary_photo_url: urls[0] }} variant={variant} />);
    expect(container.querySelector(`img[src='${urls[0]}']`)).not.toBeNull();
  });
  it.each(["grid", "list"] as const)("%s sin foto: degradado y sin contador inventado", (variant) => {
    const { container } = render(<VehicleCard vehicle={base} variant={variant} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).toContain("linear-gradient");
    expect(container.textContent).not.toMatch(/\b(1[89]|2\d)\b\s*$/);
  });
});
