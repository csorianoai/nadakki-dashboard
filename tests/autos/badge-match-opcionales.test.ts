import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { priceStatus } from "@/lib/finance";
import { filterVehicles } from "@/lib/search-filters";
import { DEFAULT_FILTER_STATE } from "@/lib/search-types";
import type { Vehicle } from "@/lib/vehicles";
import { QualityBadge } from "@/components/vehicle/QualityBadge";
import { MatchScore } from "@/components/vdp/MatchScore";

// Vehiculo del backend sin badge ni match: el dato real no existe, no se inventa.
const sinDatos = {
  id: 1,
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  price: 25_000_000,
  loc: "",
  type: "SUV",
  km: 0,
  trans: "",
  fuel: "",
  grad: "",
  verified: false,
  featuresLine: "",
} as unknown as Vehicle;

describe("F4A-5 badge/match opcionales (parte 1/2)", () => {
  it("priceStatus sin badge ni match no inventa un estado", () => {
    expect(priceStatus(undefined, undefined)).toBeNull();
  });

  it("priceStatus conserva los estados reales", () => {
    expect(priceStatus("Excelente precio", undefined)).toBe("excelente");
    expect(priceStatus(undefined, 70)).toBe("sobre");
    expect(priceStatus("Precio justo", 90)).toBe("justo");
  });

  it("QualityBadge con status null no pinta nada", () => {
    expect(renderToStaticMarkup(createElement(QualityBadge, { status: null }))).toBe("");
  });

  it("MatchScore sin match no pinta nada", () => {
    expect(renderToStaticMarkup(createElement(MatchScore, {}))).toBe("");
  });

  it("filtros por condicion, senales IA y etiquetas toleran badge/match ausentes", () => {
    const state = {
      ...DEFAULT_FILTER_STATE,
      condicion: ["Certificado"],
      aiSignals: ["match85"],
      priceBadges: ["Precio justo"],
    };
    expect(() => filterVehicles([sinDatos], state)).not.toThrow();
    expect(filterVehicles([sinDatos], { ...DEFAULT_FILTER_STATE, aiSignals: ["match85"] })).toEqual([]);
  });
});
