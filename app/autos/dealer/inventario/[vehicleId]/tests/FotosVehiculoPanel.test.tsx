/**
 * Fotos de un vehiculo (D5) contra el contrato P4 parte 2. Se mockea `apiFetch`:
 * lo que se prueba es la ruta, el metodo y el multipart que salen por la red.
 * Vive junto a la pagina para que el packet quepa en dos directorios (GR-12).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FotosVehiculoPanel } from "../FotosVehiculoPanel";
import { nombreNeutro, parsePhotos, photoError } from "../fotos";
import { AccessApiError } from "@/lib/access/client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const BASE = "/api/v1/autos/vehicles/veh-1/photos";

const FOTO = { id: "m-1", cdn_url: "https://cdn.test/abc.jpg", thumbnail_url: null, display_order: 0, is_primary: true };

function res(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

function responde(post: Response, list: unknown[] = []) {
  fetchMock.mockImplementation(async (_path: string, init?: RequestInit) => {
    if (init?.method === "POST") return post;
    if (init?.method === "DELETE") return res({ deleted: true, media_id: "m-1" });
    return res({ photos: list });
  });
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><FotosVehiculoPanel vehicleId="veh-1" /></QueryClientProvider>);
}

function elige(file = new File([new Uint8Array(2048)], "DNI-juan-perez.jpg", { type: "image/jpeg" })) {
  fireEvent.change(screen.getByTestId("vehicle-photos-input"), { target: { files: [file] } });
}

beforeEach(() => fetchMock.mockReset());

test("lista vacia es un estado, no un error", async () => {
  responde(res({}, 201));
  montar();
  expect(await screen.findByTestId("vehicle-photos-empty")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(BASE, expect.objectContaining({ headers: { Accept: "application/json" } }));
});

test("pinta la foto del CDN sin nombre de archivo", async () => {
  responde(res({}, 201), [FOTO]);
  montar();
  const img = await screen.findByRole("img", { name: "Foto 1 del vehículo" });
  expect(img).toHaveAttribute("src", FOTO.cdn_url);
  expect(screen.getByText("Principal")).toBeInTheDocument();
});

test("sube por multipart en `file` con nombre neutro, sin el original", async () => {
  responde(res({ media_id: "m-2", cdn_url: "https://cdn.test/x.jpg" }, 201));
  montar();
  await screen.findByTestId("vehicle-photos-empty");
  elige();
  expect(await screen.findByTestId("vehicle-photos-ack")).toHaveTextContent("Foto subida.");
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(post?.[0]).toBe(BASE);
  expect((post?.[1]?.body as FormData).get("file")).toHaveProperty("name", "foto.jpg");
  expect(new Headers(post?.[1]?.headers).has("X-Tenant-ID")).toBe(false);
});

test("el 422 muestra el texto del backend y dice que hacer", async () => {
  const texto = "No pudimos procesar la foto. Volve a exportarla desde la camara.";
  responde(res({ detail: { reason_code: "metadata_strip_failed", detail: texto } }, 422));
  montar();
  await screen.findByTestId("vehicle-photos-empty");
  elige();
  const alerta = await screen.findByTestId("vehicle-photos-error");
  expect(alerta).toHaveAttribute("data-kind", "reexportar");
  expect(alerta).toHaveTextContent(texto);
});

test("eliminar llama al DELETE con el media_id", async () => {
  responde(res({}, 201), [FOTO]);
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "Eliminar foto 1" }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/m-1`, expect.objectContaining({ method: "DELETE" })),
  );
  expect(await screen.findByTestId("vehicle-photos-ack")).toHaveTextContent("Foto eliminada.");
});

test("clasifica los codigos del contrato por lo que tiene que hacer el dealer", () => {
  const err = (status: number, reason_code: string) =>
    photoError(new AccessApiError({ status, reason_code, detail: { reason_code }, endpoint: BASE }));
  expect(err(413, "file_too_large:10485760").kind).toBe("reintentar");
  expect(err(502, "storage_error:Timeout").kind).toBe("reintentar");
  expect(err(422, "unsupported_mime_type:image/gif").kind).toBe("otro_archivo");
  expect(err(422, "max_photos_reached:20").kind).toBe("tope");
  expect(err(503, "media_storage_unconfigured").kind).toBe("despliegue");
  expect(err(404, "not_found").kind).toBe("no_es_tuyo");
});

test("parsePhotos ordena y descarta filas sin url", () => {
  const rows = parsePhotos({
    photos: [{ ...FOTO, id: "b", display_order: 1 }, { ...FOTO, id: "a", display_order: 0 }, { id: "x" }],
  });
  expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  expect(nombreNeutro(new File(["x"], "Patente AB123CD.png", { type: "image/png" }))).toBe("foto.png");
});
