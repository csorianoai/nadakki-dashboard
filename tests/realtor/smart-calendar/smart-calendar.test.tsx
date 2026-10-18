import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { SmartCalendarPanel } from "@/components/realtor/smart-calendar/SmartCalendarPanel";
import { DEMO_EVENTS } from "@/lib/realtor/smart-calendar/demo";
import { applyFilter, countByKind, eventsOfDay } from "@/lib/realtor/smart-calendar/logic";
import { SMART_CALENDAR } from "@/lib/realtor/centers";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
const on = (demo: boolean) => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  if (demo) process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
};

describe("lógica", () => {
  it("filtra por tipo, cuenta y ordena por hora dentro del día", () => {
    expect(applyFilter(DEMO_EVENTS, "cita").map((e) => e.id)).toEqual(["e2", "e4"]);
    expect(applyFilter(DEMO_EVENTS, "todos")).toHaveLength(6);
    expect(countByKind(DEMO_EVENTS)).toEqual({ cita: 2, visita: 4 });
    expect(eventsOfDay(DEMO_EVENTS, 3).map((e) => e.start)).toEqual(["11:00", "15:30"]);
  });
  it("los datos sintéticos llevan prefijo SYNTH", () => {
    DEMO_EVENTS.forEach((e) => {
      expect(e.title.es).toMatch(/^SYNTH/);
      expect(e.title.en).toMatch(/^SYNTH/);
    });
  });
  it("el centro está vivo en el registro", () => {
    expect(SMART_CALENDAR.href).toBe("/realtor/smart-calendar");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, 7 días, eventos y filtro por tipo; solo llama a /acceso", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<SmartCalendarPanel />);
    expect(await screen.findByTestId("smart-calendar-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getAllByTestId("day-col")).toHaveLength(7);
    expect(screen.getAllByTestId("cal-event")).toHaveLength(6);
    expect(screen.getByTestId("count-visita")).toHaveTextContent("Visita · 4");
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Tipo"), "cita");
    expect(screen.getAllByTestId("cal-event")).toHaveLength(2);
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Smart Calendar: this week's");
    // Fair Housing: ningún filtro de idioma ni de clase protegida.
    expect(screen.queryByLabelText(/idioma|language/i, { selector: "select" })).toBeNull();
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<SmartCalendarPanel />);
    expect(await screen.findByTestId("smart-calendar-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("cal-event")).toBeNull();
    expect(screen.queryByTestId("kind-counts")).toBeNull();
    expect(screen.getByTestId("smart-calendar-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<SmartCalendarPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("smart-calendar-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<SmartCalendarPanel />);
    await screen.findByTestId("smart-calendar-empty");
    await waitFor(() => expect(mockApiFetch.mock.calls.some(([u]) => String(u).includes("/calendar/events"))).toBe(true));
    for (const [url, init] of mockApiFetch.mock.calls) {
      expect(String(url)).not.toMatch(/tenant/i);
      expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    }
    expect(within(screen.getByTestId("smart-calendar-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("apagado: no pregunta al backend", () => {
    render(<SmartCalendarPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
