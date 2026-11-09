import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/vista-previa",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import Page from "@/app/mi-web/vista-previa/page";
import { resp, SITE_A, siteOk, TENANT } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const MEDIA_OK = "00000000-0000-4000-8000-0000000000c1";
const MEDIA_PEND = "00000000-0000-4000-8000-0000000000c2";
const base = { tenant_id: TENANT, vertical: "realestate", site_id: SITE_A };
const pagina = {
  ...base, id: "p1", page_key: "inicio", status: "draft", title: { es: "Inicio <b>x</b>", en: "Home" },
  body: [
    { block_id: "h", type: "hero", i18n: { headline: { es: "Bienvenida", en: "Welcome" }, sub: { es: "Solo español" } }, data: { media_id: MEDIA_OK, media: [MEDIA_PEND] } },
    { block_id: "l", type: "legal_broker", data: { license: "SECRETO-123" }, i18n: { t: { es: "TEXTO LEGAL" } } },
  ],
};
const media = [
  { ...base, id: MEDIA_OK, alt: { es: "Fachada", en: "Facade" }, status: "approved", permission_type: "own", permission_date: "2026-01-01", acquired_on: "2026-01-01" },
  { ...base, id: MEDIA_PEND, alt: { es: "Pendiente", en: "Pending" }, status: "pending", permission_type: "own", permission_date: "2026-01-01", acquired_on: "2026-01-01" },
];
const listing = { ...base, id: "l1", slug: "casa", publish_state: "draft", title: { es: "Casa linda", en: "Nice house" }, description: { es: "Descripción" }, media: [MEDIA_OK, MEDIA_PEND] };

function route(over: Record<string, () => Response> = {}) {
  f.mockImplementation(async (url: string) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    const k = u.replace(/^.*\/sites\/[^/]+/, "");
    const h: Record<string, () => Response> = {
      "/pages": () => resp({ items: [pagina], next_cursor: null }),
      "/pages/p1": () => resp(pagina),
      "/listings": () => resp({ items: [listing], next_cursor: null }),
      "/media": () => resp({ items: media, next_cursor: null }),
      ...over,
    };
    if (!h[k]) throw new Error(`url inesperada ${k}`);
    return h[k]();
  });
}
const App = () => (<Layout><Page /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
beforeEach(() => { f.mockReset(); for (const k of ENV) delete process.env[k]; process.env.NEXT_PUBLIC_SITES_PANEL = "1"; });
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Vista previa", () => {
  test("positivo: borrador con aviso fijo, texto escapado, solo medios aprobados y legal como marcador", async () => {
    route();
    const { container } = render(<App />);
    expect((await screen.findByTestId("vp-titulo")).textContent).toBe("Inicio <b>x</b>");
    expect(container.querySelector("main b")).toBeNull();
    expect(screen.getByTestId("aviso-aproximada").textContent).toBe("Vista aproximada: la web publicada puede diferir");
    expect(screen.getByTestId("vp-legal").textContent).toBe("Lo agrega Nadakki");
    expect(container.textContent).not.toMatch(/SECRETO-123|TEXTO LEGAL/);
    const imgs = screen.getAllByTestId("vp-imagen").map((n) => n.textContent).join("|");
    expect(imgs).toContain("Fachada");
    expect(imgs).not.toContain("Pendiente");
    expect(screen.getByTestId("vp-propiedad").textContent).toContain("Casa linda");
    expect(container.innerHTML).not.toMatch(/dangerouslySetInnerHTML|<img/);
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("idioma EN con respaldo a ES marcado, y selector móvil/escritorio", async () => {
    route();
    render(<App />);
    await screen.findByTestId("vp-titulo");
    fireEvent.change(screen.getByLabelText("Idioma de la vista"), { target: { value: "en" } });
    await waitFor(() => expect(screen.getByTestId("vp-titulo").textContent).toBe("Home"));
    expect(screen.getByText("Solo español")).toBeTruthy();
    expect(screen.getAllByText("Spanish text: translation missing.").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Screen size"), { target: { value: "m" } });
    expect(screen.getByTestId("vp-marco").getAttribute("data-device")).toBe("mobile");
  });

  test("negativo: API caída sin DEMO = error sin datos ni mocks", async () => {
    f.mockRejectedValue(new Error("red"));
    const { container } = render(<App />);
    expect(await screen.findByTestId("estado-unavailable")).toBeTruthy();
    expect(screen.queryByTestId("vp-marco")).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(container.textContent).not.toMatch(/SYNTH/);
  });

  test("DEMO: muestra datos de ejemplo con badge y sin llamadas de contenido", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockRejectedValue(new Error("red"));
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    expect((await screen.findByTestId("vp-titulo")).textContent).toContain("SYNTH");
    expect(f.mock.calls.every((c) => String(c[0]).endsWith("/api/v1/sites/sites"))).toBe(true);
  });

  test("tenant ajeno: 404 NOT_FOUND = 'no encontrado' sin datos", async () => {
    route({ "/pages": () => problem(404, "NOT_FOUND"), "/listings": () => problem(404, "NOT_FOUND"), "/media": () => problem(404, "NOT_FOUND") });
    const { container } = render(<App />);
    expect((await screen.findByTestId("vp-no-encontrado")).textContent).toContain("Sitio no encontrado");
    expect(screen.queryByTestId("vp-marco")).toBeNull();
    expect(container.textContent).not.toMatch(/Inicio|Casa linda/);
  });

  test("tenant ajeno: 403 TENANT_MISMATCH = error, nunca dato", async () => {
    route({ "/pages": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    expect((await screen.findByTestId("vp-error")).textContent).toContain("no corresponde");
    expect(screen.queryByTestId("vp-marco")).toBeNull();
  });
});
