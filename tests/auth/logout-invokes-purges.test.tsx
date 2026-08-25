/**
 * #13 · logout INVOCA las cuatro purgas. Detección por efecto, no por lectura.
 *
 * Por qué existe, medido y no supuesto:
 *
 *   tests/auth/logout-pii-cleanup.test.ts ejecuta `clearSessionStorage`, la
 *   función suelta. Prueba que la función funciona — no que `logout` la llame.
 *   Medido por mutación sobre lib/auth/auth-context.tsx: comentar CUALQUIERA de
 *   las cuatro llamadas dentro de `logout` no rompía ni un test de tests/auth.
 *   4 de 4 sin detección.
 *
 *   El reporte previo (AUD-CIERRE-2) nombraba tres purgas. Son CUATRO:
 *   `clearSessionStorage()` (auth-context.tsx:235) tampoco tenía detección.
 *
 * Cómo aísla cada una. Las cuatro tocan claves disjuntas, así que un efecto
 * distinto por purga basta y no hacen falta espías:
 *
 *   purgeAllWizardDrafts()      claves con prefijo nadakki_dealer_wizard_v1
 *   tokenStorage.clearTokens()  nadakki_refresh_token_v2
 *   clearLocalStorage()         las seis de LS_KEYS
 *   clearSessionStorage()       sessionStorage
 *
 * Si mañana una purga absorbe el territorio de otra —por ejemplo un
 * localStorage.clear()— este test dejaría de aislar. Esa es su condición de
 * validez y por eso queda escrita.
 *
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext, AuthProvider, LS_KEYS } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";

const WIZARD_DRAFT_KEY = "nadakki_dealer_wizard_v1:t1:u1";
const REFRESH_TOKEN_KEY = "nadakki_refresh_token_v2";
const SESSION_PII_KEY = "nadakki_credit_tenant123_app456";

function BotonDeSalida() {
  const ctx = useContext(AuthContext);
  return (
    <button onClick={() => void ctx?.logout()}>salir</button>
  );
}

/**
 * El arranque del AuthProvider decide el destino de accessTokenMemory ANTES de
 * que logout exista, y por dos ramas opuestas de auth-context.tsx:
 *
 *   refresh OK     -> setTokens (:151)      la memoria queda POBLADA
 *   refresh falla  -> clearTokens (:174)    la memoria queda VACIA
 *
 * Con un fetch que devolvia {} la rama que corria era siempre la segunda, asi
 * que comentar la purga de logout (:233) no cambiaba nada: para cuando corria,
 * ya no habia token. Por eso hacen falta los DOS escenarios, y por eso son dos
 * mutaciones distintas y no una.
 */
function mockRefreshOK() {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v2/auth/refresh")) {
      return {
        ok: true, status: 200,
        json: async () => ({ access_token: "access-del-refresh", refresh_token: "refresh-nuevo" }),
      };
    }
    if (url.includes("/api/v2/auth/me")) {
      return {
        ok: true, status: 200,
        json: async () => ({
          user: { id: "u1", email: "qa@qa.test" },
          current_tenant: { id: "t1", name: "QA" },
          active_roles: [],
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  }) as unknown as typeof fetch;
}

function mockRefreshFalla() {
  global.fetch = jest.fn(async () => ({
    ok: false, status: 401, statusText: "Unauthorized",
    text: async () => "invalid_refresh",
    json: async () => ({}),
  })) as unknown as typeof fetch;
}

function sembrarLosCuatroTerritorios() {
  // 1 · borrador del wizard: cédula, nombre, ingreso — PII del expediente
  localStorage.setItem(
    WIZARD_DRAFT_KEY,
    JSON.stringify({ cedula: "402-1234567-8", nombre_completo: "Juan Pérez" })
  );
  // 2 · el access token EN MEMORIA + el refresh en localStorage.
  //
  // El access token en memoria es lo unico que solo clearTokens() toca
  // (token-storage.ts:17 lo pone a null, y nadie mas escribe esa variable).
  // La primera version de este test afirmaba sobre el refresh token en
  // localStorage y NO aislaba: comentar clearTokens() pasaba igual, porque
  // clearLocalStorage() ya barre ese territorio. Solapamiento medido, no
  // supuesto.
  tokenStorage.setTokens({
    accessToken: "access-token-de-prueba",
    refreshToken: "refresh-token-de-prueba",
  });
  // 3 · las claves de sesión de LS_KEYS
  localStorage.setItem(LS_KEYS.auth, "true");
  localStorage.setItem(LS_KEYS.tenantId, "tenant-1");
  // 4 · PII en sessionStorage
  sessionStorage.setItem(
    SESSION_PII_KEY,
    JSON.stringify({ applicant_name: "Juan Pérez", cedula: "402-1234567-8" })
  );
}

async function ejecutarLogout() {
  render(
    <AuthProvider>
      <BotonDeSalida />
    </AuthProvider>
  );
  screen.getByText("salir").click();
}

describe("#13 · logout invoca las cuatro purgas (Ley 172-13)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    tokenStorage.clearTokens(); // la memoria no la limpia localStorage.clear()
    // Por defecto, refresh FALLIDO. Con refresh OK el arranque llama a
    // syncLocalStorage (:164) y REESCRIBE las claves de LS_KEYS despues de que
    // logout las borro: los tres tests de storage fallaban por esa carrera, no
    // por el producto. Cada test que necesite sesion restaurada lo declara.
    mockRefreshFalla();
  });

  test("purgeAllWizardDrafts: el borrador del wizard no sobrevive", async () => {
    sembrarLosCuatroTerritorios();
    await ejecutarLogout();
    await waitFor(() => {
      expect(localStorage.getItem(WIZARD_DRAFT_KEY)).toBeNull();
    });
  });

  test("clearTokens de logout (:233): con refresh OK, logout anula la memoria", async () => {
    mockRefreshOK();
    sembrarLosCuatroTerritorios();
    render(
      <AuthProvider>
        <BotonDeSalida />
      </AuthProvider>
    );
    // control: el arranque restauro sesion, asi que hay token que anular.
    // Sin esto, el test pasaria con un logout roto y un arranque que limpia.
    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBe("access-del-refresh");
    });
    screen.getByText("salir").click();
    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBeNull();
    });
  });

  test("clearTokens del arranque (:174): con refresh fallido, la memoria queda vacia sin logout", async () => {
    mockRefreshFalla();
    sembrarLosCuatroTerritorios();
    expect(tokenStorage.getAccessToken()).not.toBeNull(); // sembrada
    render(
      <AuthProvider>
        <BotonDeSalida />
      </AuthProvider>
    );
    // NO se hace logout: lo que se prueba es que el arranque la anule.
    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBeNull();
    });
  });

  test("clearLocalStorage: las claves de LS_KEYS no sobreviven", async () => {
    sembrarLosCuatroTerritorios();
    await ejecutarLogout();
    await waitFor(() => {
      expect(localStorage.getItem(LS_KEYS.auth)).toBeNull();
      expect(localStorage.getItem(LS_KEYS.tenantId)).toBeNull();
    });
  });

  test("clearSessionStorage: la PII de sessionStorage no sobrevive", async () => {
    sembrarLosCuatroTerritorios();
    await ejecutarLogout();
    await waitFor(() => {
      expect(sessionStorage.getItem(SESSION_PII_KEY)).toBeNull();
    });
  });

  test("control positivo: sin logout, los cuatro territorios siguen poblados", () => {
    sembrarLosCuatroTerritorios();
    // Sin este control, los cuatro tests de arriba pasarían con un logout roto
    // que no hiciera nada, siempre que el sembrado tampoco funcionara.
    expect(localStorage.getItem(WIZARD_DRAFT_KEY)).not.toBeNull();
    expect(tokenStorage.getAccessToken()).not.toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).not.toBeNull();
    expect(localStorage.getItem(LS_KEYS.auth)).not.toBeNull();
    expect(sessionStorage.getItem(SESSION_PII_KEY)).not.toBeNull();
  });
});
