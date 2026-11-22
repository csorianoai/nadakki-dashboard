import React from "react";
import { fireEvent, render } from "@testing-library/react";
import type { Vehicle } from "@/lib/vehicles";
import { primaryPhotoUrl, vehiclePhotoUrls } from "@/lib/vehicles";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }) }));
jest.mock("@/components/vehicle/SaveButton", () => ({ SaveButton: () => null }));
jest.mock("@/components/vehicle/QualityBadge", () => ({ QualityBadge: () => null }));
jest.mock("@/components/vehicle/PrecioJustoBadge", () => ({ PrecioJustoBadge: () => null }));
jest.mock("@/lib/autos-portal/moneda-publica", () => ({ useFmtPrecio: () => (n: number) => `ARS ${n}` }));

import { Gallery } from "@/components/vdp/Gallery";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

const GRAD = "linear-gradient(135deg,#1E3A8A,#3B82F6)";
const base: Vehicle = {
  id: 3, make: "Toyota", model: "Corolla", year: 2020, price: 1000, loc: "Cordoba", type: "SUV",
  km: 10, trans: "AT", fuel: "Nafta", grad: GRAD, verified: false, featuresLine: "",
};
const A = "https://media.nadakki.com/vehicles/t/v/a.jpg";
const B = "https://media.nadakki.com/vehicles/t/v/b.jpg";
const C = "https://media.nadakki.com/vehicles/t/v/c.jpg";
const conFotos: Vehicle = {
  ...base,
  primary_photo_url: A,
  photos: [
    { cdn_url: B, position: 1 },
    { cdn_url: A, position: 0 },
    { cdn_url: C, position: 2 },
  ],
};

const hayDegradado = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>("[style]")).some((e) => /gradient/i.test(e.getAttribute("style") ?? ""));

describe("fotos reales en la ficha publica y en las tarjetas", () => {
  it("helpers: orden por position, sin repetidos, solo http(s), nunca inventa", () => {
    expect(vehiclePhotoUrls(conFotos)).toEqual([A, B, C]);
    expect(vehiclePhotoUrls({ photos: [{ cdn_url: "javascript:alert(1)" }, { cdn_url: "" }] })).toEqual([]);
    expect(vehiclePhotoUrls(base)).toEqual([]);
    expect(primaryPhotoUrl(base)).toBeUndefined();
    expect(primaryPhotoUrl({ photos: [{ cdn_url: B }] })).toBe(B);
  });

  it("Gallery con fotos: pinta las imagenes y NO el degradado", () => {
    const { container, getByTestId } = render(<Gallery vehicle={conFotos} />);
    expect(getByTestId("gallery-foto").getAttribute("src")).toBe(A);
    expect(container.querySelectorAll("img").length).toBe(1 + 3);
    expect(hayDegradado(container)).toBe(false);
    expect(container.textContent).toContain("1/3");
    fireEvent.click(container.querySelectorAll("button[aria-label='Foto 2']")[0]!);
    expect(getByTestId("gallery-foto").getAttribute("src")).toBe(B);
    expect(hayDegradado(container)).toBe(false);
  });

  it("Gallery sin fotos: degradado y ninguna imagen", () => {
    const { container } = render(<Gallery vehicle={base} />);
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(hayDegradado(container)).toBe(true);
  });

  it("Gallery con photoCount pero sin URLs: no inventa fotos, mantiene el degradado", () => {
    const { container } = render(<Gallery vehicle={{ ...base, photoCount: 4 }} />);
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(hayDegradado(container)).toBe(true);
  });

  it.each(["grid", "list", "compact"] as const)("VehicleCard %s con foto principal: imagen y sin degradado", (variant) => {
    const { container } = render(<VehicleCard vehicle={conFotos} variant={variant} />);
    const img = container.querySelector("img[data-testid='card-foto']");
    expect(img?.getAttribute("src")).toBe(A);
    expect(hayDegradado(container)).toBe(false);
  });

  it.each(["grid", "list", "compact"] as const)("VehicleCard %s sin fotos: degradado", (variant) => {
    const { container } = render(<VehicleCard vehicle={base} variant={variant} />);
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(hayDegradado(container)).toBe(true);
  });
});
