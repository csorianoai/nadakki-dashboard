/**
 * @jest-environment node
 */

/**
 * El proxy BFF v1 reenvia el cuerpo byte a byte (D7, suite#1501).
 *
 * El importador sube la PLANTILLA_ACTIVOS_v4 (.xlsx, un zip) en multipart por
 * /api/v1/autos/... Con `req.text()` el proxy decodificaba el cuerpo como UTF-8
 * y cada byte no valido llegaba al backend como U+FFFD: el fichero se rompia
 * en el salto y el backend contestaba "no es un xlsx" a una plantilla buena.
 *
 * Corre en `node`: el proxy necesita los `Request`/`Response` de verdad.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

/** Cabecera de un zip y bytes que no son UTF-8 valido. */
const BINARIO = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x80, 0xc3, 0x28, 0x9f]);

let enviado: RequestInit | undefined;

beforeEach(() => {
  enviado = undefined;
  global.fetch = jest.fn(async (_url: unknown, init?: RequestInit) => {
    enviado = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
});

afterEach(() => jest.resetAllMocks());

async function bytesEnviados(): Promise<Uint8Array> {
  return new Uint8Array(await new Response(enviado?.body as BodyInit).arrayBuffer());
}

function post(body: BodyInit, contentType: string): NextRequest {
  return new NextRequest(`https://dashboard.nadakki.test/api/v1/autos/dealers/d/import-activos?modo=revision`, {
    method: "POST",
    headers: { Authorization: "Bearer t", "Content-Type": contentType },
    body,
  });
}

const PARAMS = { params: Promise.resolve({ path: ["autos", "dealers", "d", "import-activos"] }) };

describe("el proxy BFF v1 no recodifica el cuerpo", () => {
  test("un cuerpo binario llega identico", async () => {
    const { POST } = await import("@/app/api/v1/[[...path]]/route");
    const res = await POST(post(BINARIO, "application/octet-stream"), PARAMS);

    expect(res.status).toBe(200);
    expect(Array.from(await bytesEnviados())).toEqual(Array.from(BINARIO));
  });

  test("un multipart con un .xlsx conserva el fichero y su boundary", async () => {
    const form = new FormData();
    form.append("archivo", new Blob([BINARIO]), "Plantilla_Activos_Mapaal_v4.xlsx");
    const original = new Request("https://x.test", { method: "POST", body: form });
    const contentType = original.headers.get("Content-Type") as string;
    const cuerpo = new Uint8Array(await original.arrayBuffer());

    const { POST } = await import("@/app/api/v1/[[...path]]/route");
    await POST(post(cuerpo, contentType), PARAMS);

    expect(new Headers(enviado?.headers).get("Content-Type")).toBe(contentType);
    const reenviado = await new Request("https://x.test", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: await bytesEnviados(),
    }).formData();
    const archivo = reenviado.get("archivo") as File;
    expect(archivo.name).toBe("Plantilla_Activos_Mapaal_v4.xlsx");
    expect(Array.from(new Uint8Array(await archivo.arrayBuffer()))).toEqual(Array.from(BINARIO));
  });

  test("el JSON sigue viajando igual", async () => {
    const json = JSON.stringify({ make: "Toyota", nota: "año ñandú" });
    const { POST } = await import("@/app/api/v1/[[...path]]/route");
    await POST(post(json, "application/json"), PARAMS);

    expect(new TextDecoder().decode(await bytesEnviados())).toBe(json);
  });

  test("un POST sin cuerpo no inventa uno", async () => {
    const { POST } = await import("@/app/api/v1/[[...path]]/route");
    await POST(
      new NextRequest("https://dashboard.nadakki.test/api/v1/autos/x", { method: "POST" }),
      PARAMS,
    );
    expect(enviado?.body).toBeUndefined();
  });
});
