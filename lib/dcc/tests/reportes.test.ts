import { apiFetch } from "@/lib/api/fetch-client";
import { fetchBalanceComprobacion, REPORT_DEFINITIONS } from "@/lib/dcc/reportes";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

const responde = (status: number, body: unknown) =>
  (apiFetch as jest.Mock).mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });

describe("catalogo N7 (Centro de Reportes v2)", () => {
  it("lista los 9 contables y el ejecutivo, con su naturaleza firmada", () => {
    expect(REPORT_DEFINITIONS.filter((r) => r.grupo === "Contabilidad")).toHaveLength(9);
    expect(REPORT_DEFINITIONS.filter((r) => r.grupo === "Ejecutivo").map((r) => r.key)).toEqual(["executive_report@1.0"]);
    const snapshots = REPORT_DEFINITIONS.filter((r) => r.naturaleza === "SNAPSHOT").map((r) => r.key);
    expect(snapshots).toEqual(["dgii_606@1.0", "dgii_607@1.0"]);
  });

  it("solo es explicable el que trae cifra y desglose en la misma respuesta", () => {
    expect(REPORT_DEFINITIONS.filter((r) => r.explicable).map((r) => r.key)).toEqual(["trial_balance@1.0"]);
  });
});

describe("fetchBalanceComprobacion", () => {
  beforeEach(() => jest.resetAllMocks());

  it("devuelve los totales del backend tal cual, sin recalcular", async () => {
    responde(200, {
      total_debe: 100,
      total_haber: 99,
      cuadra: true,
      cuentas: [{ codigo: "1010", nombre: "Caja", total_debe: "5", total_haber: 0 }],
    });
    const b = await fetchBalanceComprobacion();
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/contable/balance-comprobacion", expect.anything());
    expect(b).toEqual({ totalDebe: 100, totalHaber: 99, cuadra: true, cuentas: [{ codigo: "1010", nombre: "Caja", debe: 5, haber: 0 }] });
  });

  it("forma invalida = error, nunca totales en 0", async () => {
    responde(200, { cuentas: [] });
    await expect(fetchBalanceComprobacion()).rejects.toThrow("DCC_BALANCE_FORMA_INVALIDA");
  });

  it("error HTTP conserva el status", async () => {
    responde(403, {});
    await expect(fetchBalanceComprobacion()).rejects.toMatchObject({ status: 403 });
  });
});
