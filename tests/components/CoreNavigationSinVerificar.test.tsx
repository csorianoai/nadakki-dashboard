/**
 * `CoreNavigation` distingue "no pudimos comprobar" de "no tienes permiso".
 *
 * `components/dealer/CoreNavigation.tsx:199` comparaba contra
 * "NO_ORGANIZATION_UNIT" en MAYUSCULAS, y el backend lo emite en minusculas
 * (`services/access/entitlements.py:65-66`). La rama NUNCA entraba: el badge caia
 * a "Locked" --"no tienes permiso"-- cuando lo cierto es que el motor no llego a
 * evaluar. Y `no_beneficiary_entitlement`, que es la misma situacion, no estaba
 * contemplado.
 *
 * Los codigos llegan POR CAPABILITY dentro de un 200, no como error HTTP, asi que
 * los casos siembran items denegados del batch.
 *
 * El ultimo describe fija la regla de producto que mas facil es romper sin
 * notarlo: ningun estado salvo `allowed=true` lleva enlace.
 */
import { render, screen, waitFor } from "@testing-library/react";

import { CORE_NAV_CAPABILITY_KEYS, CoreNavigation } from "@/components/dealer/CoreNavigation";
import { ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

/** Batch 200 con todos los items denegados por el codigo que se pruebe. */
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

function batchConcedido() {
  return {
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: {
      scope: "tenant",
      unitScope: "included",
      results: Object.fromEntries(
        CORE_NAV_CAPABILITY_KEYS.map((key) => [
          key,
          { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
        ]),
      ),
    },
  };
}

beforeEach(() => batchMock.mockReset());

describe("verificacion fallida", () => {
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

  it("vale igual con la forma en MAYUSCULAS, que es la que siembran los fixtures", async () => {
    batchMock.mockReturnValue(batchDenegado("NO_ORGANIZATION_UNIT"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
  });

  it("el item queda marcado, para que soporte lo encuentre", async () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    render(<CoreNavigation />);
    await waitFor(() =>
      expect(document.querySelectorAll('[data-unverified="true"]').length).toBeGreaterThan(0),
    );
  });

  it("el title dice la frase de producto, no el codigo crudo", async () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
    const item = document.querySelector('[data-unverified="true"]');
    expect(item?.getAttribute("title")).toBe(ACCESS_UNVERIFIED_MESSAGE);
  });

  it("y el title NUNCA dice que no este en el plan", async () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
    for (const item of document.querySelectorAll('[data-unverified="true"]')) {
      expect(item.getAttribute("title") ?? "").not.toMatch(/\bplan\b|no incluido|upgrade/i);
    }
  });
});

describe("lo que no es verificacion fallida no se disfraza", () => {
  it("una denegacion por plan sigue diciendo Locked", async () => {
    batchMock.mockReturnValue(batchDenegado("UPGRADE_REQUIRED"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Locked").length).toBeGreaterThan(0));
    expect(screen.queryByText("Sin verificar")).toBeNull();
  });

  it("el limite alcanzado conserva su propio badge", async () => {
    batchMock.mockReturnValue(batchDenegado("LIMIT_REACHED"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Limit Hit").length).toBeGreaterThan(0));
    expect(screen.queryByText("Sin verificar")).toBeNull();
  });
});

describe("ningun estado salvo allowed=true lleva enlace", () => {
  it("con verificacion fallida no hay ningun enlace", async () => {
    batchMock.mockReturnValue(batchDenegado("no_organization_unit"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("con denegacion por plan tampoco", async () => {
    batchMock.mockReturnValue(batchDenegado("UPGRADE_REQUIRED"));
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.getAllByText("Locked").length).toBeGreaterThan(0));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("concedido si lleva enlace: la regla no rompe la navegacion legitima", async () => {
    batchMock.mockReturnValue(batchConcedido());
    render(<CoreNavigation />);
    await waitFor(() => expect(screen.queryAllByRole("link").length).toBeGreaterThan(0));
    expect(screen.queryByText("Sin verificar")).toBeNull();
    expect(screen.queryByText("Locked")).toBeNull();
  });
});
