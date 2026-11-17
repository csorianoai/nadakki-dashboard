import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import { miDiaEs } from "@/lib/realtor/mi-dia/copy";

/**
 * ROP-UX-HORA-TENANT: Mi día y Smart Calendar usan la zona del tenant (deducida del perfil), no la del
 * navegador ni Santo Domingo fijo. El navegador de las pruebas corre en UTC o en Madrid: el resultado no cambia.
 */

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const PROFILE_PATH = "/api/v1/realestate/alta/tenant/profile";
const perfil = (jurisdiction_code: string) => ({
  ok: true, status: 200,
  json: async () => ({ owner_person_id: "6f1c2a9e-4b7d-4e2a-9c1f-3d5e7a9b1c20", jurisdiction_code, default_language: "es", kind: "agent" }),
});
const okSec = (items: unknown[]) => ({ quality: "OK", count: items.length, items });
type Perfil = string | number;
let miDia: unknown = null;
let events: unknown[] = [];
const route = (p: Perfil) =>
  mockApiFetch.mockImplementation(async (url: string) => {
    const u = String(url);
    if (u === "/api/v1/realestate/acceso") return { status: 200, json: async () => ({ demo: false }) };
    if (u === PROFILE_PATH) return typeof p === "number" ? { ok: false, status: p, json: async () => ({}) } : perfil(p);
    if (u === "/api/v1/realestate/mi-dia") return miDia ? { status: 200, json: async () => miDia } : { status: 404, json: async () => ({}) };
    if (u.includes("/calendar/events")) return { status: 200, json: async () => ({ items: events, next_cursor: null }) };
    return { status: 404, json: async () => ({}) };
  });
const profileCalls = () => mockApiFetch.mock.calls.filter(([u]) => u === PROFILE_PATH);

// Navegador en otra zona: Jest aísla process.env (cambiar TZ aquí no mueve la del proceso). Se simula la zona que el
// navegador informa; los getters locales se cubren corriendo este archivo con TZ=Europe/Madrid y TZ=Asia/Tokyo.
const RESOLVED = Intl.DateTimeFormat.prototype.resolvedOptions;
const navegador = (tz: string) => jest.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
  .mockImplementation(function (this: Intl.DateTimeFormat) { return { ...RESOLVED.call(this), timeZone: tz }; });

beforeEach(() => {
  mockApiFetch.mockReset();
  miDia = null;
  events = [];
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  window.history.pushState({}, "", "/realtor");
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

const at = (iso: string) => {
  jest.useFakeTimers({ doNotFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask", "nextTick", "setImmediate"] });
  jest.setSystemTime(new Date(iso));
};
const settle = async () => {
  await waitFor(() => expect(profileCalls().length).toBe(1));
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};
const heading = () => screen.getByRole("heading", { level: 1 });

describe("Mi día · negativos: sin perfil → zona del navegador", () => {
  it.each([404, 503])("perfil %i con navegador en Madrid: 12:30Z son 13:30 en Madrid → «Buenas tardes» (Santo Domingo diría «Buenos días»)", async (status) => {
    navegador("Europe/Madrid");
    at("2026-01-15T12:30:00Z");
    route(status);
    render(<MiDiaPanel />);
    await settle();
    expect(heading()).toHaveTextContent(miDiaEs.greetingAfternoon);
    expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("jueves, 15 de enero de 2026");
  });

  it("jurisdicción desconocida con navegador en UTC: 23:30Z → «Buenas noches» de UTC, fecha del 15", async () => {
    navegador("UTC");
    at("2026-01-15T23:30:00Z");
    route("US-TX");
    render(<MiDiaPanel />);
    await settle();
    expect(heading()).toHaveTextContent(miDiaEs.greetingEvening);
    expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("jueves, 15 de enero de 2026");
  });

  it("acceso denegado: no se pide el perfil", async () => {
    mockApiFetch.mockResolvedValue({ status: 403 });
    render(<MiDiaPanel />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(profileCalls()).toHaveLength(0);
  });
});

describe("Mi día · tenant US-FL (America/New_York)", () => {
  it.each(["UTC", "Europe/Madrid"])("verano, navegador %s: 2026-07-15T12:30Z son 08:30 EDT → «Buenos días», 15 de julio", async (tz) => {
    navegador(tz);
    at("2026-07-15T12:30:00Z");
    route("US-FL");
    render(<MiDiaPanel />);
    await settle();
    expect(heading()).toHaveTextContent(miDiaEs.greetingMorning);
    expect(screen.getByTestId("mi-dia-date")).toHaveTextContent("miércoles, 15 de julio de 2026");
  });

  it.each([
    ["2026-01-15T12:30:00Z", miDiaEs.greetingMorning, "jueves, 15 de enero de 2026"],   // 07:30 EST
    ["2026-01-15T23:30:00Z", miDiaEs.greetingAfternoon, "jueves, 15 de enero de 2026"], // 18:30 EST (19:30 en Santo Domingo sería noche)
    ["2026-01-16T03:30:00Z", miDiaEs.greetingEvening, "jueves, 15 de enero de 2026"],   // 22:30 EST, todavía jueves 15
  ])("invierno %s → %s", async (iso, saludo, fecha) => {
    navegador("Europe/Madrid");
    at(iso);
    route("US-FL");
    render(<MiDiaPanel />);
    await settle();
    expect(heading()).toHaveTextContent(saludo);
    expect(screen.getByTestId("mi-dia-date")).toHaveTextContent(fecha);
  });

  it("la hora de las visitas de hoy va en la zona del tenant (EN también)", async () => {
    navegador("UTC");
    at("2026-07-15T12:30:00Z");
    miDia = {
      generated_at: "2026-07-15T12:30:00Z", scope: "agent",
      leads_sin_primera_respuesta: okSec([]), listings_con_requisitos_bloqueantes: okSec([]), broker_desk_pendientes: okSec([]),
      visitas_del_dia: okSec([{ event_id: "7d4e0c1a-2b3f-4a5d-8e6f-9a0b1c2d3e4f", title: "Visita · 1450 Brickell Ave #2207", starts_at: "2026-07-15T18:00:00Z", property_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }]),
    };
    route("US-FL");
    render(<MiDiaPanel />);
    await settle();
    const sec = await screen.findByTestId("mi-dia-visitas");
    await waitFor(() => expect(within(sec).getAllByTestId("mi-dia-row")[0]).toHaveTextContent(/^2:00\s?p\.\s?m\./)); // 18:00Z = 14:00 EDT (es-DO, 12 h, sin cero delante: I18N)
    act(() => { screen.getByTestId("lang-en").click(); });
    expect(within(screen.getByTestId("mi-dia-visitas")).getAllByTestId("mi-dia-row")[0]).toHaveTextContent(/^2:00\sPM/);
  });
});

describe("Smart Calendar · «hoy» y «ahora» en la zona del tenant", () => {
  // Cada evento sigue en su propia zona: este es a las 10:00 de Miami.
  const ev = (starts_at: string, ends_at: string) => ({
    id: "3c9a1e2b-7d4f-4b6a-9e0c-1f2a3b4c5d6e", kind: "showing", status: "scheduled", timezone: "America/New_York", all_day: false,
    title: "Visita · 1450 Brickell Ave #2207, Miami", starts_at, ends_at,
  });
  const todayCol = () => screen.getAllByTestId("day-col").find((c) => c.getAttribute("aria-current") === "date");

  it("negativo: perfil 404 con navegador en Madrid → «ahora» de Madrid", async () => {
    navegador("Europe/Madrid");
    events = [ev("2026-07-15T14:00:00Z", "2026-07-15T14:45:00Z")];
    route(404);
    render(<SmartCalendarPanel now={new Date("2026-07-15T12:30:00Z")} />);
    await settle();
    expect(await screen.findByTestId("now-line")).toHaveTextContent("Ahora 14:30");
  });

  it.each(["UTC", "Europe/Madrid"])("verano, navegador %s: la línea de ahora dice 08:30 y hoy es el miércoles 15; el evento sigue a las 10:00", async (tz) => {
    navegador(tz);
    events = [ev("2026-07-15T14:00:00Z", "2026-07-15T14:45:00Z")];
    route("US-FL");
    render(<SmartCalendarPanel now={new Date("2026-07-15T12:30:00Z")} />);
    await settle();
    await waitFor(() => expect(screen.getByTestId("now-line")).toHaveTextContent("Ahora 08:30"));
    expect(within(todayCol()!).getByRole("heading", { level: 2 })).toHaveTextContent("Mié 15");
    expect(screen.getByTestId("week-range")).toHaveTextContent("13–19 jul 2026");
    expect(within(todayCol()!).getByTestId("cal-event")).toHaveTextContent("10:00");
  });

  it("cambio de día, navegador en UTC: 2026-01-16T03:30Z → hoy es el jueves 15 y la línea dice 22:30", async () => {
    navegador("UTC");
    events = [ev("2026-01-15T15:00:00Z", "2026-01-15T15:45:00Z")];
    route("US-FL");
    render(<SmartCalendarPanel now={new Date("2026-01-16T03:30:00Z")} />);
    await settle();
    await waitFor(() => expect(screen.getByTestId("now-line")).toHaveTextContent("Ahora 22:30"));
    expect(within(todayCol()!).getByRole("heading", { level: 2 })).toHaveTextContent("Jue 15");
    expect(screen.getAllByTestId("today-badge")).toHaveLength(1);
  });

  it("domingo por la noche en Miami (lunes en UTC): la semana actual sigue siendo la del domingo", async () => {
    navegador("UTC");
    events = [ev("2026-01-18T15:00:00Z", "2026-01-18T15:45:00Z")];
    route("US-FL");
    render(<SmartCalendarPanel now={new Date("2026-01-19T03:30:00Z")} />);
    await settle();
    await waitFor(() => expect(screen.getByTestId("week-range")).toHaveTextContent("12–18 ene 2026"));
    expect(within(todayCol()!).getByRole("heading", { level: 2 })).toHaveTextContent("Dom 18");
  });
});
