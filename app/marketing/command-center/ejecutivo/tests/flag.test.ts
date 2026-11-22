import { analyticsDemoActivo, fuenteDePantalla } from "../flag";

describe("flag de la pantalla patron (VERCEL_ENV / NEXT_PUBLIC_ANALYTICS_DEMO)", () => {
  it("production + flag demo => APAGADO (pase lo que pase)", () => {
    expect(analyticsDemoActivo({ VERCEL_ENV: "production", NEXT_PUBLIC_ANALYTICS_DEMO: "1", NODE_ENV: "production" })).toBe(false);
    expect(analyticsDemoActivo({ VERCEL_ENV: "production", NEXT_PUBLIC_ANALYTICS_DEMO: "1", NODE_ENV: "development" })).toBe(false);
    expect(analyticsDemoActivo({ VERCEL_ENV: "production" })).toBe(false);
  });
  it("preview => ENCENDIDO sin tocar variables", () => {
    expect(analyticsDemoActivo({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
  });
  it("local/tests: encendido solo con NEXT_PUBLIC_ANALYTICS_DEMO=1 y fuera de produccion", () => {
    expect(analyticsDemoActivo({ NEXT_PUBLIC_ANALYTICS_DEMO: "1", NODE_ENV: "test" })).toBe(true);
    expect(analyticsDemoActivo({ NEXT_PUBLIC_ANALYTICS_DEMO: "1", NODE_ENV: "development" })).toBe(true);
    expect(analyticsDemoActivo({ NEXT_PUBLIC_ANALYTICS_DEMO: "0", NODE_ENV: "development" })).toBe(false);
    expect(analyticsDemoActivo({ NODE_ENV: "development" })).toBe(false);
    expect(analyticsDemoActivo({})).toBe(false);
  });
  it("build de produccion fuera de Vercel con el flag demo => APAGADO", () => {
    expect(analyticsDemoActivo({ NEXT_PUBLIC_ANALYTICS_DEMO: "1", NODE_ENV: "production" })).toBe(false);
  });
  it("solo el valor exacto '1' enciende", () => {
    for (const v of ["true", "yes", "01", " 1", "1 "]) {
      expect(analyticsDemoActivo({ NEXT_PUBLIC_ANALYTICS_DEMO: v, NODE_ENV: "development" })).toBe(false);
    }
  });
});

describe("fuenteDePantalla: demo solo donde el flag lo permite", () => {
  it("produccion => real aunque se pida la demo", () => {
    expect(fuenteDePantalla("demo", { VERCEL_ENV: "production", NEXT_PUBLIC_ANALYTICS_DEMO: "1" })).toBe("real");
    expect(fuenteDePantalla(undefined, { VERCEL_ENV: "production" })).toBe("real");
    expect(fuenteDePantalla(undefined, {})).toBe("real");
  });
  it("preview => demo por defecto; ?fuente=real => real", () => {
    expect(fuenteDePantalla(undefined, { VERCEL_ENV: "preview" })).toBe("demo");
    expect(fuenteDePantalla("real", { VERCEL_ENV: "preview" })).toBe("real");
    expect(fuenteDePantalla("cualquier-cosa", { VERCEL_ENV: "preview" })).toBe("demo");
  });
});
