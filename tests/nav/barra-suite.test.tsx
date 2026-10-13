/**
 * Volver a la Suite desde cualquier core (César, 2026-10-13: al entrar en Credit Hub o Dealer OS no había
 * forma de volver al menú principal con un clic). Cada bloque intenta romper un criterio:
 *   (1) en todas las carcasas, el logotipo de arriba a la izquierda y el botón «Inicio» llevan a "/";
 *   (2) migas Inicio › Módulo › Sección › Pantalla, cada nivel con enlace, sacadas de los menús existentes;
 *   (3) Atrás y Adelante usan el historial del navegador; el guard de sesión no deja una entrada que redirige;
 *   (4) los cores con menú propio quedan bajo la barra (MarcoSuite), sin que su menú quede cortado.
 * La prueba en navegador (un clic al Inicio y Atrás vuelve) está en e2e/visual/volver-al-inicio.spec.ts.
 */
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { migasDe } from "@/lib/migas";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  __esModule: true,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  __esModule: true,
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="forge-shell">{children}</div>,
}));
jest.mock("@/components/dealer/ContableChrome", () => ({
  __esModule: true,
  ContableChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));

const ROOT = process.cwd();
const RUTAS_CORE = [
  "/", "/sic", "/credit-hub", "/credit-hub/bank", "/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes",
  "/credit-hub/dealer/applications", "/autos/dealer", "/autos/dealer/inventario", "/centro-operativo",
  "/realtor", "/realtor/clientes", "/cockpit", "/contable", "/credit/dashboard", "/marketing/campaigns",
];
const etiquetas = (r: string) => migasDe(r).map((m) => m.label);

describe("(1) logotipo e Inicio llevan a la Suite en todas las carcasas", () => {
  test.each(RUTAS_CORE)("%s", (r) => {
    pathname = r;
    render(<AppGate>contenido</AppGate>);
    const barra = screen.getByTestId("barra-suite");
    expect(within(barra).getByTestId("barra-suite-logo")).toHaveAttribute("href", "/");
    const inicio = within(barra).getByTestId("barra-suite-inicio");
    expect(inicio).toHaveAttribute("href", "/");
    expect(inicio).toHaveTextContent("Inicio");
    expect(inicio.querySelector("svg")).not.toBeNull();                 // icono de casa
    // la barra va antes que la carcasa: es lo de arriba a la izquierda
    expect(barra.compareDocumentPosition(screen.getByText("contenido")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("las pantallas sin sesión (login, consentimiento, portal público) no llevan la barra", () => {
    for (const r of ["/login", "/logout", "/consent/x", "/autos"]) {
      pathname = r;
      const { unmount } = render(<AppGate>x</AppGate>);
      expect(screen.queryByTestId("barra-suite")).toBeNull();
      unmount();
    }
  });
});

describe("(2) migas Inicio › Módulo › Sección › Pantalla", () => {
  test("cores con menú propio: del menú del core", () => {
    expect(etiquetas("/credit-hub/bank-v2/solicitudes")).toEqual(["Inicio", "Banco", "Operación", "Bandeja"]);
    expect(etiquetas("/credit-hub/bank-v2/kpis")).toEqual(["Inicio", "Banco", "Inteligencia", "KPIs de banco"]);
    expect(etiquetas("/credit-hub/bank-v2")).toEqual(["Inicio", "Banco"]);
    expect(etiquetas("/autos/dealer/finanzas")).toEqual(["Inicio", "Dealer OS", "Finanzas", "Finanzas por vehículo"]);
    expect(etiquetas("/autos/dealer")).toEqual(["Inicio", "Dealer OS"]);
    expect(etiquetas("/realtor/clientes")).toEqual(["Inicio", "Realtor OS", "Cartera", "Clientes"]);
  });

  test("detalle: la pantalla final es la propia ruta", () => {
    const m = migasDe("/credit-hub/bank-v2/solicitudes/0b1c2d3e-aaaa-bbbb-cccc-000000000001");
    expect(m.map((x) => x.label)).toEqual(["Inicio", "Banco", "Operación", "Bandeja", "Detalle"]);
    expect(m[m.length - 1].href).toBe("/credit-hub/bank-v2/solicitudes/0b1c2d3e-aaaa-bbbb-cccc-000000000001");
  });

  test("Suite: de lib/navigation.ts; Marketing por pestañas", () => {
    expect(etiquetas("/")).toEqual(["Inicio"]);
    expect(etiquetas("/marketing/campaigns")).toEqual(["Inicio", "Marketing", "Campañas"]);
    expect(etiquetas("/sic/bandeja")[0]).toBe("Inicio");
    expect(etiquetas("/sic/bandeja")).toContain("SIC: bandeja");
  });

  test("toda miga tiene enlace interno y empieza en Inicio", () => {
    for (const r of [...RUTAS_CORE, "/ruta/que/nadie/conoce"]) {
      const m = migasDe(r);
      expect(m[0]).toEqual({ label: "Inicio", href: "/" });
      expect(m.length).toBeLessThanOrEqual(5);
      for (const x of m) expect(x.href.startsWith("/")).toBe(true);
    }
  });

  test("la barra pinta cada miga como enlace", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    render(<BarraSuite />);
    const migas = within(screen.getByTestId("barra-suite-migas")).getAllByRole("link");
    expect(migas.map((a) => a.getAttribute("href"))).toEqual(["/", "/credit-hub/bank-v2", "/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes"]);
    expect(migas[migas.length - 1]).toHaveAttribute("aria-current", "page");
  });
});

describe("(3) Atrás y Adelante usan el historial del navegador", () => {
  test("cada botón llama a history.back / history.forward", () => {
    const back = jest.spyOn(window.history, "back").mockImplementation(() => undefined);
    const forward = jest.spyOn(window.history, "forward").mockImplementation(() => undefined);
    pathname = "/autos/dealer";
    render(<BarraSuite />);
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    fireEvent.click(screen.getByRole("button", { name: "Adelante" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledTimes(1);
  });

  test("el guard de sesión redirige con replace: Atrás no vuelve a una pantalla que redirige otra vez", () => {
    const src = fs.readFileSync(path.join(ROOT, "components/forge/auth/ProtectedRoute.tsx"), "utf8");
    expect(src).toContain("router.replace(fallbackPath)");
    expect(src).not.toMatch(/useEffect[\s\S]{0,400}router\.push\(fallbackPath\)/);
  });
});

describe("(4) los cores con menú propio quedan bajo la barra sin cortarse", () => {
  test("las carcasas medidas con 100vh usan el alto que deja la barra", () => {
    for (const f of ["components/realtor/shell/RealtorShell.tsx", "components/realtor/shell/ShellSidebar.tsx", "components/credit-hub/shell/ChAppShell.tsx"]) {
      expect(fs.readFileSync(path.join(ROOT, f), "utf8")).not.toMatch(/"100vh"/);
    }
    const css = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
    for (const sel of ["[data-marco-suite] .h-screen", "[data-marco-suite] .min-h-screen", "[data-marco-suite] .lg\\:h-screen"]) {
      expect(css).toContain(sel);
    }
  });
});
