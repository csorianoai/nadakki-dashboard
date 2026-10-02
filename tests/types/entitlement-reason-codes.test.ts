/**
 * El tipo declara las formas que el backend ENVIA.
 *
 * `services/access/entitlements.py:65-66` emite estos dos EN MINUSCULAS, al
 * contrario que el resto del enum:
 *
 *   NO_ORGANIZATION_UNIT       = "no_organization_unit"
 *   NO_BENEFICIARY_ENTITLEMENT = "no_beneficiary_entitlement"
 *
 * El tipo solo declaraba `"NO_ORGANIZATION_UNIT"`, asi que
 * `REASON_CODE_INFO[reason_code]` devolvia undefined para el codigo real y la UI
 * caia a mostrar el codigo crudo. Y `no_beneficiary_entitlement` no existia en
 * ningun sitio del frontend.
 *
 * Este packet AÑADE las dos formas en minusculas y conserva la de MAYUSCULAS: el
 * propio frontend la produce todavia (`lib/dealer/access-context.ts`) y quitarla
 * aqui rompe la compilacion antes de migrar a ese consumidor. El caso que fija el
 * fin de la transicion vive en el packet que la retira.
 */
import {
  ENTITLEMENT_REASON_CODES,
  REASON_CODE_INFO,
  type EntitlementReasonCode,
} from "@/types/entitlements";

const MINUSCULAS = ["no_organization_unit", "no_beneficiary_entitlement"] as EntitlementReasonCode[];

describe("formas declaradas", () => {
  it("las dos que el backend envia estan declaradas, en minusculas", () => {
    for (const codigo of MINUSCULAS) {
      expect(ENTITLEMENT_REASON_CODES).toContain(codigo);
    }
  });

  it("la lista no tiene duplicados", () => {
    expect(ENTITLEMENT_REASON_CODES).toEqual([...new Set(ENTITLEMENT_REASON_CODES)]);
  });

  it("cada codigo declarado tiene copia: ninguno queda sin explicacion", () => {
    for (const codigo of ENTITLEMENT_REASON_CODES) {
      expect(REASON_CODE_INFO[codigo]).toBeDefined();
      expect(REASON_CODE_INFO[codigo].code).toBe(codigo);
    }
  });
});

describe("copia de los codigos de verificacion fallida", () => {
  it("el titulo es la frase de producto, no un tecnicismo", () => {
    for (const codigo of MINUSCULAS) {
      expect(REASON_CODE_INFO[codigo].title).toBe("No se pudieron verificar tus accesos");
    }
  });

  it("el mensaje dice que no es falta de modulo", () => {
    for (const codigo of MINUSCULAS) {
      expect(REASON_CODE_INFO[codigo].user_friendly_message).toContain("no se pudo comprobar");
    }
  });

  it("y NUNCA dice que no este incluido en el plan", () => {
    for (const codigo of MINUSCULAS) {
      const info = REASON_CODE_INFO[codigo];
      const visible = `${info.title} ${info.description} ${info.user_friendly_message}`;
      expect(visible).not.toMatch(/\bplan\b/i);
      expect(visible).not.toMatch(/no incluido/i);
      expect(visible).not.toMatch(/upgrade/i);
    }
  });

  it("la forma en MAYUSCULAS, mientras siga declarada, dice lo mismo", () => {
    const info = REASON_CODE_INFO["NO_ORGANIZATION_UNIT" as EntitlementReasonCode];
    expect(info.title).toBe("No se pudieron verificar tus accesos");
    expect(`${info.title} ${info.description}`).not.toMatch(/\bplan\b/i);
  });

  it("una denegacion por plan SI habla del plan: no se confunden", () => {
    const info = REASON_CODE_INFO["UPGRADE_REQUIRED" as EntitlementReasonCode];
    expect(info.title).not.toBe("No se pudieron verificar tus accesos");
  });
});

describe("ningun estado salvo allowed lleva accion de apertura", () => {
  it("los codigos de verificacion fallida piden contactar a soporte, no abrir", () => {
    for (const codigo of MINUSCULAS) {
      expect(REASON_CODE_INFO[codigo].action_required).toBe("contact_admin");
    }
  });
});
