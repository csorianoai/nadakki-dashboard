jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";
import { ESTADO_SENA, fetchSenas, postSena, mensajeSena } from "../senas";

describe("senas (F4F-6 parte 4)", () => {
  it("estados de sena en espanol", () => {
    expect(ESTADO_SENA.recibida).toMatch(/recibida/i);
    expect(ESTADO_SENA.aplicada).toMatch(/venta/i);
    expect(ESTADO_SENA.ganada).toMatch(/ganada/i);
    expect(ESTADO_SENA.devuelta).toMatch(/devuelta/i);
  });

  it("textos llanos para lo que el servidor rechaza", () => {
    expect(mensajeSena("ESQUEMA_FISCAL_NO_APLICADO")).toMatch(/Disponible cuando se active la contabilidad fiscal/);
    expect(mensajeSena("DEPOSIT_NOT_FOUND")).toBeTruthy();
    expect(mensajeSena("ALGO_RARO")).toBeNull();
  });

  it("senas: lee y registra con Idempotency-Key, sin X-Tenant-ID (el tenant sale del token)", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    await fetchSenas("v1");
    await postSena("v1", { amount: "1.000,00", currency: "ars", received_at: "2026-11-16", note: "" }, "clave-1");
    const [, init] = (apiFetch as jest.Mock).mock.calls[1];
    expect(init.headers["Idempotency-Key"]).toBe("clave-1");
    expect(init.headers["X-Tenant-ID"]).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ amount: "1000.00", currency: "ARS", received_at: "2026-11-16" });
    expect((apiFetch as jest.Mock).mock.calls[0][0]).toBe("/api/v1/autos/vehicles/v1/deposits");
  });
});
