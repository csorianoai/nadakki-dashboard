/**
 * Cableado del chrome del dealer: el LAYOUT lo monta de verdad.
 *
 * Se renderiza `app/autos/dealer/layout.tsx`, no `DealerShell` a pelo, porque
 * lo que este packet entrega es el cableado: un DealerShell correcto que nadie
 * monta no pinta nada. Si el layout vuelve a su menu propio, estos casos caen.
 *
 * Lo que se afirma:
 *  1. el layout pinta el sidebar y el topbar del shell, y el contenido hijo;
 *  2. ya NO queda el menu viejo "Dealer Management" del layout anterior;
 *  3. el disparador del topbar abre la paleta;
 *  4. al cerrar, el foco vuelve al disparador.
 *
 * El caso 4 es facil de escribir como un eco. La paleta mueve el foco dentro de
 * un `setTimeout(0)` (DealerCommandPalette.tsx:59), asi que sin adelantar los
 * timers el foco nunca sale del disparador y "vuelve al disparador" se cumple
 * sola, con o sin la funcion. Por eso aqui se SONDA el activeElement en los
 * tres momentos: en el disparador antes de abrir, DENTRO del dialogo con los
 * timers corridos, y de vuelta en el disparador al cerrar. El paso del medio es
 * el que convierte el assert en una medicion.
 *
 * `useAccessEntitlementsBatch` se mockea porque es red. Se devuelve un batch que
 * concede todo para que el menu tenga items; el filtrado por entitlements es
 * contrato del shell y ya lo fijan los tests de sidebar y paleta.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import DealerLayout from "@/app/autos/dealer/layout";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";

// Rompe la cadena de imports antes de `lib/config/backend-url`, que lanza
// BackendUrlNotConfiguredError al cargarse sin backend declarado. Mismo patron
// que tests/components/CoreNavigation.test.tsx:19.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

let pathname = "/autos/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

/** Batch que concede todas las claves del menu. */
function todoConcedido() {
  return {
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: {
      results: Object.fromEntries(
        DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: true }]),
      ),
    },
  };
}

const TENANT = "tenant-mapaal";
const DEALER = "1bc6a6cd-2592-442a-9d70-2d1b630762fc";

/**
 * El shell sincroniza el dealer de la sesion antes de pintar a sus hijos
 * (DealerShell.tsx), asi que aqui se SIEMBRA ese resultado en la cache de
 * react-query: estos casos miden el chrome --sidebar, topbar, paleta, foco--, y
 * la sincronizacion de verdad la mide
 * tests/components/dealer-management/shell/DealerShellContextSync.test.tsx
 * contra la red. Sembrarla deja el render sincrono, que es lo que necesitan los
 * casos con timers falsos.
 */
function pintarLayout(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], {
    estado: "sincronizado",
    assignment: { dealerId: DEALER, organizationUnitId: null, dealerName: "Mapaal Autos" },
  });
  return render(
    <QueryClientProvider client={client}>
      <DealerLayout>{children}</DealerLayout>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  pathname = "/autos/dealer";
  batchMock.mockReset();
  batchMock.mockReturnValue(todoConcedido());
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

describe("el layout del dealer monta el shell unico", () => {
  it("pinta sidebar, topbar y el contenido hijo", () => {
    pintarLayout(<p>contenido de la pagina</p>);

    expect(screen.getByRole("navigation", { name: "Navegación del dealer" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Ruta" })).toBeInTheDocument();
    expect(screen.getByText("contenido de la pagina")).toBeInTheDocument();
  });

  it("ya no queda el menu propio del layout viejo", () => {
    pintarLayout(<p>x</p>);

    // El layout anterior pintaba <nav aria-label="Dealer Management">. Si
    // reaparece, hay dos navegaciones del dealer en la misma pantalla.
    expect(screen.queryByRole("navigation", { name: "Dealer Management" })).toBeNull();
  });

  it("el shell pide al batch exactamente las claves del menu", () => {
    pintarLayout(<p>x</p>);

    expect(batchMock).toHaveBeenCalledWith(DEALER_NAV_CAPABILITY_KEYS);
  });

  it("el disparador del topbar abre la paleta y al cerrar devuelve el foco", () => {
    jest.useFakeTimers();
    try {
      pintarLayout(<p>x</p>);

      expect(screen.queryByRole("dialog")).toBeNull();

      const trigger = screen.getByRole("button", { name: "Buscar" });
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);
      act(() => {
        jest.runAllTimers();
      });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // SONDA: el foco tiene que haberse ido DENTRO del dialogo. Sin esto, el
      // assert final seria un eco del foco que puso `trigger.focus()`.
      const input = screen.getByRole("combobox");
      expect(document.activeElement).toBe(input);
      expect(document.activeElement).not.toBe(trigger);

      fireEvent.keyDown(dialog, { key: "Escape" });
      act(() => {
        jest.runAllTimers();
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      jest.useRealTimers();
    }
  });
});
