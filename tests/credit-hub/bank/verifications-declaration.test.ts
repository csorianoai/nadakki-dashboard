import { getDeclaracionSemaforoRows } from "@/lib/credit-hub/dealer/vehicle-declaration";
import { isSecurityEndpointUnavailable } from "@/lib/credit-hub/api/securityClient";
import { CHApiError } from "@/lib/credit-hub/api/client";

describe("getDeclaracionSemaforoRows", () => {
  test("flags problem answers red", () => {
    const rows = getDeclaracionSemaforoRows({
      perdida_total: true,
      accidentes_reportados: "yes",
      gravamenes_vigentes: false,
      titulo_a_nombre_vendedor: false,
      kilometraje_coincide: false,
      firma_dealer: "Juan Pérez",
      fecha_firma: "2026-07-09T10:30:00Z",
      hash: "abc",
    });
    expect(rows.filter((r) => r.isBad)).toHaveLength(4);
    expect(rows.find((r) => r.label === "Pérdida total")?.isBad).toBe(true);
    expect(rows.find((r) => r.label === "Accidentes reportados")?.isBad).toBe(true);
  });

  test("clean declaration is all green", () => {
    const rows = getDeclaracionSemaforoRows({
      perdida_total: false,
      accidentes_reportados: "no",
      gravamenes_vigentes: false,
      titulo_a_nombre_vendedor: true,
      kilometraje_coincide: true,
      firma_dealer: "Juan Pérez",
      fecha_firma: "2026-07-09T10:30:00Z",
      hash: "abc",
    });
    expect(rows.every((r) => !r.isBad)).toBe(true);
  });
});

describe("isSecurityEndpointUnavailable", () => {
  test("404 hides verification cards gracefully", () => {
    const err = new CHApiError("Not found", 404, "GET", "/api/v2/credit/applications/x/verify-identity");
    expect(isSecurityEndpointUnavailable(err)).toBe(true);
  });
});
