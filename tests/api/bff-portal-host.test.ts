/**
 * Release de mapaal-f4a: el BFF reenvia el dominio publico del portal al backend en X-Portal-Host.
 *
 * El backend (F4A-1, F-4) acota el buscador al tenant del dominio; detras del BFF su `Host` es el del backend,
 * asi que sin esta cabecera el portal daria 404 a todo. El valor sale SOLO del host real de la peticion
 * (x-forwarded-host de Vercel o host); un X-Portal-Host que mande el cliente nunca se reenvia.
 */
import type { NextRequest } from "next/server";
import { buildBffUpstreamHeaders } from "@/lib/api/bff-proxy-headers";

function req(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

describe("BFF: X-Portal-Host", () => {
  test("reenvia el host publico de la peticion", () => {
    const h = buildBffUpstreamHeaders(req({ host: "mapaal.nadakki.com" }), "POST", "");
    expect(h["X-Portal-Host"]).toBe("mapaal.nadakki.com");
  });

  test("prefiere x-forwarded-host y se queda con el primer valor", () => {
    const h = buildBffUpstreamHeaders(
      req({ host: "interno.vercel.app", "x-forwarded-host": "mapaal.nadakki.com, proxy.local" }),
      "POST",
      "",
    );
    expect(h["X-Portal-Host"]).toBe("mapaal.nadakki.com");
  });

  test("un X-Portal-Host del cliente no se reenvia: gana el host real", () => {
    const h = buildBffUpstreamHeaders(
      req({ host: "mapaal.nadakki.com", "x-portal-host": "otro.nadakki.com" }),
      "GET",
      "",
    );
    expect(h["X-Portal-Host"]).toBe("mapaal.nadakki.com");
  });

  test("sin host ni x-forwarded-host no inventa la cabecera", () => {
    const h = buildBffUpstreamHeaders(req({}), "GET", "");
    expect(h["X-Portal-Host"]).toBeUndefined();
  });

  test("no rompe el resto de cabeceras reenviadas", () => {
    const h = buildBffUpstreamHeaders(
      req({ host: "mapaal.nadakki.com", authorization: "Bearer t" }),
      "GET",
      "tenant-1",
    );
    expect(h["Authorization"]).toBe("Bearer t");
    expect(h["X-Tenant-ID"]).toBe("tenant-1");
  });
});
