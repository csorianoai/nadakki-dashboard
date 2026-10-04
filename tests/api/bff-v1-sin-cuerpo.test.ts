/**
 * @jest-environment node
 */

/**
 * El proxy BFF v1 conserva un 204 del backend (D5 regression, suite#1501).
 *
 * Eliminar una foto (`DELETE /autos/vehicles/{id}/photos/{media_id}`) contesta
 * 204 sin cuerpo. El proxy construia `new NextResponse("", {status: 204})`, que
 * lanza (un 204 no admite cuerpo), caia en el `catch` y devolvia 502: la foto se
 * borraba y el panel mostraba un error. Ninguna prueba cruzaba el proxy con un
 * 204: las del panel mockean `apiFetch`.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const PARAMS = { params: Promise.resolve({ path: ["autos", "vehicles", "v1", "photos", "m1"] }) };

afterEach(() => jest.resetAllMocks());

test("un 204 del backend llega como 204, no como 502", async () => {
  global.fetch = jest.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
  const { DELETE } = await import("@/app/api/v1/[[...path]]/route");
  const req = new NextRequest("https://dashboard.nadakki.test/api/v1/autos/vehicles/v1/photos/m1", {
    method: "DELETE",
    headers: { Authorization: "Bearer t" },
  });

  const res = await DELETE(req, PARAMS);

  expect(res.status).toBe(204);
  expect(await res.text()).toBe("");
});
