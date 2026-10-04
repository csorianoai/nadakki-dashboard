/**
 * El guion de D2 (`e2e/mapaal/D2.spec.ts`) contra el codigo de la app. Si
 * alguien renombra un testid, cambia la frase del aviso o anade un enlace con
 * capability al menu del dealer, falla aqui y no en el loop.
 */
import fs from "fs";
import path from "path";
import {
  AVISO,
  MODULOS,
  PLACEHOLDER_TENANT,
  REASON,
  RUTA_PANEL,
  TENANT_QA,
  TESTIDS,
  denegarCuerpo,
} from "@/e2e/mapaal/d2-guion";
import { TENANT_QA as TENANT_QA_D1 } from "@/e2e/mapaal/d1-red";
import {
  ACCESS_UNVERIFIED_MESSAGE,
  isAccessUnverified,
} from "@/lib/access/reason-codes";
import {
  DEALER_NAV_CAPABILITY_KEYS,
  DEALER_NAV_GROUPS,
} from "@/components/dealer-management/shell/dealer-nav";

const SIDEBAR = fs.readFileSync(
  path.join(process.cwd(), "components/dealer-management/shell/DealerSidebar.tsx"),
  "utf8",
);

const LOGIN = fs.readFileSync(path.join(process.cwd(), "app/(auth)/login/page.tsx"), "utf8");
const D2_SPEC = fs.readFileSync(path.join(process.cwd(), "e2e/mapaal/D2.spec.ts"), "utf8");

describe("D2 login", () => {
  it("el campo de tenant tiene ese placeholder exacto y el del email lo contiene", () => {
    expect(LOGIN).toContain(`placeholder="${PLACEHOLDER_TENANT}"`);
    expect(LOGIN).toMatch(new RegExp(`placeholder="[^"]+@${PLACEHOLDER_TENANT}[^"]*"`));
  });

  it("el spec busca el campo de tenant con exact (si no, en el subdominio pisa el email)", () => {
    expect(D2_SPEC).toContain("getByPlaceholder(PLACEHOLDER_TENANT, { exact: true })");
    expect(D2_SPEC).not.toMatch(/getByPlaceholder\("tu-institucion"\)/);
  });

  it("el tenant QA es el mismo que usan los otros guiones", () => {
    expect(TENANT_QA).toBe(TENANT_QA_D1);
  });
});

describe("D2 guion vs app", () => {
  it("la frase del aviso es la de la capa de acceso", () => {
    expect(AVISO).toBe(ACCESS_UNVERIFIED_MESSAGE);
  });

  it("el reason code es de los que la app trata como acceso no verificado", () => {
    expect(isAccessUnverified(REASON)).toBe(true);
  });

  it("los testids existen en DealerSidebar", () => {
    for (const id of Object.values(TESTIDS)) {
      expect(SIDEBAR).toContain(`data-testid="${id}"`);
    }
  });

  it("MODULOS son exactamente los enlaces del menu con capability", () => {
    const conCapability = DEALER_NAV_GROUPS.flatMap((g) => g.items)
      .filter((item) => item.capability !== null)
      .map((item) => item.href);
    expect([...MODULOS].sort()).toEqual([...conCapability].sort());
  });

  it("el panel es el Inicio del dealer, que se pinta sin capability", () => {
    const inicio = DEALER_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === RUTA_PANEL);
    expect(inicio?.capability).toBeNull();
  });
});

describe("denegarCuerpo", () => {
  const url = (keys: string[]) =>
    `https://qa.example/api/v1/access/entitlements/batch?capabilities=${keys.join(",")}`;

  it("deniega todas las claves que pide el menu, aunque el real venga vacio", () => {
    const cuerpo = denegarCuerpo(url(DEALER_NAV_CAPABILITY_KEYS), {});
    const results = cuerpo.results as Record<string, { allowed: boolean; reason_code: string }>;
    expect(Object.keys(results).sort()).toEqual([...DEALER_NAV_CAPABILITY_KEYS].sort());
    for (const r of Object.values(results)) {
      expect(r).toEqual({ allowed: false, reason_code: REASON, limit: null, current_usage: null });
    }
    expect(cuerpo.evaluated_organization_unit_id).toBeNull();
  });

  it("une las claves reales, cambia solo el veredicto y conserva el resto", () => {
    const real = {
      tenant_id: "qa",
      evaluated_organization_unit_id: "ou-1",
      results: { "autos.inventory.list": { allowed: true, reason_code: null, limit: 5, current_usage: 1 } },
    };
    const cuerpo = denegarCuerpo(url(["autos.leads.crm", " "]), real);
    expect(cuerpo.tenant_id).toBe("qa");
    expect(cuerpo.evaluated_organization_unit_id).toBeNull();
    const results = cuerpo.results as Record<string, { allowed: boolean }>;
    expect(Object.keys(results).sort()).toEqual(["autos.inventory.list", "autos.leads.crm"]);
    expect(Object.values(results).every((r) => r.allowed === false)).toBe(true);
  });

  it("sin parametro capabilities usa solo las claves reales", () => {
    const cuerpo = denegarCuerpo("https://qa.example/api/v1/access/entitlements/batch", {
      results: { x: { allowed: true } },
    });
    expect(Object.keys(cuerpo.results as object)).toEqual(["x"]);
  });
});
