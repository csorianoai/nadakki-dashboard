/** @jest-environment node */
/**
 * Portada del portal del concesionario (26-nov, lanzamiento Argentina): en mapaal.nadakki.com y
 * qa-dealer-nadakki.nadakki.com "/" mandaba a /login y "/autos" pintaba la vitrina generica de RD.
 * En un host de portal ambas rutas exactas van a /autos/vehiculos; los hosts de la app no cambian.
 */
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { dealerPortalHomeRedirect, isDealerPortalHost, portalRequestHost } from "@/lib/config/portal-host";

function pedir(host: string, path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`https://${host}${path}`, { headers: { host, ...headers } });
}

describe("isDealerPortalHost", () => {
  it.each(["mapaal.nadakki.com", "qa-dealer-nadakki.nadakki.com", "MAPAAL.nadakki.com", "mapaal.nadakki.com:443"])(
    "%s es host de portal",
    (h) => expect(isDealerPortalHost(h)).toBe(true),
  );
  it.each([
    "dashboard.nadakki.com", "autos.nadakki.com", "www.nadakki.com", "api.nadakki.com", "staging-dashboard.nadakki.com",
    "nadakki.com", "nadakki-dashboard-git-x.vercel.app", "localhost", "localhost:3000", "127.0.0.1", "a.b.nadakki.com", "",
    "baylara.nadakki.com", // conectado al proyecto en Vercel pero es de la marca de realtor
  ])("%s es host de la app", (h) => expect(isDealerPortalHost(h)).toBe(false));
});

describe("portalRequestHost", () => {
  it("prefiere x-forwarded-host, primer valor, sin puerto", () => {
    const h = new Headers({ host: "interno.vercel.app", "x-forwarded-host": "Mapaal.nadakki.com:443, proxy" });
    expect(portalRequestHost(h)).toBe("mapaal.nadakki.com");
  });
});

describe("middleware: portada del portal", () => {
  it.each(["mapaal.nadakki.com", "qa-dealer-nadakki.nadakki.com"])("%s: / y /autos van a /autos/vehiculos", (host) => {
    for (const path of ["/", "/autos"]) {
      const r = middleware(pedir(host, path));
      expect(r.status).toBe(307);
      expect(r.headers.get("location")).toBe(`https://${host}/autos/vehiculos`);
    }
  });

  it("vale con el host real en x-forwarded-host (Vercel)", () => {
    const r = middleware(pedir("nadakki-dashboard.vercel.app", "/", { "x-forwarded-host": "mapaal.nadakki.com" }));
    expect(r.status).toBe(307);
    expect(new URL(r.headers.get("location")!).pathname).toBe("/autos/vehiculos");
  });

  it("los enlaces del portal a /autos (navegacion del cliente) tambien van al inventario", () => {
    const r = middleware(pedir("mapaal.nadakki.com", "/autos", { rsc: "1" }));
    expect(new URL(r.headers.get("location")!).pathname).toBe("/autos/vehiculos");
  });

  it("el aterrizaje del login en / (navegacion del cliente) no se toca", () => {
    const r = middleware(pedir("mapaal.nadakki.com", "/", { rsc: "1" }));
    expect(r.headers.get("location")).toBeNull();
  });

  it.each(["/login", "/autos/dealer", "/autos/dealer/inventario/v1", "/autos/vehiculos", "/autos/vehiculo/v1", "/autos/"])(
    "mapaal.nadakki.com%s no se redirige",
    (path) => {
      expect(dealerPortalHomeRedirect("mapaal.nadakki.com", path, new Headers())).toBeNull();
      if (path !== "/autos/") expect(middleware(pedir("mapaal.nadakki.com", path)).headers.get("location")).toBeNull();
    },
  );

  it.each(["dashboard.nadakki.com", "nadakki.com", "preview-abc.vercel.app", "localhost:3000"])(
    "host de la app %s: / y /autos no cambian",
    (host) => {
      for (const path of ["/", "/autos"]) expect(middleware(pedir(host, path)).headers.get("location")).toBeNull();
    },
  );

  it("autos.nadakki.com conserva su redirect de / y no toca /autos", () => {
    expect(new URL(middleware(pedir("autos.nadakki.com", "/")).headers.get("location")!).pathname).toBe("/autos/vehiculos");
    expect(middleware(pedir("autos.nadakki.com", "/autos")).headers.get("location")).toBeNull();
  });
});
