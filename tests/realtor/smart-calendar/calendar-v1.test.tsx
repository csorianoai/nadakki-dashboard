import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import { fetchCalendarEvents } from "@/lib/realtor/smart-calendar/api";

/**
 * ROP-UX-CALENDAR-V1 (F2): navegación de semana, hoy, tarjeta legible, menú «…», línea de ahora,
 * panel lateral «Programar visita», vacío único y responsive. Primero los negativos.
 */

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const TZ = "America/New_York";
// Martes 27 oct 2026, 11:00 hora local del navegador.
const NOW = new Date(2026, 9, 27, 11, 0);
const V1 = "00000000-0000-4000-8000-00000000b001";
const C1 = "00000000-0000-4000-8000-00000000b002";
const LONG = "Visita · 18555 Collins Ave #2104, Sunny Isles Beach · torre norte, vista al mar, acceso por la entrada de servicio";

type Row = Record<string, unknown>;
// Martes 27 oct en Nueva York (EDT, UTC-4).
const row = (over: Row = {}): Row => ({
  id: V1, tenant_id: "00000000-0000-4000-8000-0000000000a1", kind: "showing", status: "scheduled", timezone: TZ, all_day: false,
  title: "Visita · 18555 Collins Ave #2104, Sunny Isles", starts_at: "2026-10-27T13:00:00Z", ends_at: "2026-10-27T13:45:00Z",
  organizer_user_id: "00000000-0000-4000-8000-000000009001", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", ...over,
});
const WEEK: Row[] = [
  row(),
  row({ id: C1, kind: "signing", title: "Firma del encargo · Robert y Ana Klein", starts_at: "2026-10-27T19:00:00Z", ends_at: "2026-10-27T20:00:00Z" }),
];

let items: Row[];
const gets = () => mockApiFetch.mock.calls.filter(([u, init]) => String(u).includes("/calendar/events") && (init?.method ?? "GET") === "GET");
const writes = () => mockApiFetch.mock.calls.filter(([, init]) => init?.method === "PATCH" || init?.method === "POST");
const serve = (opts: { events?: number; write?: number } = {}) =>
  mockApiFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    if (String(url).includes("/acceso")) return { status: 200, json: async () => ({ demo: false }) };
    if (init?.method === "PATCH" || init?.method === "POST") return { status: opts.write ?? 200, json: async () => ({}) };
    if (opts.events && opts.events !== 200) return { status: opts.events, json: async () => ({}) };
    return { status: 200, json: async () => ({ items, next_cursor: null }) };
  });
const fromOf = (u: unknown) => new URL(String(u), "http://x").searchParams.get("from");

beforeEach(() => {
  mockApiFetch.mockReset();
  items = WEEK;
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  window.history.pushState({}, "", "/realtor/smart-calendar");
});

const mount = async () => {
  render(<SmartCalendarPanel now={NOW} />);
  await screen.findByTestId("smart-calendar-panel");
};

describe("negativos", () => {
  it.each([403, 401])("acceso %i: no pinta navegación, semana, botón ni pide eventos", async (status) => {
    mockApiFetch.mockResolvedValue({ status });
    render(<SmartCalendarPanel now={NOW} />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("smart-calendar-panel")).toBeNull();
    expect(screen.queryByTestId("week-nav")).toBeNull();
    expect(screen.queryByTestId("visit-open")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(gets()).toHaveLength(0);
  });

  it("apagado: ni navegación ni panel lateral ni llamadas", () => {
    delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
    render(<SmartCalendarPanel now={NOW} />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(screen.queryByTestId("week-nav")).toBeNull();
    expect(screen.queryByTestId("visit-open")).toBeNull();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it.each([[200, "lista vacía"], [503, "backend caído"]])("sin DEMO (%i, %s): no inventa eventos y hay UN solo vacío, sin columnas ni «Sin eventos» repetido", async (status) => {
    items = [];
    serve({ events: status });
    await mount();
    expect(await screen.findAllByTestId("smart-calendar-empty")).toHaveLength(1);
    expect(screen.queryByTestId("cal-event")).toBeNull();
    expect(screen.queryByTestId("day-col")).toBeNull();
    expect(screen.queryByTestId("now-line")).toBeNull();
    expect(screen.queryByText("Sin eventos")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("DEMO: sin botón «Programar visita», sin menú de acciones y sin escrituras", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<SmartCalendarPanel now={NOW} />);
    await screen.findByTestId("demo-banner");
    expect(screen.queryByTestId("visit-open")).toBeNull();
    expect(screen.queryByTestId("visit-menu")).toBeNull();
    expect(writes()).toHaveLength(0);
  });

  it("PATCH al mover desde el menú y POST de seguimiento: sin tenant y solo los campos del contrato", async () => {
    serve();
    await mount();
    const ev = (await screen.findAllByTestId("cal-event")).find((e) => e.getAttribute("data-kind") === "visita")!;
    const user = userEvent.setup();
    await user.click(within(ev).getByTestId("visit-menu"));
    await user.click(within(ev).getByTestId("visit-move"));
    fireEvent.change(within(ev).getByLabelText("Nuevo inicio"), { target: { value: "2026-10-28T10:00" } });
    fireEvent.change(within(ev).getByLabelText("Nuevo fin"), { target: { value: "2026-10-28T10:45" } });
    await user.click(within(ev).getByTestId("visit-move-submit"));
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(Object.keys(JSON.parse(writes()[0][1].body)).sort()).toEqual(["ends_at", "starts_at"]);
    const ev2 = (await screen.findAllByTestId("cal-event")).find((e) => e.getAttribute("data-kind") === "visita")!;
    await user.click(within(ev2).getByTestId("visit-menu"));
    await user.click(within(ev2).getByTestId("followup-confirmed"));
    await waitFor(() => expect(writes()).toHaveLength(2));
    expect(JSON.parse(writes()[1][1].body)).toEqual({ outcome: "confirmed" });
    for (const [url, init] of mockApiFetch.mock.calls) expect(`${url} ${JSON.stringify(init ?? {})}`).not.toMatch(/tenant/i);
  });
});

describe("1 · navegación de semana", () => {
  it("negativo: al cambiar de semana no se ven los eventos de la anterior mientras llega la respuesta (auditor2, #1094)", async () => {
    serve();
    await mount();
    expect(await screen.findAllByTestId("cal-event")).toHaveLength(2);
    // La semana siguiente tarda: su respuesta queda pendiente.
    let soltar: (v: unknown) => void = () => {};
    mockApiFetch.mockImplementation(async (url: string) => {
      if (String(url).includes("/acceso")) return { status: 200, json: async () => ({ demo: false }) };
      return new Promise((r) => { soltar = r; });
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "Semana siguiente" }));
    expect(screen.getByTestId("week-range")).toHaveTextContent("2–8 nov 2026");
    expect(screen.queryAllByTestId("cal-event")).toHaveLength(0);
    expect(screen.queryByTestId("smart-calendar-empty")).toBeNull();
    expect(screen.getByTestId("week-loading")).toHaveTextContent("Cargando la semana…");
    await act(async () => { soltar({ status: 200, json: async () => ({ items: [], next_cursor: null }) }); });
    expect(await screen.findByTestId("smart-calendar-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("week-loading")).toBeNull();
  });

  it("Anterior / Hoy / Siguiente cambian la semana pedida y el rango mostrado", async () => {
    serve();
    await mount();
    await waitFor(() => expect(gets().length).toBeGreaterThan(0));
    expect(gets().every(([u]) => fromOf(u) === new Date(2026, 9, 26).toISOString())).toBe(true);
    expect(screen.getByTestId("week-range")).toHaveTextContent("26 oct – 1 nov 2026");
    const user = userEvent.setup();

    mockApiFetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Semana siguiente" }));
    await waitFor(() => expect(gets().length).toBeGreaterThan(0));
    expect(gets().every(([u]) => fromOf(u) === new Date(2026, 10, 2).toISOString())).toBe(true);
    expect(screen.getByTestId("week-range")).toHaveTextContent("2–8 nov 2026");

    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    mockApiFetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    await waitFor(() => expect(gets().length).toBeGreaterThan(0));
    expect(gets().every(([u]) => fromOf(u) === new Date(2026, 9, 19).toISOString())).toBe(true);

    mockApiFetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Hoy" }));
    await waitFor(() => expect(gets().length).toBeGreaterThan(0));
    expect(gets().every(([u]) => fromOf(u) === new Date(2026, 9, 26).toISOString())).toBe(true);
    expect(screen.getByTestId("week-range")).toHaveTextContent("26 oct – 1 nov 2026");

    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByTestId("week-range")).toHaveTextContent("Oct 26 – Nov 1, 2026");
    expect(screen.getByRole("button", { name: "Next week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
  });

  it("fetchCalendarEvents pide la semana de la fecha dada (lunes a lunes), sin cambiar el contrato", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ items: [], next_cursor: null }) });
    await fetchCalendarEvents(new Date(2026, 10, 5));
    const q = new URL(String(mockApiFetch.mock.calls[0][0]), "http://x").searchParams;
    expect(q.get("from")).toBe(new Date(2026, 10, 2).toISOString());
    expect(q.get("to")).toBe(new Date(2026, 10, 9).toISOString());
    expect([...q.keys()].sort()).toEqual(["from", "limit", "to"]);
  });
});

describe("2 · fecha en cada día y hoy resaltado", () => {
  it("«Lun 26» … «Dom 1», solo hoy con aria-current=date y rótulo «Hoy»; otra semana sin hoy", async () => {
    serve();
    await mount();
    const cols = await screen.findAllByTestId("day-col");
    expect(cols).toHaveLength(7);
    expect(within(cols[0]).getByRole("heading")).toHaveTextContent("Lun 26");
    expect(within(cols[6]).getByRole("heading")).toHaveTextContent("Dom 1");
    const today = cols.filter((c) => c.getAttribute("aria-current") === "date");
    expect(today).toHaveLength(1);
    expect(today[0]).toBe(cols[1]);
    expect(within(cols[1]).getByTestId("today-badge")).toHaveTextContent("Hoy");
    await userEvent.setup().click(screen.getByRole("button", { name: "Semana siguiente" }));
    await waitFor(() => expect(screen.getByTestId("week-range")).toHaveTextContent("2–8 nov 2026"));
    expect(document.querySelector('[aria-current="date"]')).toBeNull();
    expect(screen.queryByTestId("today-badge")).toBeNull();
  });
});

describe("3 · tarjeta de evento", () => {
  it("hora inicio–fin (ends_at conservado), tipo con rótulo, título ≥14 px y meta 13 px; sin línea de propiedad ni contacto inventada", async () => {
    serve();
    await mount();
    const [visita, cita] = await screen.findAllByTestId("cal-event");
    expect(within(visita).getByTestId("cal-event-time")).toHaveTextContent("09:00–09:45");
    expect(within(visita).getByTestId("cal-event-kind")).toHaveTextContent("Visita");
    expect(within(cita).getByTestId("cal-event-time")).toHaveTextContent("15:00–16:00");
    expect(within(cita).getByTestId("cal-event-kind")).toHaveTextContent("Cita");
    expect(within(cita).getByTestId("cal-event-title")).toHaveTextContent("Firma del encargo · Robert y Ana Klein");
    expect(within(visita).getByTestId("cal-event-title")).toHaveStyle({ fontSize: "14px" });
    expect(within(visita).getByTestId("cal-event-time")).toHaveStyle({ fontSize: "13px" });
    // El contrato solo trae property_id/contact_id (uuid): no se muestran ni se inventan nombres.
    expect(screen.queryByTestId("cal-event-place")).toBeNull();
    expect(screen.getByTestId("smart-calendar-panel").textContent).not.toMatch(/00000000-/);
  });

  it("título largo: truncado a 2 líneas con el texto completo en title=", async () => {
    items = [row({ title: LONG })];
    serve();
    await mount();
    const title = within(await screen.findByTestId("cal-event")).getByTestId("cal-event-title");
    expect(title).toHaveAttribute("title", LONG);
    expect(title).toHaveClass("sc-clamp2");
    expect(document.querySelector("style[data-sc]")?.textContent).toMatch(/\.sc-clamp2\{[^}]*-webkit-line-clamp:2/);
  });
});

describe("4 · menú «…» de la visita", () => {
  it("botón de icono con aria-label, aria-haspopup=menu y aria-expanded; teclado, Escape y clic fuera", async () => {
    serve();
    await mount();
    const ev = (await screen.findAllByTestId("cal-event")).find((e) => e.getAttribute("data-kind") === "visita")!;
    const trigger = within(ev).getByTestId("visit-menu");
    expect(trigger).toHaveAttribute("aria-label", "Acciones de la visita");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Sin abrir, las acciones no ocupan la columna.
    expect(within(ev).queryByTestId("visit-move")).toBeNull();

    const user = userEvent.setup();
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = within(ev).getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Mover", "Confirmar", "Realizada", "No asistió"]);
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(items[3]).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(within(ev).queryByRole("menu")).toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(within(ev).getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("heading", { level: 1 }));
    expect(within(ev).queryByRole("menu")).toBeNull();

    await user.click(screen.getByTestId("lang-en"));
    expect(within(ev).getByTestId("visit-menu")).toHaveAttribute("aria-label", "Visit actions");
  });

  it("Mover abre su formulario en un panel lateral (diálogo), no dentro de la columna", async () => {
    serve();
    await mount();
    const ev = (await screen.findAllByTestId("cal-event")).find((e) => e.getAttribute("data-kind") === "visita")!;
    const user = userEvent.setup();
    await user.click(within(ev).getByTestId("visit-menu"));
    await user.click(within(ev).getByTestId("visit-move"));
    const dlg = screen.getByRole("dialog", { name: "Mover visita" });
    expect(dlg).toHaveAttribute("aria-modal", "true");
    expect(within(dlg).getByLabelText("Nuevo inicio")).toHaveFocus();
    expect(within(ev).queryByRole("menu")).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(ev).getByTestId("visit-menu")).toHaveFocus();
  });
});

describe("5 · línea de ahora", () => {
  it("solo en hoy, antes del primer evento posterior a la hora actual, aria-hidden y con «Ahora HH:MM»", async () => {
    serve();
    await mount();
    await screen.findAllByTestId("cal-event");
    const lines = screen.getAllByTestId("now-line");
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toHaveAttribute("aria-hidden", "true");
    expect(line).toHaveTextContent("Ahora 11:00");
    const today = screen.getAllByTestId("day-col")[1];
    expect(today).toContainElement(line);
    const order = Array.from(today.querySelectorAll('[data-testid="cal-event"], [data-testid="now-line"]')).map((n) => n.getAttribute("data-testid"));
    expect(order).toEqual(["cal-event", "now-line", "cal-event"]);
  });

  it("todos los eventos de hoy ya pasaron: la línea va al final", async () => {
    items = [row()];
    serve();
    await mount();
    await screen.findAllByTestId("cal-event");
    const today = screen.getAllByTestId("day-col")[1];
    const order = Array.from(today.querySelectorAll('[data-testid="cal-event"], [data-testid="now-line"]')).map((n) => n.getAttribute("data-testid"));
    expect(order).toEqual(["cal-event", "now-line"]);
  });
});

describe("6 · «Programar visita» en panel lateral", () => {
  it("botón primario en la cabecera abre un diálogo modal etiquetado, foco al primer campo, Escape cierra y devuelve el foco", async () => {
    serve();
    await mount();
    expect(screen.queryByTestId("visit-form")).toBeNull();
    const open = screen.getByTestId("visit-open");
    expect(open).toHaveTextContent("Programar visita");
    const user = userEvent.setup();
    await user.click(open);
    const dlg = screen.getByRole("dialog");
    expect(dlg).toHaveAttribute("aria-modal", "true");
    const labelledBy = dlg.getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelledBy)).toHaveTextContent("Programar visita");
    expect(within(dlg).getByTestId("visit-form")).toBeInTheDocument();
    expect(within(dlg).getByLabelText("Título")).toHaveFocus();
    for (const l of ["Título", "Inicio", "Fin", "Propiedad", "Contacto"]) expect(within(dlg).getByText(l)).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(open).toHaveFocus();
  });

  it("botón Cerrar con aria-label en ES/EN; Tab no sale del panel", async () => {
    serve();
    await mount();
    const user = userEvent.setup();
    await user.click(screen.getByTestId("lang-en"));
    await user.click(screen.getByTestId("visit-open"));
    const dlg = screen.getByRole("dialog", { name: "Schedule a showing" });
    const close = within(dlg).getByRole("button", { name: "Close" });
    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(dlg).toContainElement(document.activeElement as HTMLElement);
    }
    await user.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("con ?property_id y ?contact_id (viene de una ficha) el panel se abre ya rellenado", async () => {
    window.history.pushState({}, "", `/realtor/smart-calendar?property_id=${V1}&contact_id=${C1}`);
    serve();
    await mount();
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByLabelText("Propiedad")).toHaveValue(V1);
    expect(within(dlg).getByLabelText("Contacto")).toHaveValue(C1);
  });
});

describe("7 · vacío único con acción", () => {
  it("semana sin eventos: texto humano y «Programar visita» que abre el panel", async () => {
    items = [];
    serve();
    await mount();
    const empty = await screen.findByTestId("smart-calendar-empty");
    expect(empty).toHaveTextContent("Sin datos todavía");
    expect(empty).toHaveTextContent("Cuando agendes citas o visitas para esta semana aparecerán aquí.");
    const user = userEvent.setup();
    await user.click(within(empty).getByRole("button", { name: "Programar visita" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(within(empty).getByRole("button", { name: "Programar visita" })).toHaveFocus();
  });

  it("semana con eventos: los días libres muestran solo un guion, nunca «Sin eventos» repetido", async () => {
    serve();
    await mount();
    const cols = await screen.findAllByTestId("day-col");
    expect(screen.queryByText("Sin eventos")).toBeNull();
    expect(within(cols[0]).getByTestId("day-free")).toHaveTextContent("—");
    expect(within(cols[1]).queryByTestId("day-free")).toBeNull();
    expect(screen.getAllByTestId("day-free")).toHaveLength(6);
    expect(screen.queryByTestId("smart-calendar-empty")).toBeNull();
  });
});

describe("8 · responsive, foco y contraste", () => {
  it("hoja de estilo de la zona: columnas ≥146 px con scroll del contenedor, lista vertical a ≤480 px, foco de 3 px RT.teal y bordes ≥3:1", async () => {
    serve();
    await mount();
    await screen.findAllByTestId("cal-event");
    const css = document.querySelector("style[data-sc]")?.textContent ?? "";
    expect(screen.getByTestId("week-scroll")).toHaveClass("sc-scroll");
    expect(css).toMatch(/\.sc-scroll\{[^}]*overflow-x:auto/);
    expect(css).toMatch(/\.sc-grid\{[^}]*grid-template-columns:repeat\(7,minmax\(146px,1fr\)\)/);
    expect(css).toMatch(/@media \(max-width:480px\)\{[^@]*\.sc-grid\{[^}]*display:flex;flex-direction:column/);
    expect(css).toMatch(/:focus-visible\{outline:3px solid #0B6E78/i);
    // Borde de control: #7A8A98 (3,55:1 sobre blanco). RT.lineStrong (#B8C4CE, 1,78:1) no se usa en controles.
    for (const el of [screen.getByLabelText("Tipo"), screen.getByRole("button", { name: "Semana siguiente" }), screen.getByTestId("lang-en")]) {
      expect(el.style.border.toLowerCase()).not.toContain("rgb(184, 196, 206)");
    }
    expect(screen.getByLabelText("Tipo").style.border).toContain("rgb(122, 138, 152)");
  });

  it("la hora de ahora avanza sola cada minuto sin recargar", async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 27, 11, 0), doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] });
    try {
      serve();
      render(<SmartCalendarPanel />);
      await waitFor(() => expect(screen.getByTestId("now-line")).toHaveTextContent("Ahora 11:00"));
      await act(async () => { jest.advanceTimersByTime(61_000); });
      expect(screen.getByTestId("now-line")).toHaveTextContent("Ahora 11:01");
    } finally {
      jest.useRealTimers();
    }
  });
});
