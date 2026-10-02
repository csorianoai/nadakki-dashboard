/**
 * Reconocedor de "no pude evaluarte" del motor de acceso.
 *
 * Contrato medido sobre `origin/main` de nadakki-ai-suite:
 *
 *   services/access/entitlements.py:65-66   NO_BENEFICIARY_ENTITLEMENT =
 *                                           "no_beneficiary_entitlement"
 *                                           NO_ORGANIZATION_UNIT =
 *                                           "no_organization_unit"
 *   services/access/entitlements.py:330-339 sin `organization_unit_id` la cadena
 *                                           BENEFICIARY deniega CERRADO antes de
 *                                           consultar nada
 *
 * Dos propiedades que este fichero fija, porque las dos son faciles de romper sin
 * que nada mas se queje:
 *
 *  1. La comparacion NO distingue mayusculas. El backend manda minusculas y
 *     `types/entitlements.ts` las declaraba en MAYUSCULAS, asi que un `===`
 *     contra la forma declarada nunca entra. Hay un caso por cada forma.
 *  2. Los codigos NO son un error HTTP: viajan dentro de un 200, como items
 *     denegados del batch. De ahi `unverifiedReasonFromBatch`, que recorre los
 *     items en vez de mirar un `catch`.
 */
import {
  ACCESS_UNVERIFIABLE_REASONS,
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  isAccessUnverified,
  unverifiedReasonFromBatch,
} from "@/lib/access/reason-codes";

describe("el conjunto de codigos", () => {
  it("son exactamente los dos que el motor usa para decir que no pudo evaluar", () => {
    expect([...ACCESS_UNVERIFIABLE_REASONS].sort()).toEqual([
      "no_beneficiary_entitlement",
      "no_organization_unit",
    ]);
  });

  it("estan declarados en minusculas, como los emite el backend", () => {
    for (const codigo of ACCESS_UNVERIFIABLE_REASONS) {
      expect(codigo).toBe(codigo.toLowerCase());
    }
  });
});

describe("isAccessUnverified", () => {
  it("reconoce la forma que manda el backend", () => {
    expect(isAccessUnverified("no_organization_unit")).toBe(true);
    expect(isAccessUnverified("no_beneficiary_entitlement")).toBe(true);
  });

  it("reconoce tambien la forma en MAYUSCULAS que siembran fixtures del repo", () => {
    expect(isAccessUnverified("NO_ORGANIZATION_UNIT")).toBe(true);
    expect(isAccessUnverified("NO_BENEFICIARY_ENTITLEMENT")).toBe(true);
  });

  it("y cualquier mezcla de caja, porque la caja no es el dato", () => {
    expect(isAccessUnverified("No_Organization_Unit")).toBe(true);
    expect(isAccessUnverified("no_BENEFICIARY_entitlement")).toBe(true);
  });

  it("tolera espacios alrededor", () => {
    expect(isAccessUnverified("  no_organization_unit  ")).toBe(true);
  });

  it("no confunde una denegacion por plan con una verificacion fallida", () => {
    for (const codigo of [
      "UPGRADE_REQUIRED",
      "NO_ACTIVE_SUBSCRIPTION",
      "LIMIT_REACHED",
      "ADD_ON_REQUIRED",
      "TARGET_CORE_NOT_READY",
      "DEFAULT_DENY",
      "ALLOWED",
    ]) {
      expect(isAccessUnverified(codigo)).toBe(false);
    }
  });

  it("sin codigo no inventa un fallo de verificacion", () => {
    expect(isAccessUnverified(null)).toBe(false);
    expect(isAccessUnverified(undefined)).toBe(false);
    expect(isAccessUnverified("")).toBe(false);
    expect(isAccessUnverified("   ")).toBe(false);
  });

  it("un codigo que solo contiene al otro como subcadena no cuenta", () => {
    expect(isAccessUnverified("x_no_organization_unit")).toBe(false);
    expect(isAccessUnverified("no_organization_unit_x")).toBe(false);
  });
});

describe("unverifiedReasonFromBatch", () => {
  it("encuentra el codigo en un item denegado, que es donde llega de verdad", () => {
    expect(
      unverifiedReasonFromBatch({
        "autos.inventory.list": { reason_code: "no_organization_unit" },
      }),
    ).toBe("no_organization_unit");
  });

  it("basta UN item: el motor puede resolver unas capabilities y no otras", () => {
    expect(
      unverifiedReasonFromBatch({
        "autos.inventory.list": { reason_code: "ALLOWED" },
        "credit.applications.view": { reason_code: "UPGRADE_REQUIRED" },
        "legal.cases.view": { reason_code: "no_beneficiary_entitlement" },
      }),
    ).toBe("no_beneficiary_entitlement");
  });

  it("devuelve el codigo recortado, no el crudo con espacios", () => {
    expect(
      unverifiedReasonFromBatch({ k: { reason_code: "  no_organization_unit  " } }),
    ).toBe("no_organization_unit");
  });

  it("un batch que concede no produce ningun motivo", () => {
    expect(
      unverifiedReasonFromBatch({
        "autos.inventory.list": { reason_code: "ALLOWED" },
        "credit.applications.view": { reason_code: "ALLOWED" },
      }),
    ).toBeNull();
  });

  it("un batch denegado por plan tampoco: eso no es falta de verificacion", () => {
    expect(
      unverifiedReasonFromBatch({ "credit.applications.view": { reason_code: "UPGRADE_REQUIRED" } }),
    ).toBeNull();
  });

  it("sin resultados no se afirma nada", () => {
    expect(unverifiedReasonFromBatch(null)).toBeNull();
    expect(unverifiedReasonFromBatch(undefined)).toBeNull();
    expect(unverifiedReasonFromBatch({})).toBeNull();
  });

  it("items sin reason_code no rompen la lectura", () => {
    expect(unverifiedReasonFromBatch({ a: undefined, b: {}, c: { reason_code: null } })).toBeNull();
  });
});

describe("textos de producto", () => {
  it("la frase es la pedida, palabra por palabra", () => {
    expect(ACCESS_UNVERIFIED_MESSAGE).toBe("No se pudieron verificar tus accesos");
  });

  it("el detalle dice que no es falta de modulos, y no nombra el plan", () => {
    expect(ACCESS_UNVERIFIED_DETAIL).toContain("no porque no tengas módulos");
    expect(ACCESS_UNVERIFIED_DETAIL).not.toMatch(/\bplan\b/i);
    expect(ACCESS_UNVERIFIED_DETAIL).not.toMatch(/no incluido/i);
  });
});
