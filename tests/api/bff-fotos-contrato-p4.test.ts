/**
 * @jest-environment node
 */

/**
 * Regresion D5 (3a vez): fotos del vehiculo a traves de `fotos.ts` Y del proxy BFF reales.
 *
 * #588 (panel), #616 (bytes del multipart) y #621 (204 del DELETE) rompieron el
 * mismo flujo en produccion con los tests en verde: los del panel mockean
 * `apiFetch` y los del proxy no usan `fotos.ts`, asi que ningun test recorria
 * el trayecto completo que recorre `e2e/mapaal/D5.spec.ts`. Aqui el cliente
 * llama al proxy de verdad y solo el backend es un mock.
 */

import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";
process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x80, 0xc3, 0x28]);
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Llamada = { url: string; method: string; headers: Record<string, string>; body?: ArrayBuffer };

async function conProxy(backend: (c: Llamada) => Response) {
  const llamadas: Llamada[] = [];
  const { GET, POST, DELETE } = await import("@/app/api/v1/[[...path]]/route");
  const handlers = { GET, POST, DELETE } as const;
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith(BACKEND)) {
      const c = { url, method: init?.method ?? "GET", headers: init?.headers as Record<string, string>, body: init?.body as ArrayBuffer };
      llamadas.push(c);
      return backend(c);
    }
    const req = new NextRequest(`https://dashboard.nadakki.test${url}`, {
      method: init?.method,
      headers: init?.headers,
      body: init?.body as BodyInit | undefined,
    });
    const path = new URL(req.url).pathname.replace(/^\/api\/v1\//, "").split("/");
    return handlers[(init?.method ?? "GET") as keyof typeof handlers](req, { params: Promise.resolve({ path }) });
  }) as unknown as typeof fetch;
  return llamadas;
}

describe("fotos del vehiculo: cliente + proxy BFF", () => {
  afterEach(() => jest.resetAllMocks());

  test("subir: 201, bytes intactos, nombre neutro y sin X-Tenant-ID", async () => {
    const llamadas = await conProxy(() => json({ media_id: "m1" }, 201));
    const { uploadVehiclePhoto } = await import("@/app/autos/dealer/inventario/[vehicleId]/fotos");
    const file = new File([JPEG], "DNI-juan-perez.jpg", { type: "image/jpeg" });

    await expect(uploadVehiclePhoto("v1", file)).resolves.toEqual({ media_id: "m1" });

    const [c] = llamadas;
    expect(c.url).toBe(`${BACKEND}/api/v1/autos/vehicles/v1/photos`);
    expect(c.headers["X-Tenant-ID"]).toBeUndefined();
    const cuerpo = Buffer.from(c.body as ArrayBuffer);
    expect(cuerpo.includes(Buffer.from(JPEG))).toBe(true);
    expect(cuerpo.toString("latin1")).toContain('name="file"');
    expect(cuerpo.toString("latin1")).not.toContain("juan");
  });

  test("formato malo: el 422 llega con su reason_code y se clasifica como otro_archivo", async () => {
    await conProxy(() => json({ detail: { reason_code: "unsupported_mime_type:image/gif" } }, 422));
    const { uploadVehiclePhoto, photoError } = await import("@/app/autos/dealer/inventario/[vehicleId]/fotos");

    const error = await uploadVehiclePhoto("v1", new File(["GIF89a"], "a.gif", { type: "image/gif" })).catch((e) => e);

    expect(photoError(error)).toMatchObject({ kind: "otro_archivo", reasonCode: "unsupported_mime_type:image/gif" });
  });

  test("503 del backend (almacenamiento sin configurar): el proxy lo reenvia tal cual y es 'despliegue', no 'otro_archivo'", async () => {
    await conProxy(() => json({ detail: { reason_code: "media_storage_unconfigured" } }, 503));
    const { uploadVehiclePhoto, photoError } = await import("@/app/autos/dealer/inventario/[vehicleId]/fotos");

    const error = await uploadVehiclePhoto("v1", new File(["GIF89a"], "a.gif", { type: "image/gif" })).catch((e) => e);

    expect(error.status).toBe(503);
    expect(photoError(error)).toMatchObject({ kind: "despliegue", reasonCode: "media_storage_unconfigured" });
  });

  test("eliminar: el 204 del backend no es un fallo", async () => {
    const llamadas = await conProxy(() => new Response(null, { status: 204 }));
    const { deleteVehiclePhoto } = await import("@/app/autos/dealer/inventario/[vehicleId]/fotos");

    await expect(deleteVehiclePhoto("v1", "m1")).resolves.toBeNull();
    expect(llamadas[0]).toMatchObject({ method: "DELETE", url: `${BACKEND}/api/v1/autos/vehicles/v1/photos/m1` });
  });

  test("listar: la miniatura del backend llega como url de la foto", async () => {
    await conProxy(() => json({ photos: [{ id: "m1", thumbnail_url: "https://cdn.test/m1.jpg", display_order: 0 }] }, 200));
    const { fetchVehiclePhotos } = await import("@/app/autos/dealer/inventario/[vehicleId]/fotos");

    await expect(fetchVehiclePhotos("v1")).resolves.toEqual([
      { id: "m1", url: "https://cdn.test/m1.jpg", isPrimary: false, order: 0 },
    ]);
  });
});
