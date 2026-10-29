/**
 * ROP-UX-F3-FIX (auditoría de Cowork sobre staging, 2026-10-28): en /realtor los paneles de la barra común (Ctrl K, selector de
 * tenant y menú de usuario) se abrían con texto #F4F4F5 sobre el contenido claro de Realtor, y Esc no cerraba tenant ni usuario.
 * Causa medida: esos paneles pintan con tokens `--forge-*` (bg-forgeSurface-card, text-forgeGray-800) que solo existen dentro
 * de `.forge-app`, y la barra común no está dentro de `.forge-app` en NINGÚN módulo: el panel queda transparente y el texto
 * hereda el zinc-100 de BarraSuite. En Marketing se leía por casualidad (detrás hay fondo oscuro); en Realtor no.
 *
 * Estas pruebas miden CONTRASTE, no existencia: resuelven el valor de cada token en el punto donde se pinta el panel, exigen un
 * fondo propio opaco y ≥4.5:1 para cada texto contra ese fondo. Los componentes son los reales (sin simular TenantSwitcher,
 * UserMenu ni CommandPalette).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ModuleTopBar } from "@/components/shell/ModuleTopBar";
import { BuscadorNavegacion, EVENTO_ABRIR_BUSCADOR } from "@/components/nav/BuscadorNavegacion";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS } from "@/lib/modulos/registro";

// cmdk (CommandPalette) observa su lista; jsdom no trae ResizeObserver.
global.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia", useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));

const AGENTE = {
  user: { id: "u1", email: "cesar@nadakki.com" },
  tenant: { id: "t1", display_name: "Soriano Realty", subscribed_cores: ["real_estate"] },
  activeRole: { core_name: "real_estate", role_key: "agent", display_name: "Agente" },
  allRoles: [{ core_name: "real_estate", role_key: "agent", display_name: "Agente" }],
  logout: jest.fn(),
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;
const con = (ui: React.ReactNode) => <AuthContext.Provider value={AGENTE}>{ui}</AuthContext.Provider>;
const barra = () => con(<ModuleTopBar modulos={MODULOS} actual="real-estate" conSesion esSuperadmin={false} />);

/** Valor de un token CSS en el punto `el`: el `style` en línea más cercano que lo defina (como resuelve el navegador). */
function token(el: Element, nombre: string): string | null {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const v = (e as HTMLElement).style?.getPropertyValue(nombre)?.trim();
    if (v) return v;
  }
  return null;
}
function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`no es un color opaco #rrggbb: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function contraste(a: string, b: string): number {
  const l = (h: string) => {
    const [r, g, bl] = rgb(h).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [l(a), l(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Texto (gris 800, 500 y 400, y la marca 700 del elemento elegido) contra los dos fondos del panel (tarjeta y hundido). */
function exigirPanelLegible(panel: Element) {
  const card = token(panel, "--forge-surface-card");
  const sunken = token(panel, "--forge-surface-sunken");
  expect({ card, sunken }).toEqual({ card: expect.stringMatching(/^#[0-9a-f]{6}$/i), sunken: expect.stringMatching(/^#[0-9a-f]{6}$/i) });
  for (const t of ["--forge-gray-800", "--forge-gray-500", "--forge-gray-400", "--forge-brand-700"]) {
    const c = token(panel, t);
    expect([t, c]).toEqual([t, expect.stringMatching(/^#[0-9a-f]{6}$/i)]);
    for (const f of [card!, sunken!]) expect([t, f, contraste(c!, f) >= 4.5]).toEqual([t, f, true]);
  }
}

describe("negativos: sin sesión no hay paneles", () => {
  it("la barra sin sesión no pinta acciones", () => {
    render(<ModuleTopBar modulos={MODULOS} actual="real-estate" conSesion={false} esSuperadmin={false} />);
    expect(screen.queryByTestId("barra-acciones")).toBeNull();
  });
});

describe("contraste de los paneles de la barra común", () => {
  it("selector de tenant: fondo propio opaco y texto ≥4.5:1", () => {
    render(barra());
    fireEvent.click(screen.getByRole("button", { name: /Tenant:/ }));
    exigirPanelLegible(screen.getByText("Tenant activo"));
  });

  it("menú de usuario: fondo propio opaco, texto ≥4.5:1 y las iniciales legibles sobre la marca", () => {
    render(barra());
    fireEvent.click(screen.getByRole("button", { name: "User menu" }));
    const panel = screen.getAllByText("cesar@nadakki.com").at(-1)!;
    exigirPanelLegible(panel);
    const ini = screen.getByText("CE");
    expect(contraste(token(ini, "--forge-gray-50")!, token(ini, "--forge-brand-600")!)).toBeGreaterThanOrEqual(4.5);
  });

  it("el botón del tenant en la barra (fondo zinc-950) sigue legible", () => {
    render(barra());
    const b = screen.getByRole("button", { name: /Tenant:/ });
    for (const t of ["--forge-gray-800", "--forge-gray-500"]) expect(contraste(token(b, t)!, "#09090b")).toBeGreaterThanOrEqual(4.5);
  });

  it("Ctrl K: el diálogo tiene fondo propio opaco y texto ≥4.5:1", () => {
    render(con(<BuscadorNavegacion />));
    act(() => {
      window.dispatchEvent(new Event(EVENTO_ABRIR_BUSCADOR));
    });
    exigirPanelLegible(screen.getByRole("dialog"));
  });
});

describe("Esc cierra los paneles de tenant y usuario y devuelve el foco", () => {
  it.each([
    ["tenant", /Tenant:/, "Tenant activo"],
    ["usuario", "User menu", "Cerrar sesion"],
  ] as const)("%s", (_n, nombre, dentro) => {
    render(barra());
    const boton = screen.getByRole("button", { name: nombre });
    boton.focus();
    fireEvent.click(boton);
    expect(screen.getAllByText(dentro).length).toBeGreaterThan(0);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByText(dentro)).toBeNull();
    expect(document.activeElement).toBe(boton);
  });

  it("Esc sin panel abierto no mueve el foco", () => {
    render(barra());
    const buscar = screen.getByTestId("barra-buscar");
    buscar.focus();
    fireEvent.keyDown(buscar, { key: "Escape" });
    expect(document.activeElement).toBe(buscar);
  });
});
