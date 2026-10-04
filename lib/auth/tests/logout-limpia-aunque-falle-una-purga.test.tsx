/**
 * D1 (diagnose, vuelta 2) · si una purga previa lanza, el binding del dealer
 * y los tokens se borran igual.
 *
 * e2e/mapaal/D1.spec.ts vio, tras /logout -> /login, nadakki_dealer_id y
 * nadakki_organization_unit_id todavia en localStorage. `logout` hacia las
 * purgas en serie: si `purgeAllWizardDrafts` (o el import dinamico) lanzaba, no
 * llegaba a `clearTokens` ni a `clearLocalStorage`, y la pagina de logout
 * redirigia a /login con el comentario "tokens are cleared locally regardless".
 *
 * @jest-environment jsdom
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";

jest.mock("@/lib/config/backend-url", () => ({
  resolveBackendUrl: () => "https://backend.test",
}));

jest.mock("@/lib/credit-hub/dealer/wizard-draft-storage", () => ({
  ...jest.requireActual("@/lib/credit-hub/dealer/wizard-draft-storage"),
  purgeAllWizardDrafts: () => {
    throw new Error("purga rota");
  },
}));

import { AuthContext, AuthProvider } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";

function Salir() {
  const ctx = useContext(AuthContext);
  return <button onClick={() => void ctx?.logout().catch(() => {})}>salir</button>;
}

test("logout con una purga que lanza: binding y tokens desaparecen", async () => {
  localStorage.clear();
  global.fetch = jest.fn(async () => ({
    ok: false, status: 401, statusText: "Unauthorized", text: async () => "", json: async () => ({}),
  })) as unknown as typeof fetch;
  render(
    <AuthProvider>
      <Salir />
    </AuthProvider>,
  );
  // El arranque con refresh fallido ya limpia: se siembra DESPUES, o el test no aisla.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  tokenStorage.setTokens({ accessToken: "a", refreshToken: "r" });
  localStorage.setItem("nadakki_dealer_id", "dealer-1");
  localStorage.setItem("nadakki_organization_unit_id", "unidad-1");
  screen.getByText("salir").click();

  await waitFor(() => {
    expect(localStorage.getItem("nadakki_dealer_id")).toBeNull();
    expect(localStorage.getItem("nadakki_organization_unit_id")).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
