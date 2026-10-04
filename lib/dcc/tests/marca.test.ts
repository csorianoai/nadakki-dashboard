import { marcaDesdeBranding } from "@/lib/dcc/marca";

describe("marca del tenant (DCC)", () => {
  it("toma nombre, plataforma, logo y formato del branding", () => {
    const m = marcaDesdeBranding({
      display_name: "Mapaal Automotores",
      platform_label: "con Nadakki Dealer OS",
      logo_url: "https://cdn.example/logo.svg",
      locale: "es-AR",
      currency: "ars",
    });
    expect(m).toEqual({
      nombre: "Mapaal Automotores",
      plataforma: "con Nadakki Dealer OS",
      logoUrl: "https://cdn.example/logo.svg",
      formato: { locale: "es-AR", currency: "ARS" },
    });
  });

  it("sin branding no inventa nada: todo null y sin moneda", () => {
    expect(marcaDesdeBranding(null)).toEqual({
      nombre: null,
      plataforma: null,
      logoUrl: null,
      formato: { locale: "es", currency: null },
    });
  });

  it("descarta un logo que no sea https", () => {
    expect(marcaDesdeBranding({ logo_url: "javascript:alert(1)" }).logoUrl).toBeNull();
  });
});
