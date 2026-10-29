import { render, screen, waitFor } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { RealtorNavEntry } from "@/components/realtor/RealtorNavEntry";
import { ACCESS_PATH } from "@/lib/realtor/config";
import { fetchPanelAccessInfo } from "@/lib/realtor/access";
import { tokenStorage } from "@/lib/auth/token-storage";

/**
 * RENDIMIENTO-CARGA (auditoría Cowork B1, staging 7dcc6c6): /acceso salía de 3 a 7 veces por carga, una por cada
 * componente que pregunta (menú, armazón, panel...). Con sesión, una carga pide /acceso UNA vez; cambia el token o
 * pasa la vigencia y se vuelve a preguntar; un error no se guarda; sin token no se comparte nada.
 */
jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const llamadasAcceso = () => mockApiFetch.mock.calls.filter(([p]) => p === ACCESS_PATH).length;
const ok = { status: 200, json: async () => ({ ok: true, roles: ["agent"], demo: false }) };
let token = 0;

beforeEach(() => {
  jest.useRealTimers();
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(async (p: string) => (p === ACCESS_PATH ? ok : { status: 404, json: async () => ({}) }));
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  token += 1; // un token nuevo por prueba: ninguna hereda la caché de otra
  tokenStorage.setTokens({ accessToken: `a.b.${token}`, refreshToken: "r" });
});
afterAll(() => tokenStorage.clearTokens());

it("una carga de /realtor/mi-dia (menú + armazón + panel) pide /acceso una sola vez", async () => {
  render(<><RealtorNavEntry /><RealtorShell><MiDiaPanel /></RealtorShell></>);
  await screen.findByTestId("mi-dia-panel");
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  expect(llamadasAcceso()).toBe(1);
});

it("llamadas simultáneas comparten la misma petición y el mismo resultado", async () => {
  const [a, b, c] = await Promise.all([fetchPanelAccessInfo(), fetchPanelAccessInfo(), fetchPanelAccessInfo()]);
  expect(llamadasAcceso()).toBe(1);
  expect(a).toEqual({ status: "ok", roles: ["agent"], demo: false });
  expect(b).toEqual(a);
  expect(c).toEqual(a);
});

it("token nuevo (refresh o cambio de usuario): se vuelve a preguntar", async () => {
  await fetchPanelAccessInfo();
  tokenStorage.setTokens({ accessToken: `otro.${token}`, refreshToken: "r" });
  await fetchPanelAccessInfo();
  expect(llamadasAcceso()).toBe(2);
});

it("pasada la vigencia (10 s) se vuelve a preguntar; antes, no", async () => {
  jest.useFakeTimers({ now: new Date("2026-10-28T12:00:00Z") });
  await fetchPanelAccessInfo();
  jest.setSystemTime(new Date("2026-10-28T12:00:09Z"));
  await fetchPanelAccessInfo();
  expect(llamadasAcceso()).toBe(1);
  jest.setSystemTime(new Date("2026-10-28T12:00:11Z"));
  await fetchPanelAccessInfo();
  expect(llamadasAcceso()).toBe(2);
});

it("negativo: un error de red no se guarda; la siguiente llamada pregunta otra vez", async () => {
  mockApiFetch.mockRejectedValueOnce(new Error("red"));
  expect((await fetchPanelAccessInfo()).status).toBe("error");
  expect((await fetchPanelAccessInfo()).status).toBe("ok");
  expect(llamadasAcceso()).toBe(2);
});

it("negativo: un 5xx no se guarda", async () => {
  mockApiFetch.mockResolvedValueOnce({ status: 503, json: async () => ({}) });
  expect((await fetchPanelAccessInfo()).status).toBe("error");
  expect((await fetchPanelAccessInfo()).status).toBe("ok");
});

it("negativo: sin token no se comparte nada (cada llamada pregunta)", async () => {
  tokenStorage.clearTokens();
  await fetchPanelAccessInfo();
  await fetchPanelAccessInfo();
  expect(llamadasAcceso()).toBe(2);
});

it("fail-closed intacto: un 403 compartido sigue siendo sin-acceso para todos", async () => {
  mockApiFetch.mockImplementation(async () => ({ status: 403, json: async () => ({ demo: true }) }));
  const [a, b] = await Promise.all([fetchPanelAccessInfo(), fetchPanelAccessInfo()]);
  expect(a).toEqual({ status: "sin-acceso", roles: [], demo: false });
  expect(b).toEqual(a);
  expect(llamadasAcceso()).toBe(1);
});

// César (29-oct): la caché tiene que vaciarse al cerrar sesión y no servir nada tras cambiar de tenant, de rol o de
// usuario. Cada caso reproduce lo que hace lib/auth/auth-context.tsx: logout → tokenStorage.clearTokens() (:433);
// switchTenant (:457), fijarContexto (:476), switchRole (:494), refresh y login → tokenStorage.setTokens(token nuevo).
describe("la caché de /acceso sigue a la sesión", () => {
  const respuesta = (roles: string[], status = 200) => ({ status, json: async () => ({ ok: true, roles, demo: false }) });

  it("cerrar sesión la vacía: aunque vuelva el mismo token, se pregunta de nuevo", async () => {
    const mismo = tokenStorage.getAccessToken()!;
    await fetchPanelAccessInfo();
    tokenStorage.clearTokens();                       // logout (auth-context.tsx:433)
    await fetchPanelAccessInfo();                     // cualquier pantalla tras el logout
    tokenStorage.setTokens({ accessToken: mismo, refreshToken: "r" });
    await fetchPanelAccessInfo();
    expect(llamadasAcceso()).toBe(3);
  });

  it("cambiar de tenant (switchTenant/fijarContexto ponen un token nuevo): no se sirve el acceso del tenant anterior", async () => {
    mockApiFetch.mockResolvedValueOnce(respuesta(["broker_supervisor"]));
    expect((await fetchPanelAccessInfo()).roles).toEqual(["broker_supervisor"]);
    tokenStorage.setTokens({ accessToken: `tenant-b.${token}`, refreshToken: "r" });
    mockApiFetch.mockResolvedValueOnce({ status: 403, json: async () => ({}) });
    expect(await fetchPanelAccessInfo()).toEqual({ status: "sin-acceso", roles: [], demo: false });
  });

  it("cambiar de rol (switchRole pone un token nuevo): se leen los roles nuevos", async () => {
    mockApiFetch.mockResolvedValueOnce(respuesta(["agent"]));
    expect((await fetchPanelAccessInfo()).roles).toEqual(["agent"]);
    tokenStorage.setTokens({ accessToken: `rol-broker.${token}`, refreshToken: "r" });
    mockApiFetch.mockResolvedValueOnce(respuesta(["broker_supervisor"]));
    expect((await fetchPanelAccessInfo()).roles).toEqual(["broker_supervisor"]);
  });

  it("cambiar de usuario (logout + login de otro): el segundo no ve los roles del primero", async () => {
    mockApiFetch.mockResolvedValueOnce(respuesta(["broker_supervisor"]));
    await fetchPanelAccessInfo();
    tokenStorage.clearTokens();
    tokenStorage.setTokens({ accessToken: `otro-usuario.${token}`, refreshToken: "r" });
    mockApiFetch.mockResolvedValueOnce(respuesta(["agent"]));
    expect((await fetchPanelAccessInfo()).roles).toEqual(["agent"]);
  });

  it("límite documentado: si el backend revoca el acceso con el MISMO token, la interfaz tarda como mucho la vigencia en verlo", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-29T12:00:00Z") });
    mockApiFetch.mockResolvedValueOnce(respuesta(["broker_supervisor"]));
    expect((await fetchPanelAccessInfo()).status).toBe("ok");
    mockApiFetch.mockResolvedValue({ status: 403, json: async () => ({}) });   // revocado en el backend
    jest.setSystemTime(new Date("2026-10-29T12:00:09Z"));
    expect((await fetchPanelAccessInfo()).status).toBe("ok");                // aún dentro de la ventana
    jest.setSystemTime(new Date("2026-10-29T12:00:11Z"));
    expect((await fetchPanelAccessInfo()).status).toBe("sin-acceso");        // pasada la ventana
  });
});
