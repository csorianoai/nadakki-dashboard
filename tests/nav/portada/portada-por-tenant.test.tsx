/**
 * B2-PORTADA-POR-TENANT (Cowork, prod 16-nov-2026, tenant Baylara = marketing + real_estate + sites):
 *  - la portada nombra solo los módulos del tenant (sin «riesgo crediticio», «SIC» ni «crédito» si no tiene crédito);
 *  - ni system/info ni agents/summary se piden para un usuario de tenant;
 *  - el registro de agentes es solo del platform_superadmin;
 *  - el título neutro es «Nadakki AI Suite» y la marca propia del tenant sigue ganando.
 */
import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";
import { NEUTRAL_PLATFORM_TITLE, resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";

type Rol = { role_key: string; core_name: string; display_name: string };
let auth: { allRoles: Rol[]; tenant: { subscribed_cores: string[] } | null; isLoading: boolean; isAuthenticated: boolean };
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));

const rol = (role_key: string, core_name: string): Rol => ({ role_key, core_name, display_name: role_key });
const fetchMock = jest.fn();
const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

const BAYLARA = ["marketing", "real_estate", "sites"];

describe("portada por tenant", () => {
  test("tenant marketing+real_estate+sites: sin texto de crédito y sin llamadas de plataforma", async () => {
    auth = { allRoles: [rol("tenant_admin", "marketing")], tenant: { subscribed_cores: BAYLARA }, isLoading: false, isAuthenticated: true };
    const { container } = render(<HomePage />);
    await waitFor(() => expect(urls().some((u) => u.endsWith("/health"))).toBe(true));
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/riesgo crediticio/i);
    expect(texto).not.toMatch(/\bSIC\b/);
    expect(texto).not.toMatch(/cr[eé]dit/i);
    expect(texto).toMatch(/Marketing/);
    expect(urls().some((u) => u.includes("system/info"))).toBe(false);
    expect(urls().some((u) => u.includes("agents/summary"))).toBe(false);
    expect(texto).not.toMatch(/Agent Registry/);
  });

  test("tenant con core de crédito: su texto de crédito sigue", () => {
    auth = { allRoles: [rol("tenant_admin", "credit")], tenant: { subscribed_cores: ["credit", "sic"] }, isLoading: false, isAuthenticated: true };
    const { container } = render(<HomePage />);
    expect(container.textContent).toMatch(/riesgo crediticio/i);
    expect(container.textContent).toMatch(/SIC/);
    expect(urls().some((u) => u.includes("agents/summary"))).toBe(false);
  });

  test("platform_superadmin: se consulta el registro de agentes", async () => {
    auth = { allRoles: [rol("platform_superadmin", "platform")], tenant: { subscribed_cores: [] }, isLoading: false, isAuthenticated: true };
    render(<HomePage />);
    await waitFor(() => expect(urls().some((u) => u.includes("agents/summary"))).toBe(true));
  });
});

describe("título neutro", () => {
  test("es «Nadakki AI Suite» y la marca del tenant gana", () => {
    expect(NEUTRAL_PLATFORM_TITLE).toBe("Nadakki AI Suite");
    expect(resolveVisiblePlatformTitle(null, null)).toBe("Nadakki AI Suite");
    expect(resolveVisiblePlatformTitle({ display_name: "Baylara" }, null)).toBe("Baylara");
  });
  test("la metadata de la app usa el título neutro", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require("fs").readFileSync(require("path").join(process.cwd(), "app/layout.tsx"), "utf8") as string;
    expect(src).toMatch(/title:\s*"Nadakki AI Suite"/);
  });
});
