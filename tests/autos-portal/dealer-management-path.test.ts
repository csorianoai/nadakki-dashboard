import {
  isAutosConsumerPublicPath,
  isDealerManagementPath,
} from "@/lib/autos-portal/routes";

describe("isDealerManagementPath", () => {
  test("reconoce la raíz y las subrutas del panel", () => {
    expect(isDealerManagementPath("/autos/dealer")).toBe(true);
    expect(isDealerManagementPath("/autos/dealer/inventario")).toBe(true);
    expect(isDealerManagementPath("/autos/dealer/inventario/abc/registrar")).toBe(true);
  });

  test("no captura el marketplace público ni rutas vecinas", () => {
    expect(isDealerManagementPath("/autos")).toBe(false);
    expect(isDealerManagementPath("/autos/vehiculos")).toBe(false);
    expect(isDealerManagementPath("/autos/dealership")).toBe(false);
    expect(isDealerManagementPath("/credit-hub/dealer")).toBe(false);
    expect(isDealerManagementPath(null)).toBe(false);
  });

  test("el panel sigue siendo privado: nunca entra en la lista pública", () => {
    expect(isAutosConsumerPublicPath("/autos/dealer")).toBe(false);
    expect(isAutosConsumerPublicPath("/autos/dealer/inventario")).toBe(false);
  });
});
