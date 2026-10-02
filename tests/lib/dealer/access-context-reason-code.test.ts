/**
 * El frontend emite el MISMO codigo que el backend, no una variante.
 *
 * `resolveDealerAccessContext` producia `"NO_ORGANIZATION_UNIT"` en MAYUSCULAS
 * mientras el motor de acceso emite `"no_organization_unit"`
 * (`services/access/entitlements.py:66`). Dos ortografias para una sola
 * condicion dejaban a `REASON_CODE_INFO` sin copia en una de las dos, y a
 * cualquier `===` reconociendo solo una.
 *
 * Es la misma condicion semantica: falta la unidad organizativa. Da igual si el
 * que se da cuenta es el cliente --no la tiene para enviarla-- o el motor --la
 * recibio vacia--: lo que el usuario necesita leer es lo mismo, asi que el codigo
 * tiene que ser el mismo.
 *
 * Este fichero NO importa `lib/access/reason-codes`: ese modulo llega en otro
 * packet de la cadena y esta pieza no depende de el. Lo que aqui se mide es el
 * codigo que el contexto EMITE y que exista su copia; que el reconocedor lo
 * acepte se mide en el packet del reconocedor.
 */
import {
  dealerAccessDenyReason,
  resetDealerAccessMemoryForTests,
  resolveDealerAccessContext,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";
import { REASON_CODE_INFO } from "@/types/entitlements";

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
});

function sembrarSinUnidad() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  window.localStorage.setItem("nadakki_dealer_id", "dealer-a");
  window.localStorage.setItem("nadakki_dealer_tenant_id", "tenant-a");
  window.localStorage.removeItem("nadakki_organization_unit_id");
}

describe("sin unidad organizativa en el contexto", () => {
  it("el estado es no_organization_unit", () => {
    sembrarSinUnidad();
    const resuelto = resolveDealerAccessContext();
    expect(resuelto.status).toBe("no_organization_unit");
  });

  it("el reason_code es el que emite el backend, en minusculas", () => {
    sembrarSinUnidad();
    expect(dealerAccessDenyReason()).toBe("no_organization_unit");
  });

  it("ya NO es la variante en MAYUSCULAS", () => {
    sembrarSinUnidad();
    expect(dealerAccessDenyReason()).not.toBe("NO_ORGANIZATION_UNIT");
  });

  it("coincide exactamente con el valor del enum del backend", () => {
    sembrarSinUnidad();
    expect(dealerAccessDenyReason()).toBe(dealerAccessDenyReason()!.toLowerCase());
  });

  it("y tiene copia en REASON_CODE_INFO, que era lo que se perdia", () => {
    sembrarSinUnidad();
    const codigo = dealerAccessDenyReason();
    const info = REASON_CODE_INFO[codigo!];
    expect(info).toBeDefined();
    expect(info.title).toBe("No se pudieron verificar tus accesos");
  });

  it("la copia no dice que falte el modulo ni habla del plan", () => {
    sembrarSinUnidad();
    const info = REASON_CODE_INFO[dealerAccessDenyReason()!];
    const visible = `${info.title} ${info.description} ${info.user_friendly_message}`;
    expect(visible).not.toMatch(/\bplan\b|no incluido|upgrade/i);
  });
});

describe("los otros motivos no cambian", () => {
  it("sin tenant sigue siendo TENANT_NOT_FOUND", () => {
    expect(dealerAccessDenyReason()).toBe("TENANT_NOT_FOUND");
  });

  it("sin dealer sigue siendo DEFAULT_DENY", () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    expect(dealerAccessDenyReason()).toBe("DEFAULT_DENY");
  });

  it("y ninguno de los dos se confunde con la falta de unidad", () => {
    expect(dealerAccessDenyReason()).not.toBe("no_organization_unit");
  });

  it("con contexto completo no hay motivo de denegacion", () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
    expect(dealerAccessDenyReason()).toBeNull();
  });
});
