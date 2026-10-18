/**
 * @jest-environment node
 */

/**
 * El proxy BFF v1 reenvia las respuestas binarias byte a byte (PS-15-BFF-BINARIOS).
 *
 * Antes leia todo con `res.text()`: los bytes >= 0x80 se reinterpretaban como
 * UTF-8 y una descarga (PDF, imagen) llegaba corrupta y sin Content-Disposition.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const PARAMS = { params: Promise.resolve({ path: ["docs", "d1", "download"] }) };

afterEach(() => jest.resetAllMocks());

async function get(upstream: Response) {
  global.fetch = jest.fn(async () => upstream) as unknown as typeof fetch;
  const { GET } = await import("@/app/api/v1/[[...path]]/route");
  const req = new NextRequest("https://dashboard.nadakki.test/api/v1/docs/d1/download", {
    headers: { Authorization: "Bearer t" },
  });
  return GET(req, PARAMS);
}

test("un PDF con bytes >= 0x80 llega identico y con sus cabeceras", async () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xff, 0xfe, 0x80, 0x00, 0xc3]);
  const res = await get(
    new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="doc.pdf"',
        "Cache-Control": "private, max-age=0",
        "Content-Length": String(bytes.length),
      },
    })
  );

  expect(res.status).toBe(200);
  expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(Array.from(bytes));
  expect(res.headers.get("Content-Type")).toBe("application/pdf");
  expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="doc.pdf"');
  expect(res.headers.get("Cache-Control")).toBe("private, max-age=0");
  expect(res.headers.get("Content-Length")).toBe(String(bytes.length));
});

test("un application/octet-stream llega identico", async () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0x80, 0x81, 0x00, 0xfd]);
  const res = await get(
    new Response(bytes, { status: 200, headers: { "Content-Type": "application/octet-stream" } })
  );

  expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(Array.from(bytes));
  expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
});

test("no copia Content-Length si la respuesta trae Content-Encoding", async () => {
  const res = await get(
    new Response(new Uint8Array([0x1f, 0x8b, 0x08]), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Encoding": "gzip",
        "Content-Length": "999",
      },
    })
  );

  expect(res.headers.get("Content-Length")).not.toBe("999");
});

test("una respuesta JSON no cambia", async () => {
  const res = await get(
    new Response('{"a":1}', { status: 200, headers: { "Content-Type": "application/json" } })
  );

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ a: 1 });
});

test("una respuesta de texto no cambia", async () => {
  const res = await get(
    new Response("hola ñ", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  );

  expect(await res.text()).toBe("hola ñ");
  expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
});
