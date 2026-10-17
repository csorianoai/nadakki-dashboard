/**
 * @jest-environment node
 */

/**
 * PI-P0-2 — parte hermética de la prueba de auth de SpyFu por el BFF.
 *
 * e2e/api/bff-jwt.spec.ts prueba el extremo a extremo contra un despliegue con el backend real, y por eso
 * depende de BASE_URL / QA_USER / QA_PASSWORD. Este test fija lo que SÍ es del dashboard y no necesita
 * entorno: /api/v1/spyfu/* reenvía el Authorization sin tocarlo (un JWT con la firma alterada llega igual
 * de alterado, el BFF no lo "arregla" ni lo descarta) y el 401 del backend vuelve como 401, nunca como 200.
 * Verificar la firma es del backend; que el BFF no la oculte es de aquí.
 */

import { NextRequest } from "next/server";
import { conFirmaAlterada } from "../../e2e/api/jwt-firma";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const JWT_FALSO = "cabecera.carga.firmaoriginal";

describe("BFF /api/v1/spyfu/* con un JWT de firma alterada", () => {
  afterEach(() => jest.resetAllMocks());

  test("reenvía el Authorization alterado tal cual y devuelve el 401 del backend", async () => {
    const alterado = conFirmaAlterada(JWT_FALSO);
    expect(alterado).not.toBe(JWT_FALSO);

    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ detail: "invalid_token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const req = new NextRequest("https://dashboard.nadakki.test/api/v1/spyfu/api-usage", {
      method: "GET",
      headers: { Authorization: `Bearer ${alterado}` },
    });
    const res = await GET(req, { params: Promise.resolve({ path: ["spyfu", "api-usage"] }) });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${BACKEND}/api/v1/spyfu/api-usage`);
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${alterado}` });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: "invalid_token" });
  });
});
