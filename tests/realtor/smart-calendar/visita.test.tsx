import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import { buildVisitBody, createVisit, VISIT_PATH } from "@/lib/realtor/smart-calendar/visit";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const P1 = "00000000-0000-4000-8000-00000000e001";
const C1 = "00000000-0000-4000-8000-00000000c001";
const FORM = { title: "Visita unidad 4B", startsAt: "2026-11-02T15:00", endsAt: "2026-11-02T15:45", propertyId: P1, contactId: C1 };

const posts = () => mockApiFetch.mock.calls.filter(([, init]) => init?.method === "POST");
const route = (post: { status: number; body?: unknown }) =>
  mockApiFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    if (String(url).includes("/acceso")) return { status: 200, json: async () => ({ demo: false }) };
    if (init?.method === "POST") return { status: post.status, json: async () => post.body ?? {} };
    return { status: 200, json: async () => ({ items: [], next_cursor: null }) };
  });

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  window.history.pushState({}, "", "/realtor/smart-calendar");
});

describe("cuerpo de la petición", () => {
  it("showing con instantes UTC, zona IANA, propiedad y contacto; sin tenant", () => {
    const b = buildVisitBody(FORM, "America/New_York", "00000000-0000-4000-8000-00000000d001");
    expect(b).toMatchObject({ kind: "showing", title: FORM.title, timezone: "America/New_York", property_id: P1, contact_id: C1 });
    expect(b.starts_at).toMatch(/Z$/);
    expect(new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()).toBe(45 * 60_000);
    expect(JSON.stringify(b)).not.toMatch(/tenant/i);
  });
  it("createVisit publica en el endpoint del contrato y traduce 201, 409, 422 y 403", async () => {
    mockApiFetch.mockResolvedValue({ status: 201, json: async () => ({}) });
    expect(await createVisit(FORM)).toEqual({ ok: true });
    expect(mockApiFetch.mock.calls[0][0]).toBe(VISIT_PATH);
    expect(VISIT_PATH).toBe("/api/v1/realestate/calendar/events");
    for (const [status, reason] of [[409, "conflict"], [422, "invalid"], [403, "denied"], [500, "error"]] as const) {
      mockApiFetch.mockResolvedValue({ status, json: async () => ({}) });
      expect(await createVisit(FORM)).toEqual({ ok: false, reason });
    }
    mockApiFetch.mockRejectedValue(new Error("red"));
    expect(await createVisit(FORM)).toEqual({ ok: false, reason: "error" });
  });
  it("rechaza sin llamar al backend: fin <= inicio o ids que no son uuid", async () => {
    mockApiFetch.mockClear();
    expect(await createVisit({ ...FORM, endsAt: FORM.startsAt })).toEqual({ ok: false, reason: "invalid" });
    expect(await createVisit({ ...FORM, propertyId: "x" })).toEqual({ ok: false, reason: "invalid" });
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe("formulario Programar visita", () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText("Título"), FORM.title);
    fireEvent.change(screen.getByLabelText("Inicio"), { target: { value: FORM.startsAt } });
    fireEvent.change(screen.getByLabelText("Fin"), { target: { value: FORM.endsAt } });
  };

  it("crea la visita con 201: un POST con las puertas reales, refresca y avisa", async () => {
    route({ status: 201 });
    window.history.pushState({}, "", `/realtor/smart-calendar?property_id=${P1}&contact_id=${C1}`);
    render(<SmartCalendarPanel />);
    const form = await screen.findByTestId("visit-form");
    expect(form).toBeInTheDocument();
    expect(screen.getByLabelText("Propiedad")).toHaveValue(P1);
    expect(screen.getByLabelText("Contacto")).toHaveValue(C1);
    const user = userEvent.setup();
    await fill(user);
    await user.click(screen.getByTestId("visit-submit"));
    await waitFor(() => expect(screen.getByTestId("visit-ok")).toBeInTheDocument());
    expect(posts()).toHaveLength(1);
    const [url, init] = posts()[0];
    expect(url).toBe("/api/v1/realestate/calendar/events");
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({ kind: "showing", property_id: P1, contact_id: C1, title: FORM.title });
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });

  it("409 solape: pide confirmar y solo reintenta con allow_overlap tras confirmar", async () => {
    route({ status: 409 });
    render(<SmartCalendarPanel />);
    await screen.findByTestId("visit-form");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Propiedad"), P1);
    await user.type(screen.getByLabelText("Contacto"), C1);
    await fill(user);
    await user.click(screen.getByTestId("visit-submit"));
    expect(await screen.findByTestId("visit-conflict")).toBeInTheDocument();
    expect(JSON.parse(posts()[0][1].body).allow_overlap).toBeUndefined();
    route({ status: 201 });
    await user.click(screen.getByTestId("visit-confirm-overlap"));
    await waitFor(() => expect(screen.getByTestId("visit-ok")).toBeInTheDocument());
    expect(JSON.parse(posts()[1][1].body).allow_overlap).toBe(true);
  });

  it("422: muestra el error y no marca éxito; datos incompletos ni llegan al backend", async () => {
    route({ status: 422 });
    render(<SmartCalendarPanel />);
    await screen.findByTestId("visit-form");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("visit-submit"));
    expect(screen.getByTestId("visit-error")).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
    await user.type(screen.getByLabelText("Propiedad"), P1);
    await user.type(screen.getByLabelText("Contacto"), C1);
    await fill(user);
    await user.click(screen.getByTestId("visit-submit"));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(await screen.findByTestId("visit-error")).toBeInTheDocument();
    expect(screen.queryByTestId("visit-ok")).toBeNull();
  });

  it("DEMO y acceso denegado: no hay formulario ni POST", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    const { unmount } = render(<SmartCalendarPanel />);
    await screen.findByTestId("demo-banner");
    expect(screen.queryByTestId("visit-form")).toBeNull();
    unmount();
    mockApiFetch.mockResolvedValue({ status: 403 });
    render(<SmartCalendarPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("visit-form")).toBeNull();
    expect(posts()).toHaveLength(0);
  });
});
