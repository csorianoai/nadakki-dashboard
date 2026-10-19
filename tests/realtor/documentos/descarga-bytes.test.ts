/**
 * PS-15-DOCS-DESCARGA-B: la descarga entrega los bytes del documento tal cual.
 *
 * Usa el apiFetch real (sin mockear lib/api/fetch-client) y un fetch global que
 * devuelve un PDF con bytes >= 0x80 y Content-Disposition, como lo reenvía el BFF
 * desde PS-15-BFF-BINARIOS. Comprueba que el blob que se entrega al navegador es
 * idéntico byte a byte y que el nombre sale de Content-Disposition.
 */
import { downloadDocument } from "@/lib/realtor/documentos/download";

jest.mock("@/lib/auth/token-refresh", () => ({
  isTokenExpiringSoon: () => false,
  refreshAccessToken: async () => false,
}));

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, 0x80, 0xff, 0xc3, 0x00, 0x9f]);

function upstream(headers: Record<string, string>) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    status: 200,
    ok: true,
    headers: { get: (h: string) => lower[h.toLowerCase()] ?? null },
    blob: async () => new Blob([PDF], { type: lower["content-type"] ?? "" }),
  };
}

function readBytes(b: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(b);
  });
}

let created: Blob[];
let downloads: string[];

beforeEach(() => {
  created = [];
  downloads = [];
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b: Blob) => {
    created.push(b);
    return "blob:doc";
  };
  (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});

afterEach(() => jest.restoreAllMocks());

function mockFetch(res: ReturnType<typeof upstream>) {
  const f = jest.fn(async () => res);
  global.fetch = f as unknown as typeof fetch;
  return f;
}

test("el blob entregado conserva los bytes >= 0x80 del PDF y su tipo", async () => {
  const f = mockFetch(upstream({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="acuerdo.pdf"' }));
  const r = await downloadDocument("req-123", "Acuerdo real");
  expect(r).toEqual({ ok: true });
  expect(String((f.mock.calls[0] as unknown[])[0])).toBe("/api/v1/realestate/documents/req-123/download");
  expect(created).toHaveLength(1);
  expect(created[0].type).toBe("application/pdf");
  expect(Array.from(await readBytes(created[0]))).toEqual(Array.from(PDF));
});

test("el nombre del fichero sale de Content-Disposition (con extensión)", async () => {
  mockFetch(upstream({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="acuerdo.pdf"' }));
  await downloadDocument("req-123", "Acuerdo real");
  expect(downloads).toEqual(["acuerdo.pdf"]);
});

test("filename* (RFC 5987) tiene prioridad y se decodifica", async () => {
  mockFetch(upstream({ "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"acuerdo.pdf\"; filename*=UTF-8''acuerdo%20firmado%20%C3%B1.pdf" }));
  await downloadDocument("req-123", "Acuerdo real");
  expect(downloads).toEqual(["acuerdo firmado ñ.pdf"]);
});

test("sin Content-Disposition se usa el nombre del documento", async () => {
  mockFetch(upstream({ "Content-Type": "application/pdf" }));
  await downloadDocument("req-123", "Acuerdo real");
  expect(downloads).toEqual(["Acuerdo real"]);
});

test("un nombre con rutas no sale del directorio de descargas", async () => {
  mockFetch(upstream({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="../../etc/acuerdo.pdf"' }));
  await downloadDocument("req-123", "Acuerdo real");
  expect(downloads).toEqual(["acuerdo.pdf"]);
});
