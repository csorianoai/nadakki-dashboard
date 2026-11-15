/**
 * Pulido del alta con compra (F4D-5, parte 1/3): mensajes por reason_code,
 * VIN duplicado en campo y lectura de los modos de adquisicion (F4D-3).
 */
import { renderHook, waitFor, act } from "@testing-library/react";

import { MOTIVO_EN_CAMPO } from "@/lib/dealer-management/vehicle-manual";
import { MENSAJE_ALTA, PURCHASE_EMPTY, validatePurchase } from "@/lib/dealer-management/vehicle-purchase";
import {
  ACQUISITION_MODES_PATH,
  fetchAcquisitionModes,
  useAcquisitionModes,
} from "@/lib/dealer-management/acquisition-modes";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const res = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as unknown as Response;

beforeEach(() => fetchMock.mockReset());

describe("mensajes del alta", () => {
  it("VIN_DUPLICATE marca el campo vin con un mensaje propio", () => {
    expect(MOTIVO_EN_CAMPO.VIN_DUPLICATE.campo).toBe("vin");
    expect(MOTIVO_EN_CAMPO.VIN_DUPLICATE.mensaje).toMatch(/Ya existe un vehículo con ese VIN/);
    expect(MENSAJE_ALTA.VIN_DUPLICATE).toMatch(/Ya existe un vehículo con ese VIN/);
  });

  it.each([
    ["SELLER_CONTACT_NOT_FOUND", /contacto vendedor/i],
    ["PAYMENT_SUM_MISMATCH", /suma de los pagos/i],
    ["CAPABILITY_DENIED", /permiso/i],
    ["DEALER_NOT_ASSIGNED", /asignad/i],
    ["IDEMPOTENCY_KEY_REUSED", /ya se envió/i],
  ])("%s tiene mensaje propio", (code, texto) => {
    expect(MENSAJE_ALTA[code]).toMatch(texto);
  });

  it("lo desconocido no tiene mensaje propio (conserva el generico)", () => {
    expect(MENSAJE_ALTA.RARO_XYZ).toBeUndefined();
  });

  it("sin modo de adquisicion pide elegirlo del desplegable", () => {
    const errores = validatePurchase({ ...PURCHASE_EMPTY, acquisition_mode_code: "" }, "ARS");
    expect(errores.acquisition_mode_code).toBe("Elige el modo de adquisición.");
  });
});

describe("modos de adquisicion", () => {
  it("lee GET /api/v1/autos/acquisition-modes y devuelve code y label", async () => {
    fetchMock.mockResolvedValue(res(200, { items: [{ code: "permuta", label: "Permuta", extra: 1 }, { code: " ", label: "x" }, { label: "sin code" }] }));
    await expect(fetchAcquisitionModes()).resolves.toEqual([{ code: "permuta", label: "Permuta" }]);
    expect(fetchMock.mock.calls[0][0]).toBe(ACQUISITION_MODES_PATH);
    expect(ACQUISITION_MODES_PATH).toBe("/api/v1/autos/acquisition-modes");
  });

  it("falla ante un HTTP de error o una forma inesperada (nunca inventa lista)", async () => {
    fetchMock.mockResolvedValueOnce(res(500, {}));
    await expect(fetchAcquisitionModes()).rejects.toThrow("HTTP_500");
    fetchMock.mockResolvedValueOnce(res(200, { nope: true }));
    await expect(fetchAcquisitionModes()).rejects.toThrow("BAD_SHAPE");
  });

  it("el hook pasa de loading a ok, y a error con reintento que vuelve a leer", async () => {
    fetchMock.mockResolvedValueOnce(res(500, {}));
    const hook = renderHook(() => useAcquisitionModes(true));
    expect(hook.result.current.status).toBe("loading");
    await waitFor(() => expect(hook.result.current.status).toBe("error"));
    fetchMock.mockResolvedValueOnce(res(200, { items: [{ code: "compra_directa", label: "Compra directa" }] }));
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.status).toBe("ok"));
    expect(hook.result.current).toMatchObject({ items: [{ code: "compra_directa", label: "Compra directa" }] });
  });

  it("deshabilitado no hace ninguna peticion", () => {
    renderHook(() => useAcquisitionModes(false));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
