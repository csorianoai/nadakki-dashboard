import { marcaDesdeBranding } from "@/lib/dcc/marca";

describe("marca del tenant (DCC)", () => {
  it("toma nombre, plataforma, logo y formato del branding", () => {
    const m = marcaDesdeBranding({
      display_name: "Mapaal Automotores",
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

  it("sin branding no inventa datos del tenant: solo queda la firma del producto", () => {
    expect(marcaDesdeBranding(null)).toEqual({
      nombre: null,
      plataforma: "con Nadakki Dealer OS",
      logoUrl: null,
      formato: { locale: "es", currency: null },
    });
  });

  it("la firma es del producto: un platform_label del tenant no la cambia", () => {
    expect(marcaDesdeBranding({ platform_label: "otra cosa" }).plataforma).toBe("con Nadakki Dealer OS");
  });

  it("descarta un logo que no sea https", () => {
    expect(marcaDesdeBranding({ logo_url: "javascript:alert(1)" }).logoUrl).toBeNull();
  });
});

describe("firma por producto (B1)", () => {
  it("el banco firma 'con Nadakki Credit Hub'", () => {
    const m = marcaDesdeBranding({ display_name: "Banco Ejemplo", locale: "es-DO", currency: "DOP" }, "banco");
    expect(m).toEqual({
      nombre: "Banco Ejemplo",
      plataforma: "con Nadakki Credit Hub",
      logoUrl: null,
      formato: { locale: "es-DO", currency: "DOP" },
    });
  });

  it("sin producto sigue siendo la firma del dealer", () => {
    expect(marcaDesdeBranding({}).plataforma).toBe("con Nadakki Dealer OS");
    expect(marcaDesdeBranding({}, "dealer").plataforma).toBe("con Nadakki Dealer OS");
  });
});
