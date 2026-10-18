/**
 * @jest-environment node
 */

/**
 * El proxy BFF v1 devuelve los binarios del backend byte a byte (PS-15-DOCS-DESCARGA-B, dash#988).
 *
 * El boton de descarga de documentos pide el fichero por /api/v1/... El proxy leia la
 * respuesta con `res.text()` y la devolvia con `new NextResponse(text)`: cada byte que no
 * es UTF-8 valido llegaba al navegador como U+FFFD (el PDF se rompia) y la cabecera
 * Content-Disposition se perdia (el navegador no sabia el nombre del fichero).
 *
 * Corre en `node`: el proxy necesita los `Request`/`Response` de verdad.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

/** Cabecera de un PDF y bytes que no son UTF-8 valido. */
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0xff, 0xfe, 0x80, 0x00, 0xc3, 0x28]);

const PARAMS = { params: Promise.resolve({ path: ["documents", "doc-1", "download"] }) };

function get(): NextRequest {
  return new NextRequest("https://dashboard.nadakki.test/api/v1/documents/doc-1/download", {
    method: "GET",
    headers: { Authorization: "Bearer t" },
  });
}

afterEach(() => jest.resetAllMocks());

describe("el proxy BFF v1 conserva las respuestas binarias", () => {
  test("un PDF llega identico y con su Content-Disposition", async () => {
    global.fetch = jest.fn(
      async () =>
        new Response(PDF, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="x.pdf"',
            "Content-Length": String(PDF.byteLength),
            "Cache-Control": "private, max-age=0",
          },
        }),
    ) as unknown as typeof fetch;

    const { GET } = await import("@/app/api/v1/[[...path]]/route");
    const res = await GET(get(), PARAMS);

    expect(res.status).toBe(200);
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(Array.from(PDF));
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="x.pdf"');
    expect(res.headers.get("Content-Length")).toBe(String(PDF.byteLength));
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=0");
  });

  test("un application/octet-stream llega identico", async () => {
    global.fetch = jest.fn(
      async () =>
        new Response(PDF, {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": 'attachment; filename="x.bin"',
          },
        }),
    ) as unknown as typeof fetch;

    const { GET } = await import("@/app/api/v1/[[...path]]/route");
    const res = await GET(get(), PARAMS);

    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(Array.from(PDF));
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="x.bin"');
  });

  test("una respuesta JSON sigue igual", async () => {
    const cuerpo = { ok: true, nota: "año ñandú", items: [1, 2] };
    global.fetch = jest.fn(
      async () =>
        new Response(JSON.stringify(cuerpo), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    const { GET } = await import("@/app/api/v1/[[...path]]/route");
    const res = await GET(get(), PARAMS);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(await res.json()).toEqual(cuerpo);
  });
});
