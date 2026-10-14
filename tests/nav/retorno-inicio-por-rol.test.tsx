/**
 * Complemento de #825 (barra de la Suite): «Inicio» por rol y Atrás/Adelante sin historial ciego.
 *  - Inicio, logotipo y primera miga usan getPostLoginRedirectPath (la autoridad del login), sin mapa propio.
 *  - Todo rol del mapa de login tiene su destino; los roles SIN entrada explícita (bank_admin,
 *    compliance_officer) caen en "/" y nunca se quedan sin enlace. Sesión/roles sin confirmar: "/" también.
 *  - Atrás/Adelante: desactivados salvo que la Navigation API mida AMBOS booleanos (no se usa history.length).
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";

let auth: { isLoading: boolean; isAuthenticated: boolean; allRoles: { role_key: string; core_name: string; display_name: string }[] };
let sinProvider = false;
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => {
    if (sinProvider) throw new Error("useAuth must be used within AuthProvider"); // igual que hooks/useAuth.ts:9
    return auth;
  },
}));
jest.mock("next/navigation", () => ({ usePathname: () => "/credit-hub/bank-v2/solicitudes" }));

const roles = (...keys: string[]) => keys.map((role_key) => ({ role_key, core_name: "credit", display_name: role_key }));
const BANCO = "/credit-hub/bank-v2";

beforeEach(() => {
  auth = { isLoading: false, isAuthenticated: true, allRoles: [] };
  Object.defineProperty(globalThis, "navigation", { configurable: true, value: undefined });
});

const inicios = () => ({
  inicio: screen.getByTestId("barra-suite-inicio").getAttribute("href"),
  logo: screen.getByTestId("barra-suite-logo").getAttribute("href"),
  miga: within(screen.getByTestId("barra-suite-migas")).getByRole("link", { name: "Inicio" }).getAttribute("href"),
});

describe("Inicio por rol (cada rol del mapa de login)", () => {
  test.each([
    ["platform_superadmin", "/"], ["tenant_admin", "/"], ["admin", BANCO], ["sic_admin", "/sic"],
    ["legal_admin", "/legal-hub"], ["marketing_admin", "/marketing"], ["credit_admin", BANCO],
    ["dealer", "/autos/dealer"], ["bank_analyst", BANCO], ["banker", BANCO],
  ])("%s -> %s en Inicio, logotipo y primera miga", (rol, esperado) => {
    auth.allRoles = roles(rol);
    expect(getPostLoginRedirectPath(auth.allRoles)).toBe(esperado); // misma autoridad que el login
    render(<BarraSuite />);
    expect(inicios()).toEqual({ inicio: esperado, logo: esperado, miga: esperado });
  });

  test("la prioridad multirol es la del login", () => {
    auth.allRoles = roles("dealer", "platform_superadmin");
    render(<BarraSuite />);
    expect(inicios().inicio).toBe("/");
  });

  test.each(["bank_admin", "compliance_officer", "rol_desconocido"])(
    "%s (sin destino explícito en el login): Inicio cae en la portada segura \"/\", con enlace",
    (rol) => {
      auth.allRoles = roles(rol);
      render(<BarraSuite />);
      expect(inicios()).toEqual({ inicio: "/", logo: "/", miga: "/" });
    },
  );

  test.each([
    { isLoading: true, isAuthenticated: true, allRoles: roles("dealer") },
    { isLoading: false, isAuthenticated: false, allRoles: roles("dealer") },
    { isLoading: false, isAuthenticated: true, allRoles: [] },
  ])("sesión o roles sin confirmar: no se inventa un destino por rol y «Inicio con un clic» sigue vivo (\"/\"): %o", (estado) => {
    auth = estado;
    render(<BarraSuite />);
    expect(inicios()).toEqual({ inicio: "/", logo: "/", miga: "/" });
  });
});

describe("Atrás/Adelante sin historial ciego", () => {
  test("sin Navigation API ambos botones quedan desactivados (no se usa history.length)", () => {
    render(<BarraSuite />);
    expect(screen.getByRole("button", { name: "Atrás" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adelante" })).toBeDisabled();
  });

  test("Navigation API con una medición parcial no habilita nada", () => {
    Object.defineProperty(globalThis, "navigation", { configurable: true, value: { canGoBack: true } });
    render(<BarraSuite />);
    expect(screen.getByRole("button", { name: "Atrás" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adelante" })).toBeDisabled();
  });

  test("con ambos booleanos refleja el estado, reacciona a currententrychange y limpia el listener", () => {
    const nav = {
      canGoBack: true,
      canGoForward: false,
      addEventListener: jest.fn((_e: string, _f: () => void) => undefined),
      removeEventListener: jest.fn((_e: string, _f: () => void) => undefined),
    };
    Object.defineProperty(globalThis, "navigation", { configurable: true, value: nav });
    const { unmount } = render(<BarraSuite />);
    expect(screen.getByRole("button", { name: "Atrás" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Adelante" })).toBeDisabled();
    const back = jest.spyOn(window.history, "back").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(back).toHaveBeenCalledTimes(1);
    nav.canGoBack = false;
    nav.canGoForward = true;
    act(() => nav.addEventListener.mock.calls[0][1]());
    expect(screen.getByRole("button", { name: "Atrás" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adelante" })).toBeEnabled();
    const forward = jest.spyOn(window.history, "forward").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Adelante" }));
    expect(forward).toHaveBeenCalledTimes(1);
    unmount();
    expect(nav.removeEventListener).toHaveBeenCalledWith("currententrychange", nav.addEventListener.mock.calls[0][1]);
  });
});

describe("sin AuthProvider la barra no lanza (regresión de #848: realtor-app-gate, DealerUnMenu, layout-isolation)", () => {
  afterEach(() => { sinProvider = false; });
  test("useAuth lanza como en hooks/useAuth.ts: la barra se monta y Inicio, logotipo y miga van a /", () => {
    sinProvider = true;
    expect(() => render(<BarraSuite />)).not.toThrow();
    expect(screen.getByTestId("barra-suite")).toBeInTheDocument();
    expect(inicios()).toEqual({ inicio: "/", logo: "/", miga: "/" });
  });
});
