/**
 * Auditoria Mapaal QA (P1): "Cerrar sesión" con un solo clic.
 *
 * Si el backend no responde (arranque en frio), `logout` igual resuelve y deja
 * la sesion local limpia; la revocacion ya salio con los tokens capturados.
 * Antes esperaba la respuesta y el boton se quedaba gris sin navegar.
 *
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";

jest.mock("@/lib/config/backend-url", () => ({
  resolveBackendUrl: () => "https://backend.test",
}));

import { AuthContext, AuthProvider } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";

let resolvio = false;

function Salir() {
  const ctx = useContext(AuthContext);
  return (
    <>
      <span data-testid="autenticado">{String(ctx?.isAuthenticated)}</span>
      <button onClick={() => void ctx?.logout().then(() => {
            resolvio = true;
          })}>
        salir
      </button>
    </>
  );
}

test("con el logout del backend colgado, la sesion local se cierra igual y logout resuelve", async () => {
  localStorage.clear();
  const colgado = new Promise<never>(() => {});
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/v2/auth/logout")) return colgado;
    return { ok: false, status: 401, statusText: "Unauthorized", text: async () => "", json: async () => ({}) };
  }) as unknown as typeof fetch;

  render(
    <AuthProvider>
      <Salir />
    </AuthProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  tokenStorage.setTokens({ accessToken: "a", refreshToken: "r" });
  localStorage.setItem("nadakki_dealer_id", "dealer-1");

  screen.getByText("salir").click();

  await waitFor(() => {
    expect(resolvio).toBe(true);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(localStorage.getItem("nadakki_dealer_id")).toBeNull();
    expect(screen.getByTestId("autenticado")).toHaveTextContent("false");
  });
  const revocacion = (global.fetch as jest.Mock).mock.calls.find(([u]) => String(u).includes("/api/v2/auth/logout"));
  expect(revocacion?.[1]?.headers).toMatchObject({ Authorization: "Bearer a" });
});
