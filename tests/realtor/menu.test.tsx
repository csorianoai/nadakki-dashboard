import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";
import { fetchPanelAccessInfo, fetchPanelAccessStatus } from "@/lib/realtor/access";
import { BROKER_ROLE, OFF_MENU_ROUTES, REALTOR_MENU, visibleMenu } from "@/lib/realtor/menu";

jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia" }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

const ok = (roles?: unknown) => ({ status: 200, json: async () => ({ ok: true, roles }) });
const ids = (roles: string[]) => visibleMenu(roles).flatMap((g) => g.items.map((i) => i.id));

it("estructura aprobada: cuatro grupos, en orden, sin «Próximamente» ni Finanzas como fila", () => {
  expect(REALTOR_MENU.map((g) => g.label)).toEqual(["HOY", "CLIENTES", "NEGOCIOS", "CRECER"]);
  expect(REALTOR_MENU.map((g) => g.items.map((i) => i.label))).toEqual([
    ["Mi día", "Bandeja del broker"],
    ["Contactos", "Propietarios", "Conversaciones", "Propiedades"],
    ["Operaciones", "Documentos"],
    ["Marketing", "Mercado", "Inteligencia de propiedad", "Resultados", "Career Director", "Alta", "Agente web", "Academia"],
  ]);
  const all = REALTOR_MENU.flatMap((g) => g.items);
  expect(all.some((i) => /finanzas|crm|mi oficina/i.test(i.label))).toBe(false);
  expect(REALTOR_MENU.some((g) => /pr[oó]ximamente/i.test(g.label))).toBe(false);
  const byId = Object.fromEntries(all.map((i) => [i.id, i]));
  expect(byId["clientes"].href).toBe("/realtor/clientes");
  expect(byId["marketing-ai"].href).toBe("/realtor/marketing-ai");
  expect(byId["demand-radar"].href).toBe("/realtor/demand-radar");
  expect(byId["property-intel"].href).toBe("/realtor/property-intel");
  expect(byId["resultados"].href).toBe("/realtor/resultados");
  expect(byId["conversaciones"].href).toBeUndefined();
  expect(byId["career-director"].href).toBe("/realtor/career-director");
  // Decisión de César 2026-10-16 (auditoría de navegación de Cowork): sustituye a dashboard#835 que dejaba Propietarios fuera de la barra.
  expect(byId["propietarios"].href).toBe("/realtor/propietarios");
  expect(byId["alta"].href).toBe("/realtor/alta");
  expect(byId["agente-web"].href).toBe("/realtor/agente-web");
  expect(all.some((i) => ["propietarios", "alta", "agente-web"].includes(i.id) && /pronto/i.test(i.label))).toBe(false);
  expect(byId["academia"].href).toBeUndefined();
});

it("Propietarios, Alta y Agente web aparecen sin rol", () => {
  expect(ids([])).toEqual(expect.arrayContaining(["propietarios", "alta", "agente-web"]));
});

it("la Bandeja del broker solo aparece con el rol; otros roles no la dan", () => {
  expect(ids([BROKER_ROLE])).toContain("bandeja-broker");
  expect(ids([])).not.toContain("bandeja-broker");
  expect(ids(["agent", "broker"])).not.toContain("bandeja-broker");
});

it("todas las rutas actuales siguen resolviendo: cada page.tsx está en el menú o en la lista fuera de la barra", () => {
  const root = join(process.cwd(), "app/realtor");
  const routes: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walk(full, `${rel}/${f}`);
      else if (f === "page.tsx") routes.push(rel);
    }
  };
  walk(root, "/realtor");
  const known = new Set([
    ...REALTOR_MENU.flatMap((g) => g.items.map((i) => i.href)).filter(Boolean),
    ...OFF_MENU_ROUTES.map((r) => r.href),
  ]);
  for (const r of routes) expect(known.has(r)).toBe(true);
  for (const r of OFF_MENU_ROUTES) expect(r.reason.length).toBeGreaterThan(5);
  for (const must of ["/realtor", "/realtor/mi-dia", "/realtor/clientes", "/realtor/propietarios", "/realtor/propiedades", "/realtor/marketing-ai",
    "/realtor/demand-radar", "/realtor/operaciones", "/realtor/documentos", "/realtor/smart-calendar", "/realtor/career-director", "/realtor/alta",
    "/realtor/agente-web", "/realtor/resultados", "/realtor/property-intel"]) expect(routes).toContain(must);
});

it("acceso: expone los roles sin cambiar el estado; sin roles legibles, vacío", async () => {
  mockApiFetch.mockResolvedValue(ok([BROKER_ROLE, 7, null]));
  expect(await fetchPanelAccessInfo()).toEqual({ status: "ok", roles: [BROKER_ROLE], demo: false });
  mockApiFetch.mockResolvedValue({ status: 200 });
  expect(await fetchPanelAccessInfo()).toEqual({ status: "ok", roles: [], demo: false });
  mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ roles: "broker_supervisor" }) });
  expect((await fetchPanelAccessInfo()).roles).toEqual([]);
  mockApiFetch.mockResolvedValue({ status: 403, json: async () => ({ roles: [BROKER_ROLE] }) });
  expect(await fetchPanelAccessInfo()).toEqual({ status: "sin-acceso", roles: [], demo: false });
  expect(await fetchPanelAccessStatus()).toBe("sin-acceso");
});

it("positivo: con el rol, la barra muestra la Bandeja con enlace a /realtor/broker", async () => {
  mockApiFetch.mockResolvedValue(ok([BROKER_ROLE]));
  render(<RealtorShell><p>x</p></RealtorShell>);
  const el = await screen.findByTestId("center-bandeja-broker");
  expect(el).not.toHaveTextContent("Pronto");
  expect(el.getAttribute("href")).toBe("/realtor/broker");
});

it("negativo: sin rol no hay Bandeja; el selector simulado Broker no la concede", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ ok: true, roles: [], demo: true }) });
  render(<RealtorShell><p>x</p></RealtorShell>);
  await screen.findByTestId("shell-sidebar");
  screen.getByTestId("view-broker").click();
  await waitFor(() => expect(screen.getByTestId("view-broker")).toHaveAttribute("aria-pressed", "true"));
  expect(screen.queryByTestId("center-bandeja-broker")).toBeNull();
});

it("sin demo activo no existe el selector simulado ni la Bandeja", async () => {
  mockApiFetch.mockResolvedValue(ok([]));
  render(<RealtorShell><p>x</p></RealtorShell>);
  await screen.findByTestId("shell-sidebar");
  expect(screen.queryByTestId("view-broker")).toBeNull();
  expect(screen.queryByTestId("center-bandeja-broker")).toBeNull();
});

it("tenant ajeno: ninguna petición del armazón lleva tenant del cliente", async () => {
  mockApiFetch.mockResolvedValue(ok([BROKER_ROLE]));
  render(<RealtorShell><p>x</p></RealtorShell>);
  await screen.findByTestId("shell-sidebar");
  for (const [path, init] of mockApiFetch.mock.calls) {
    expect(path).toBe("/api/v1/realestate/acceso");
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(String(path)).not.toMatch(/tenant/i);
  }
});
