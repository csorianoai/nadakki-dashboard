/**
 * PS-2-SELECTOR-TENANT (parte 2/2): SelectorContexto del superadmin en la barra de la Suite.
 * (a) pinta las empresas de la API; (b) elegir llama a fijarContexto(tenant, vista) y el tenant pasa a ser el
 * elegido; (c) tras recargar el selector muestra la empresa que devuelve /refresh; (d) sin platform_superadmin no existe.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { SelectorContexto } from "@/components/shell/SelectorContexto";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const EMPRESAS = [
  { id: "t-1", display_name: "Empresa Uno" },
  { id: "t-2", display_name: "Empresa Dos" },
];
const SUPER_ROL = [{ core_name: "x", role_key: "platform_superadmin", display_name: "s" }];
const fetchMock = jest.fn();

function Arnes({ rol = SUPER_ROL, inicial = "t-0" }: { rol?: typeof SUPER_ROL; inicial?: string }) {
  const [tenant, setTenant] = useState({ id: inicial, display_name: inicial === "t-0" ? "Plataforma" : "Empresa Dos" });
  const valor = {
    tenant,
    allRoles: rol,
    fijarContexto: async (id: string, vista: string) => {
      const r = await fetch("/api/v2/auth/contexto", { method: "POST", body: JSON.stringify({ tenant_id: id, vista }) });
      if (!r.ok) return { ok: false, error: "x" };
      setTenant({ id, display_name: EMPRESAS.find((e) => e.id === id)!.display_name });
      return { ok: true };
    },
  } as unknown as AuthContextValue;
  return <AuthContext.Provider value={valor}><SelectorContexto /></AuthContext.Provider>;
}

beforeEach(() => {
  window.localStorage.clear();
  refresh.mockClear();
  fetchMock.mockReset().mockImplementation(async (url: string) => ({ ok: true, json: async () => EMPRESAS, url }));
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(tokenStorage, "getAccessToken").mockReturnValue("tok-prueba");
});

describe("SelectorContexto", () => {
  test("(a) platform_superadmin: pinta el selector con las empresas de la API", async () => {
    render(<Arnes />);
    expect(screen.getByTestId("contexto-empresa")).toHaveTextContent("Plataforma");
    fireEvent.click(screen.getByRole("button", { name: /Plataforma/ }));
    const lista = await screen.findByRole("list", { name: "Empresas" });
    await waitFor(() => expect(within(lista).getAllByRole("button").map((b) => b.textContent)).toEqual(["Empresa Uno", "Empresa Dos"]));
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v2/auth/contexto/empresas");
  });

  test("(b) elegir una empresa hace POST /contexto con {tenant_id, vista} y el tenant pasa a ser el elegido", async () => {
    render(<Arnes />);
    fireEvent.click(screen.getByRole("button", { name: /Plataforma/ }));
    await screen.findByText("Empresa Dos");
    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "concesionario" } });
    fireEvent.click(screen.getByText("Empresa Dos"));
    await waitFor(() => expect(screen.getByTestId("contexto-empresa")).toHaveTextContent("Empresa Dos"));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/v2/auth/contexto");
    expect(JSON.parse(post[1].body)).toEqual({ tenant_id: "t-2", vista: "concesionario" });
    expect(refresh).toHaveBeenCalled();
    expect(window.localStorage.getItem("nadakki:contexto-vista")).toBe("concesionario");
  });

  test("(c) tras recargar, la sesión de /refresh trae la empresa elegida y el selector la muestra", () => {
    render(<Arnes inicial="t-2" />);
    expect(screen.getByTestId("contexto-empresa")).toHaveTextContent("Empresa Dos");
  });

  test("(d) sin platform_superadmin no se ve el selector", () => {
    render(<Arnes rol={[{ core_name: "x", role_key: "tenant_admin", display_name: "a" }]} />);
    expect(screen.queryByTestId("selector-contexto")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
