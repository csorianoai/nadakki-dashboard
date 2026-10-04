/**
 * @jest-environment node
 */

/**
 * Regresion D5: el proxy BFF reenvia el cuerpo binario sin tocarlo.
 *
 * La subida de fotos (`POST /api/v1/autos/vehicles/{id}/photos`, multipart) pasa
 * por este proxy. Leer el cuerpo con `req.text()` lo decodifica a UTF-8: los
 * bytes de un JPEG (0xFF 0xD8 ...) se sustituyen por U+FFFD y el backend recibe
 * una imagen rota (422/400) aunque el frente sea correcto. Los tests del panel
 * mockeaban `apiFetch`, asi que nunca pasaban por aqui.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";
process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x80, 0xc3, 0x28]);

describe("el proxy BFF conserva los bytes del cuerpo", () => {
  afterEach(() => jest.resetAllMocks());

  test("v1: un multipart con un JPEG llega al backend byte a byte, con su boundary", async () => {
    const form = new FormData();
    form.append("file", new Blob([JPEG], { type: "image/jpeg" }), "foto.jpg");
    const req = new NextRequest("https://dashboard.nadakki.test/api/v1/autos/vehicles/v1/photos", {
      method: "POST",
      body: form,
      headers: { Authorization: "Bearer t" },
    });
    const enviado = Buffer.from(await req.clone().arrayBuffer());

    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ media_id: "m1" }), { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { POST } = await import("@/app/api/v1/[[...path]]/route");

    const res = await POST(req, { params: Promise.resolve({ path: ["autos", "vehicles", "v1", "photos"] }) });

    expect(res.status).toBe(201); // el proxy no degrada 201 a 200
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/api/v1/autos/vehicles/v1/photos`);
    expect(init.headers["Content-Type"]).toMatch(/^multipart\/form-data; boundary=/);
    const recibido = Buffer.from(init.body as ArrayBuffer);
    expect(recibido.equals(enviado)).toBe(true);
    expect(recibido.includes(Buffer.from(JPEG))).toBe(true);
  });
});
