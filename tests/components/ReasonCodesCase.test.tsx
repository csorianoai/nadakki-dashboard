/**
 * Los reason codes se declaran como el backend los ENVIA.
 *
 * `types/entitlements.ts:16` declaraba `"NO_ORGANIZATION_UNIT"` en MAYUSCULAS, y
 * `services/access/entitlements.py:65-66` lo emite en minusculas:
 *
 *   NO_ORGANIZATION_UNIT = "no_organization_unit"
 *   NO_BENEFICIARY_ENTITLEMENT = "no_beneficiary_entitlement"
 *
 * Dos consecuencias medidas, no supuestas:
 *
 *  1. `REASON_CODE_INFO[reason_code]` devolvia undefined para el codigo real, asi
 *     que la UI caia a mostrar el codigo crudo en vez de una explicacion.
 *  2. `CoreNavigation.tsx:200` comparaba contra la forma en MAYUSCULAS: la rama
 *     nunca entraba y el badge decia "Locked" --"no tienes permiso"-- cuando lo
 *     cierto es que el motor no pudo evaluar. Y `no_beneficiary_entitlement`, que
 *     es la misma situacion, no estaba contemplado en ningun sitio.
 *
 * Hay un caso por cada forma, porque el reconocedor tiene que aceptar las dos: el
 * backend manda minusculas, pero hay tests y fixtures del repo que siembran
 * mayusculas y no se puede romper a quien ya las usa.
 */
import { render, screen, waitFor } from "@testing-library/react";

import { CoreNavigation, CORE_NAV_CAPABILITY_KEYS } from "@/components/dealer/CoreNavigation";
import { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
import {
  ENTITLEMENT_REASON_CODES,
  REASON_CODE_INFO,
  type EntitlementReasonCode,
} from "@/types/entitlements";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

function batchDenegado(reasonCode: string) {
  return {
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: {
      scope: "tenant",
      unitScope: "omitted",
      results: Object.fromEntries(
        CORE_NAV_CAPABILITY_KEYS.map((key) => [
          key,
          { allowed: false, reason_code: reasonCode, limit: null, current_usage: null },
        ]),
      ),
    },
  };
}

beforeEach(() => batchMock.mockReset());

describe("el tipo declara lo que el backend manda", () => {
  it("los dos codigos estan en minusculas, como los emite el motor", () => {
    expect(ENTITLEMENT_REASON_CODES).toContain("no_organization_unit");
    expect(ENTITLEMENT_REASON_CODES).toContain("no_beneficiary_entitlement");
  });

  it("ya no se declara la forma en MAYUSCULAS, que el backend nunca envia", () => {
    expect(ENTITLEMENT_REASON_CODES as string[]).not.toContain("NO_ORGANIZATION_UNIT");
    expect(ENTITLEMENT_REASON_CODES as string[]).not.toContain("NO_BENEFICIARY_ENTITLEMENT");
  });

  it("los dos tienen copia en REASON_CODE_INFO, que era lo que faltaba", () => {
    for (const codigo of ["no_organization_unit", "no_beneficiary_entitlement"] as EntitlementReasonCode[]) {
      const info = REASON_CODE_INFO[codigo];
      expect(info).toBeDefined();
      expect(info.code).toBe(codigo);
      expect(info.title).toBe(ACCESS_UNVERIFIED_MESSAGE);
    }
  });

  it("la copia no dice que falte el modulo", () => {
    const info = REASON_CODE_INFO["no_organization_unit" as EntitlementReasonCode];
    expect(info.user_friendly_message).toContain("no se pudo comprobar");
    expect(info.user_friendly_message).not.toMatch(/plan/i);
  });

  it("cada codigo declarado tiene su entrada: ninguno queda sin copia", () => {
    for (const codigo of ENTITLEMENT_REASON_CODES) {
      expect(REASON_CODE_INFO[codigo]).toBeDefined();
    }
  });
});

describe("el reconocedor acepta las dos formas", () => {
  it("la que manda el backend", () => {
    expect(isAccessUnverified("no_organization_unit")).toBe(true);
    expect(isAccessUnverified("no_beneficiary_entitlement")).toBe(true);
  });

  it("y la que siembran fixtures y tests del repo", () => {
    expect(isAccessUnverified("NO_ORGANIZATION_UNIT")).toBe(true);
    expect(isAccessUnverified("NO_BENEFICIARY_ENTITLEMENT")).toBe(true);
  });

  it("y no confunde una denegacion de plan con una verificacion fallida", () => {
    for (const codigo of ["UPGRADE_REQUIRED", "LIMIT_REACHED", "DEFAULT_DENY"]) {
      expect(isAccessUnverified(codigo)).toBe(false);
    }
  });
});

describe("CoreNavigation", () => {
  it("con no_organization_unit el badge deja de decir Locked", async () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
    expect(screen.queryByText("Locked")).toBeNull();
  });

  it("con no_beneficiary_entitlement, lo mismo", async () => {
    batchMock.mockReturnValue(batchDenegado("no_beneficiary_entitlement"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
  });

  it("vale igual con la forma en MAYUSCULAS", async () => {
    batchMock.mockReturnValue(batchDenegado("NO_ORGANIZATION_UNIT"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
  });

  it("una denegacion por plan sigue diciendo Locked, que es lo correcto", async () => {
    batchMock.mockReturnValue(batchDenegado("UPGRADE_REQUIRED"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Locked").length).toBeGreaterThan(0));
    expect(screen.queryByText("Sin verificar")).toBeNull();
  });

  it("el limite alcanzado conserva su propio badge", async () => {
    batchMock.mockReturnValue(batchDenegado("LIMIT_REACHED"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Limit Hit").length).toBeGreaterThan(0));
  });
});
