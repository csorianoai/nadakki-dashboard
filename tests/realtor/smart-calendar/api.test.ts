import { fetchCalendarEvents, mapEvents, weekRange } from "@/lib/realtor/smart-calendar/api";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({ Authorization: "Bearer x" }),
}));

const ev = (over: Record<string, unknown> = {}) => ({
  id: "00000000-0000-4000-8000-000000003001", tenant_id: "t", kind: "showing", title: "SYNTH Visita unidad 4B", status: "scheduled",
  starts_at: "2026-11-02T15:00:00Z", ends_at: "2026-11-02T15:45:00Z", timezone: "America/New_York", all_day: false,
  organizer_user_id: "u", ...over,
});
const res = (status: number, json: unknown) => ({ status, json: async () => json });

beforeEach(() => mockApiFetch.mockReset());

describe("mapEvents", () => {
  it("traduce tipo, día y hora de pared en la zona del evento", () => {
    expect(mapEvents([ev()])).toEqual([
      { id: "00000000-0000-4000-8000-000000003001", day: 0, start: "10:00", title: { es: "SYNTH Visita unidad 4B", en: "SYNTH Visita unidad 4B" }, kind: "visita", place: "" },
    ]);
    expect(mapEvents([ev({ kind: "signing" })])[0].kind).toBe("cita");
  });
  it("descarta canceladas y filas inválidas", () => {
    expect(mapEvents([ev({ status: "cancelled" }), ev({ kind: "x" }), ev({ title: "" }), ev({ timezone: "No/Zona" }), null, ev({ starts_at: "no" })])).toEqual([]);
  });
});

describe("fetchCalendarEvents", () => {
  const now = new Date(2026, 10, 4);
  it("semana de lunes a lunes y sin tenant en la petición", async () => {
    mockApiFetch.mockResolvedValueOnce(res(200, { items: [ev()], next_cursor: null }));
    expect(await fetchCalendarEvents(now)).toHaveLength(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    const { from, to } = weekRange(now);
    expect(from.getDay()).toBe(1);
    expect(to.getTime() - from.getTime()).toBeGreaterThan(6.9 * 864e5);
    expect(String(url)).toContain("/api/v1/realestate/calendar/events?");
    expect(`${url} ${JSON.stringify(init)}`.toLowerCase()).not.toMatch(/tenant/);
  });
  it("sigue next_cursor", async () => {
    mockApiFetch.mockResolvedValueOnce(res(200, { items: [ev()], next_cursor: "c2" })).mockResolvedValueOnce(res(200, { items: [ev({ id: "b" })], next_cursor: null }));
    expect(await fetchCalendarEvents(now)).toHaveLength(2);
    expect(String(mockApiFetch.mock.calls[1][0])).toContain("cursor=c2");
  });
  it.each([[404], [503]])("estado %i → lista vacía", async (s) => {
    mockApiFetch.mockResolvedValueOnce(res(s, {}));
    expect(await fetchCalendarEvents(now)).toEqual([]);
  });
  it("red caída o cuerpo inválido → lista vacía", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("net"));
    expect(await fetchCalendarEvents(now)).toEqual([]);
    mockApiFetch.mockResolvedValueOnce(res(200, { nope: 1 }));
    expect(await fetchCalendarEvents(now)).toEqual([]);
  });
});
