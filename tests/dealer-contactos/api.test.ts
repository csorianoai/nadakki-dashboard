import { apiFetch } from "@/lib/api/fetch-client";
import { contactosApi, ContactosError } from "@/app/autos/dealer/contactos/contactos-api";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test("busca documentos en POST sin cabeceras de rol ni PII en URL", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
  await contactosApi.buscarDocumento({ dni: "12345678" });
  const [url, init] = (apiFetch as jest.Mock).mock.calls[0];
  expect(url).toBe("/api/v1/autos/contacts/search");
  expect(init.method).toBe("POST"); expect(init.headers).toBeUndefined();
  expect(JSON.parse(init.body)).toEqual({ dni: "12345678" });
});
test("403 no se convierte en listado vacío ni reintenta", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ ok: false, status: 403, json: async () => ({ detail: { reason_code: "CAPABILITY_DENIED" } }) });
  await expect(contactosApi.listar()).rejects.toBeInstanceOf(ContactosError);
  expect(apiFetch).toHaveBeenCalledTimes(1);
});
