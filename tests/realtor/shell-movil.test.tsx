import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { BROKER_ROLE, visibleMenu } from "@/lib/realtor/menu";

/**
 * ROP-UX-NAV-MOVIL: por debajo de 768 px la barra de centros es un cajón (role=dialog) que abre el botón «Menú de centros».
 * A partir de 768 px todo sigue como hoy. jsdom no trae matchMedia: aquí se fuerza móvil o escritorio con un doble.
 */

let mockPath = "/realtor/demand-radar";
jest.mock("next/navigation", () => ({ usePathname: () => mockPath }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const realMatchMedia = window.matchMedia;
/** Doble de matchMedia: `movil` decide si «(max-width: 767.98px)» casa. */
function pantalla(movil: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true, writable: true,
    value: jest.fn((query: string) => ({
      matches: movil && /max-width/.test(query), media: query, onchange: null,
      addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), dispatchEvent: jest.fn(),
    })),
  });
}

const acceso = (roles: string[] = []) => ({ status: 200, json: async () => ({ ok: true, roles, demo: false }) });
const testidOf = (id: string) => (id === "career-director" ? "career-director" : `center-${id}`);
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

beforeEach(() => {
  mockPath = "/realtor/demand-radar";
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
afterEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: realMatchMedia });
});

async function abrir() {
  const boton = await screen.findByRole("button", { name: "Menú de centros" });
  fireEvent.click(boton);
  const cajon = await screen.findByRole("dialog", { name: "Menú de centros" });
  return { boton, cajon };
}

describe("negativos", () => {
  it("en escritorio no existe el botón del cajón y la barra fija sigue con sus testids", async () => {
    pantalla(false);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const side = await screen.findByTestId("shell-sidebar");
    expect(side).toHaveStyle({ width: "288px" });
    expect(within(side).getByTestId("smart-calendar")).toBeInTheDocument();
    for (const c of visibleMenu([]).flatMap((g) => g.items)) expect(within(side).getByTestId(testidOf(c.id))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Menú de centros" })).toBeNull();
    expect(screen.queryByTestId("shell-nav-toggle")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sin matchMedia (fallback) se comporta como escritorio", async () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: undefined });
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    expect(await screen.findByTestId("shell-sidebar")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-nav-toggle")).toBeNull();
  });

  it.each([403, 401, 500])("en móvil con %s no se pinta ni barra ni botón", async (status) => {
    pantalla(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-sidebar")).toBeNull();
    expect(screen.queryByTestId("shell-nav-toggle")).toBeNull();
    expect(screen.queryByRole("button", { name: "Menú de centros" })).toBeNull();
  });

  it("en móvil con el interruptor apagado no hay barra ni botón", () => {
    pantalla(true);
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "0";
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("shell-sidebar")).toBeNull();
    expect(screen.queryByTestId("shell-nav-toggle")).toBeNull();
  });

  it("en móvil el cajón cerrado no está en el árbol accesible y el contenido no deja el hueco de 288 px", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const boton = await screen.findByRole("button", { name: "Menú de centros" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    const panelId = boton.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("shell-sidebar")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Centros" })).toBeNull();
    expect(screen.queryByTestId("smart-calendar")).toBeNull();
    const shell = screen.getByTestId("realtor-shell");
    expect(shell.querySelector('[style*="288px"]')).toBeNull();
    const main = shell.querySelector("main#contenido") as HTMLElement;
    expect(main).toContainElement(screen.getByText("contenido"));
    expect((main.parentElement as HTMLElement).style.flex).toBe("1 1 auto");
  });
});

describe("positivos", () => {
  it("el botón abre el cajón con los mismos centros, sin la Bandeja del broker sin el rol", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso(["agent"]));
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { boton, cajon } = await abrir();
    expect(cajon).toHaveAttribute("aria-modal", "true");
    expect(cajon.id).toBe(boton.getAttribute("aria-controls"));
    expect(boton).toHaveAttribute("aria-expanded", "true");
    const side = within(cajon).getByTestId("shell-sidebar");
    expect(within(side).getAllByTestId("center-group").map((g) => g.textContent)).toEqual(visibleMenu([]).map((g) => g.label));
    for (const c of visibleMenu([]).flatMap((g) => g.items)) expect(within(side).getByTestId(testidOf(c.id))).toBeInTheDocument();
    expect(within(side).getByTestId("smart-calendar")).toBeInTheDocument();
    expect(within(side).queryByTestId("center-bandeja-broker")).toBeNull();
    expect(screen.getAllByTestId("shell-sidebar")).toHaveLength(1);
  });

  it("con broker_supervisor el cajón trae la Bandeja del broker, como la barra fija", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso([BROKER_ROLE]));
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { cajon } = await abrir();
    expect(within(cajon).getByTestId("center-bandeja-broker")).toBeInTheDocument();
  });

  it("al abrir, el foco va al primer elemento del cajón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { cajon } = await abrir();
    const primero = cajon.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    await waitFor(() => expect(document.activeElement).toBe(primero));
  });

  it("Escape cierra el cajón y devuelve el foco al botón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { boton, cajon } = await abrir();
    fireEvent.keyDown(cajon, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(boton);
  });

  it("un clic en el fondo cierra el cajón y devuelve el foco al botón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { boton } = await abrir();
    fireEvent.click(screen.getByTestId("shell-nav-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(boton);
  });

  it("un clic en un centro navega (enlace con su href) y cierra el cajón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { cajon } = await abrir();
    const destino = within(cajon).getByTestId("center-propietarios");
    expect(destino).toHaveAttribute("href", "/realtor/propietarios");
    fireEvent.click(destino);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("el cambio de pathname cierra el cajón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    const { rerender } = render(<RealtorShell><p>contenido</p></RealtorShell>);
    await abrir();
    mockPath = "/realtor/mi-dia";
    rerender(<RealtorShell><p>contenido</p></RealtorShell>);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Tab y Mayús+Tab no salen del cajón", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    render(<RealtorShell><p>contenido</p></RealtorShell>);
    const { cajon } = await abrir();
    const foc = Array.from(cajon.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(foc.length).toBeGreaterThan(2);
    const [primero, ultimo] = [foc[0], foc[foc.length - 1]];
    act(() => ultimo.focus());
    fireEvent.keyDown(ultimo, { key: "Tab" });
    expect(document.activeElement).toBe(primero);
    act(() => primero.focus());
    fireEvent.keyDown(primero, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(ultimo);
    expect(cajon).toContainElement(document.activeElement as HTMLElement);
  });

  it("botón de icono con borde RT.control, foco visible de 3 px RT.teal y rótulos ES/EN en el copy de la zona", async () => {
    pantalla(true);
    mockApiFetch.mockResolvedValue(acceso());
    const { container } = render(<RealtorShell><p>contenido</p></RealtorShell>);
    const boton = await screen.findByRole("button", { name: "Menú de centros" });
    expect(boton).toHaveStyle({ border: "1px solid #6B7B89" });
    expect(boton.textContent?.trim()).toBe("");
    expect(boton.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    const css = Array.from(container.querySelectorAll("style")).map((s) => s.textContent).join("");
    expect(css).toMatch(/:focus-visible\{outline:3px solid #0B6E78/);
    const copy = jest.requireActual<{ SHELL_NAV_COPY: Record<"es" | "en", { menu: string }> }>("@/lib/realtor/shell-nav-copy");
    expect(copy.SHELL_NAV_COPY.es.menu).toBe("Menú de centros");
    expect(copy.SHELL_NAV_COPY.en.menu).toBe("Centers menu");
  });
});
