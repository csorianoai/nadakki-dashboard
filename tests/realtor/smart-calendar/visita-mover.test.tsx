import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import { followUpVisit, moveVisit } from "@/components/realtor/smart-calendar/visit-actions";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const V1 = "00000000-0000-4000-8000-00000000a001";
const C1 = "00000000-0000-4000-8000-00000000a002";
const TZ = "America/New_York";

type Row = Record<string, unknown>;
const showing = (over: Row = {}): Row => ({
  id: V1, kind: "showing", title: "Visita 4B", status: "scheduled", timezone: TZ, all_day: false,
  starts_at: "2026-11-02T15:00:00Z", ends_at: "2026-11-02T15:45:00Z", ...over,
});

/** Servidor simulado: GET lista el estado actual; PATCH y POST devuelven `reply` o aplican el cambio. */
let server: Row[];
const writes = () => mockApiFetch.mock.calls.filter(([, init]) => init?.method === "PATCH" || (init?.method === "POST"));
const serve = (reply?: { status: number; body?: unknown }) =>
  mockApiFetch.mockImplementation(async (url: string, init?: { method?: string; body?: string }) => {
    if (String(url).includes("/acceso")) return { status: 200, json: async () => ({ demo: false }) };
    if (init?.method === "PATCH" || init?.method === "POST") {
      if (reply) return { status: reply.status, json: async () => reply.body ?? {} };
      const b = JSON.parse(init.body ?? "{}");
      if (init.method === "PATCH") server = server.map((r) => ({ ...r, starts_at: b.starts_at, ends_at: b.ends_at }));
      else server = server.map((r) => ({ ...r, status: b.outcome }));
      return { status: 200, json: async () => server[0] };
    }
    return { status: 200, json: async () => ({ items: server, next_cursor: null }) };
  });

beforeEach(() => {
  mockApiFetch.mockReset();
  server = [showing(), { ...showing({ id: "cita-1", kind: "meeting", title: "Reunión" }) }];
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  window.history.pushState({}, "", "/realtor/smart-calendar");
});

const open = async () => {
  render(<SmartCalendarPanel />);
  const ev = (await screen.findAllByTestId("cal-event")).find((e) => e.getAttribute("data-kind") === "visita")!;
  return ev;
};
const move = async (ev: HTMLElement, start = "2026-11-03T10:00", end = "2026-11-03T10:45") => {
  const user = userEvent.setup();
  await user.click(within(ev).getByTestId("visit-move"));
  fireEvent.change(within(ev).getByLabelText("Nuevo inicio"), { target: { value: start } });
  fireEvent.change(within(ev).getByLabelText("Nuevo fin"), { target: { value: end } });
  await user.click(within(ev).getByTestId("visit-move-submit"));
  return user;
};

describe("negativos: 403, 404, 409, 422 visibles al mover", () => {
  it.each([[403, "denied"], [404, "notfound"], [422, "invalid"], [500, "error"]])("PATCH %i → mensaje %s y sin éxito", async (status, reason) => {
    serve({ status });
    const ev = await open();
    await move(ev);
    const err = await within(ev).findByTestId("visit-action-error");
    expect(err).toHaveAttribute("data-reason", reason);
    expect(within(ev).queryByTestId("visit-action-ok")).toBeNull();
  });

  it("409 solape: pide confirmar y solo reintenta con allow_overlap tras confirmar", async () => {
    serve({ status: 409 });
    const ev = await open();
    const user = await move(ev);
    expect(await within(ev).findByTestId("visit-action-conflict")).toBeInTheDocument();
    expect(JSON.parse(writes()[0][1].body).allow_overlap).toBeUndefined();
    serve();
    await user.click(within(ev).getByTestId("visit-action-confirm-overlap"));
    await waitFor(() => expect(writes()).toHaveLength(2));
    expect(JSON.parse(writes()[1][1].body).allow_overlap).toBe(true);
  });

  it("fin <= inicio no llega al backend", async () => {
    serve();
    const ev = await open();
    await move(ev, "2026-11-03T10:00", "2026-11-03T09:00");
    expect(await within(ev).findByTestId("visit-action-error")).toHaveAttribute("data-reason", "invalid");
    expect(writes()).toHaveLength(0);
  });
});

describe("negativos: seguimiento", () => {
  it.each([[403, "denied"], [404, "notfound"], [409, "conflict"], [422, "invalid"]])("POST followup %i → %s", async (status, reason) => {
    serve({ status });
    const ev = await open();
    await userEvent.setup().click(within(ev).getByTestId("followup-completed"));
    const err = await within(ev).findByTestId("visit-action-error");
    expect(err).toHaveAttribute("data-reason", reason);
    expect(screen.queryByTestId("visit-action-ok")).toBeNull();
  });

  it("solo las visitas abiertas tienen acciones: citas y visitas en estado final no", async () => {
    server = [showing({ status: "completed" }), showing({ id: "cita-1", kind: "meeting" })];
    serve();
    render(<SmartCalendarPanel />);
    await screen.findAllByTestId("cal-event");
    expect(screen.queryByTestId("visit-move")).toBeNull();
    expect(screen.queryByTestId("followup-completed")).toBeNull();
  });

  it("DEMO y acceso denegado: ninguna acción ni escritura", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    const { unmount } = render(<SmartCalendarPanel />);
    await screen.findByTestId("demo-banner");
    expect(screen.queryByTestId("visit-move")).toBeNull();
    unmount();
    mockApiFetch.mockResolvedValue({ status: 403 });
    render(<SmartCalendarPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("visit-move")).toBeNull();
    expect(writes()).toHaveLength(0);
  });
});

describe("cliente HTTP", () => {
  it("moveVisit: PATCH en la ruta del evento, instantes UTC, sin tenant; followUpVisit: POST con outcome", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({}) });
    expect(await moveVisit(V1, { startsAt: "2026-11-03T10:00", endsAt: "2026-11-03T10:45" })).toEqual({ ok: true });
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(`/api/v1/realestate/calendar/events/${V1}`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body).starts_at).toMatch(/Z$/);
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(await followUpVisit(V1, "no_show")).toEqual({ ok: true });
    expect(mockApiFetch.mock.calls[1][0]).toBe(`/api/v1/realestate/calendar/events/${V1}/followup`);
    expect(JSON.parse(mockApiFetch.mock.calls[1][1].body)).toEqual({ outcome: "no_show" });
    expect(await followUpVisit("no-uuid", "no_show")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("positivo: persiste tras recargar", () => {
  it("mover: PATCH 200, la lista se refresca y un montaje nuevo ve la hora nueva", async () => {
    serve();
    const ev = await open();
    expect(ev).toHaveTextContent("10:00");
    await move(ev, "2026-11-03T14:30", "2026-11-03T15:15");
    await screen.findByTestId("visit-action-ok");
    expect(JSON.parse(writes()[0][1].body)).toMatchObject({ starts_at: new Date("2026-11-03T14:30").toISOString() });
    expect(writes()[0][1].method).toBe("PATCH");
    expect(String(writes()[0][0])).toBe(`/api/v1/realestate/calendar/events/${V1}`);
    expect(server[0].starts_at).toBe(new Date("2026-11-03T14:30").toISOString());
  });

  it("seguimiento: tras registrar, la visita pasa a final y deja de ofrecer acciones, también al recargar", async () => {
    serve();
    const ev = await open();
    await userEvent.setup().click(within(ev).getByTestId("followup-completed"));
    await waitFor(() => expect(screen.queryByTestId("followup-completed")).toBeNull());
    expect(JSON.parse(writes()[0][1].body)).toEqual({ outcome: "completed" });
    expect(writes()[0][1].method).toBe("POST");
    expect(String(writes()[0][0])).toBe(`/api/v1/realestate/calendar/events/${V1}/followup`);
    render(<SmartCalendarPanel />);
    await waitFor(() => expect(screen.getAllByTestId("cal-event").length).toBeGreaterThan(0));
    expect(screen.queryByTestId("followup-completed")).toBeNull();
  });
});
