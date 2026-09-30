/**
 * Contrato de formato con el locale y la moneda del TENANT.
 *
 * La moneda nunca se inventa: si branding no trae currency, localeDeTenant la
 * conserva como null y formateaMoneda falla cerrado. El locale si puede usar un
 * fallback neutro porque no concede semantica financiera.
 */
import {
  LOCALE_POR_DEFECTO,
  esArgentina,
  formateaDias,
  formateaEntero,
  formateaMoneda,
  localeDeTenant,
} from "@/lib/dealer-management/formato";

describe("localeDeTenant", () => {
  it("sin branding conserva currency ausente en vez de inventar USD", () => {
    expect(localeDeTenant(null)).toEqual(LOCALE_POR_DEFECTO);
    expect(localeDeTenant(undefined)).toEqual(LOCALE_POR_DEFECTO);
    expect(localeDeTenant({})).toEqual(LOCALE_POR_DEFECTO);
    expect(LOCALE_POR_DEFECTO).toEqual({ locale: "es", currency: null });
  });

  it("con locale pero sin currency no fabrica moneda", () => {
    expect(localeDeTenant({ locale: "es-AR" })).toEqual({
      locale: "es-AR",
      currency: null,
    });
  });

  it("con currency real normaliza moneda y completa solo locale", () => {
    expect(localeDeTenant({ currency: "ars" })).toEqual({
      locale: LOCALE_POR_DEFECTO.locale,
      currency: "ARS",
    });
  });

  it("normaliza la moneda a mayusculas y descarta espacios", () => {
    expect(localeDeTenant({ locale: " es-AR ", currency: " ars " })).toEqual({
      locale: "es-AR",
      currency: "ARS",
    });
  });

  it("una currency en blanco sigue siendo ausencia, no USD", () => {
    expect(localeDeTenant({ locale: "es-DO", currency: "   " })).toEqual({
      locale: "es-DO",
      currency: null,
    });
  });
});

describe("formateaEntero y formateaMoneda", () => {
  it("agrupa los miles segun el locale", () => {
    expect(formateaEntero(82554, { locale: "en-US", currency: "USD" })).toBe("82,554");
    expect(formateaEntero(82554, { locale: "es-AR", currency: "ARS" })).toBe("82.554");
  });

  it("la moneda sale con dos decimales y el separador del locale", () => {
    const ar = formateaMoneda(82554, { locale: "es-AR", currency: "ARS" });
    expect(ar).toContain("82.554");
    expect(ar).toMatch(/,\d{2}$/);

    const us = formateaMoneda(82554, { locale: "en-US", currency: "USD" });
    expect(us).toContain("82,554");
    expect(us).toMatch(/\.\d{2}$/);
  });

  it("usa la moneda pedida y no una fija", () => {
    const eur = formateaMoneda(10, { locale: "es", currency: "EUR" });
    const usd = formateaMoneda(10, { locale: "es", currency: "USD" });
    expect(eur).not.toEqual(usd);
  });

  it("falla cerrado si currency esta ausente", () => {
    expect(() => formateaMoneda(10, { locale: "es-AR", currency: null })).toThrow(
      "TENANT_CURRENCY_NOT_CONFIGURED",
    );
  });
});

describe("formateaDias", () => {
  it("singular solo en exactamente 1", () => {
    const l = { locale: "es", currency: "USD" };
    expect(formateaDias(1, l)).toBe("1 día");
    expect(formateaDias(0, l)).toBe("0 días");
    expect(formateaDias(12, l)).toBe("12 días");
  });

  it("el numero tambien pasa por el locale", () => {
    expect(formateaDias(1200, { locale: "es-AR", currency: "ARS" })).toBe("1.200 días");
  });
});

describe("esArgentina", () => {
  it("detecta por moneda ARS", () => {
    expect(esArgentina({ currency: "ARS" })).toBe(true);
    expect(esArgentina({ currency: "ars" })).toBe(true);
  });

  it("detecta por sufijo de locale -ar", () => {
    expect(esArgentina({ locale: "es-AR" })).toBe(true);
    expect(esArgentina({ locale: "ES-ar" })).toBe(true);
  });

  it("no confunde otros tenants", () => {
    expect(esArgentina({ locale: "en-US", currency: "USD" })).toBe(false);
    expect(esArgentina({ locale: "es-DO", currency: "DOP" })).toBe(false);
    expect(esArgentina(null)).toBe(false);
    expect(esArgentina({})).toBe(false);
  });

  it("no le basta con que el locale CONTENGA ar", () => {
    expect(esArgentina({ locale: "ar-EG" })).toBe(false);
  });
});
