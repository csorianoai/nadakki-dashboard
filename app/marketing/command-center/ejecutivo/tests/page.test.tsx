/**
 * El flag es la regla dura "nunca datos simulados en produccion": con el flag apagado la ruta responde 404 y NO carga el modulo DEMO.
 */
import { render, screen } from "@testing-library/react";

// El formato sale de la configuracion del tenant (useTenantBranding); en estos tests no hay proveedores de la app.
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: (globalThis as { __BRANDING__?: unknown }).__BRANDING__ ?? null }),
}));

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const ENV0 = { ...process.env };
afterEach(() => {
  process.env = { ...ENV0 };
  delete (globalThis as { __BRANDING__?: unknown }).__BRANDING__;
});

function fijarEntorno(e: Record<string, string | undefined>) {
  process.env = { ...ENV0 };
  for (const k of ["VERCEL_ENV", "NEXT_PUBLIC_ANALYTICS_DEMO"]) delete process.env[k];
  for (const [k, v] of Object.entries(e)) if (v !== undefined) (process.env as Record<string, string>)[k] = v;
}

// Una sola copia de React: la pagina se importa una vez; el flag se evalua en cada llamada (como en cada peticion).
const PAGINA = require("../page").default as (p: { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) => Promise<React.ReactElement>;
async function cargarPagina() {
  return PAGINA;
}

describe("ruta /marketing/command-center/ejecutivo", () => {
  it("production + NEXT_PUBLIC_ANALYTICS_DEMO=1 => 404 y ningun dato DEMO", async () => {
    fijarEntorno({ VERCEL_ENV: "production", NEXT_PUBLIC_ANALYTICS_DEMO: "1" });
    // Modulo aislado: si la pagina cargara ./demo con el flag apagado, el mock lo registraria.
    const demoCargado = jest.fn();
    let PaginaAislada!: typeof PAGINA;
    jest.isolateModules(() => {
      jest.doMock("../demo/datos-demo", () => {
        demoCargado();
        return jest.requireActual("../demo/datos-demo");
      });
      PaginaAislada = require("../page").default;
    });
    await expect(PaginaAislada({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(demoCargado).not.toHaveBeenCalled();
    jest.dontMock("../demo/datos-demo");
  });

  it("sin variables (ni preview ni demo) => 404", async () => {
    fijarEntorno({});
    const Page = await cargarPagina();
    await expect(Page({})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("build de produccion fuera de Vercel con el flag demo => 404", async () => {
    fijarEntorno({ NEXT_PUBLIC_ANALYTICS_DEMO: "1" });
    (process.env as Record<string, string>).NODE_ENV = "production";
    const Page = await cargarPagina();
    await expect(Page({})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("vista previa de Vercel (VERCEL_ENV=preview) => renderiza la pantalla con el banner DEMO", async () => {
    fijarEntorno({ VERCEL_ENV: "preview" });
    const Page = await cargarPagina();
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("banner-demo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Executive Command Center");
    expect(screen.queryByTestId("aviso-desactualizado")).toBeNull();
  });

  it("local con NEXT_PUBLIC_ANALYTICS_DEMO=1 => renderiza", async () => {
    fijarEntorno({ NEXT_PUBLIC_ANALYTICS_DEMO: "1" });
    const Page = await cargarPagina();
    render(await Page({}));
    expect(screen.getByTestId("banner-demo")).toBeInTheDocument();
  });

  it("?estado=… solo se honra en demo", async () => {
    fijarEntorno({ VERCEL_ENV: "preview" });
    const Page = await cargarPagina();
    const { unmount } = render(await Page({ searchParams: Promise.resolve({ estado: "error" }) }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    unmount();
    render(await Page({ searchParams: Promise.resolve({ estado: "desactualizado" }) }));
    expect(screen.getByTestId("aviso-desactualizado")).toBeInTheDocument();

    fijarEntorno({ VERCEL_ENV: "production" });
    await expect(Page({ searchParams: Promise.resolve({ estado: "error" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("valores de estado desconocidos se ignoran (pantalla normal)", async () => {
    fijarEntorno({ VERCEL_ENV: "preview" });
    const Page = await cargarPagina();
    render(await Page({ searchParams: Promise.resolve({ estado: "<script>" }) }));
    expect(screen.getByRole("group", { name: "Inversión" })).toBeInTheDocument();
  });

  it("tema: oscuro por defecto (flujo de revision); ?tema=claro lo cambia; valores raros se ignoran", async () => {
    fijarEntorno({ VERCEL_ENV: "preview" });
    const Page = await cargarPagina();
    const { unmount } = render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "dark");
    unmount();
    const { unmount: u2 } = render(await Page({ searchParams: Promise.resolve({ tema: "claro" }) }));
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "light");
    u2();
    render(await Page({ searchParams: Promise.resolve({ tema: "<x>" }) }));
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "dark");
  });

  it("formato por tenant: el branding del tenant (locale/currency) formatea la pantalla; sin branding, es-US/USD", async () => {
    fijarEntorno({ VERCEL_ENV: "preview" });
    const Page = await cargarPagina();
    const { container, unmount } = render(await Page({ searchParams: Promise.resolve({}) }));
    expect(container.textContent).toContain("4,820");
    unmount();
    (globalThis as { __BRANDING__?: unknown }).__BRANDING__ = { locale: "es-AR", currency: "ARS" };
    const r = render(await Page({ searchParams: Promise.resolve({}) }));
    expect(r.container.textContent).toContain("4.820");
  });
});
