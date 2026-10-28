import {
  ZONA_DO, ZONA_FL, hhmmEn, horaEn, leerZonaTenant, relojEn, zonaDeJurisdiccion, zonaDelPerfil, zonaNavegador,
} from "@/lib/realtor/tenant-tz";

/**
 * ROP-UX-HORA-TENANT: la zona del tenant se deduce de jurisdiction_code (GET /alta/tenant/profile).
 * Negativos primero: sin perfil o con jurisdicción desconocida se usa la zona del navegador; nunca se inventa una.
 */

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const PERFIL = { owner_person_id: "6f1c2a9e-4b7d-4e2a-9c1f-3d5e7a9b1c20", default_language: "es", kind: "agent" };
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const PROFILE_PATH = "/api/v1/realestate/alta/tenant/profile";

// Navegador en otra zona: Jest aísla process.env, así que cambiar TZ aquí no mueve la zona del proceso. Se simula lo que
// el navegador informa (Intl…resolvedOptions().timeZone); los getters locales se cubren corriendo la suite con TZ=… (ver PR).
const RESOLVED = Intl.DateTimeFormat.prototype.resolvedOptions;
const conTZ = async (tz: string, fn: () => void | Promise<void>) => {
  const spy = jest.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
    .mockImplementation(function (this: Intl.DateTimeFormat) { return { ...RESOLVED.call(this), timeZone: tz }; });
  try { await fn(); } finally { spy.mockRestore(); }
};

beforeEach(() => mockApiFetch.mockReset());

describe("negativos: sin perfil o sin jurisdicción conocida → zona del navegador", () => {
  it.each([404, 503, 500, 401])("perfil %i → navegador (no Santo Domingo fijo)", async (status) => {
    mockApiFetch.mockResolvedValue({ ok: false, status, json: async () => ({}) });
    await conTZ("Europe/Madrid", async () => {
      expect(await leerZonaTenant()).toBe("Europe/Madrid");
    });
    expect(mockApiFetch).toHaveBeenCalledWith(PROFILE_PATH, expect.objectContaining({ method: "GET" }));
  });

  it("fallo de red → navegador", async () => {
    mockApiFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await conTZ("Asia/Tokyo", async () => { expect(await leerZonaTenant()).toBe("Asia/Tokyo"); });
  });

  it("cuerpo ilegible → navegador", async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } });
    await conTZ("Europe/Madrid", async () => { expect(await leerZonaTenant()).toBe("Europe/Madrid"); });
  });

  it.each(["US-TX", "MX-CMX", "", "FL", "us-fl-x", null, undefined, 42])("jurisdicción %p desconocida → null y el perfil cae al navegador", async (code) => {
    expect(zonaDeJurisdiccion(code as never)).toBeNull();
    mockApiFetch.mockResolvedValue(ok({ ...PERFIL, jurisdiction_code: code }));
    await conTZ("Europe/Madrid", async () => { expect(await leerZonaTenant()).toBe("Europe/Madrid"); });
  });

  it("un `timezone` inválido en el perfil no gana: se usa la jurisdicción", () => {
    expect(zonaDelPerfil({ ...PERFIL, jurisdiction_code: "US-FL", timezone: "Mars/Olympus" })).toBe(ZONA_FL);
    expect(zonaDelPerfil({ ...PERFIL, jurisdiction_code: "XX", timezone: "" })).toBeNull();
    expect(zonaDelPerfil(null)).toBeNull();
    expect(zonaDelPerfil("US-FL")).toBeNull();
  });

  it("la petición del perfil no lleva tenant del cliente (sale del token)", async () => {
    mockApiFetch.mockResolvedValue(ok({ ...PERFIL, jurisdiction_code: "US-FL" }));
    await leerZonaTenant();
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe(PROFILE_PATH);
    expect(init.body).toBeUndefined();
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });
});

describe("positivos: mapa fijo de jurisdicciones", () => {
  it("US-FL → America/New_York (zona de Miami); DO y DO-* → America/Santo_Domingo", () => {
    expect(zonaDeJurisdiccion("US-FL")).toBe("America/New_York");
    expect(zonaDeJurisdiccion(" us-fl ")).toBe("America/New_York");
    expect(zonaDeJurisdiccion("DO")).toBe("America/Santo_Domingo");
    expect(zonaDeJurisdiccion("DO-01")).toBe("America/Santo_Domingo");
    expect(ZONA_FL).toBe("America/New_York");
    expect(ZONA_DO).toBe("America/Santo_Domingo");
  });

  it("perfil US-FL → America/New_York; perfil DO → Santo Domingo", async () => {
    mockApiFetch.mockResolvedValue(ok({ ...PERFIL, jurisdiction_code: "US-FL" }));
    await conTZ("UTC", async () => { expect(await leerZonaTenant()).toBe(ZONA_FL); });
    mockApiFetch.mockResolvedValue(ok({ ...PERFIL, jurisdiction_code: "DO", default_language: "es" }));
    await conTZ("UTC", async () => { expect(await leerZonaTenant()).toBe(ZONA_DO); });
  });

  it("si el backend expone `timezone` válido, gana sobre la jurisdicción", async () => {
    mockApiFetch.mockResolvedValue(ok({ ...PERFIL, jurisdiction_code: "US-FL", timezone: "America/Chicago" }));
    expect(await leerZonaTenant()).toBe("America/Chicago");
    expect(zonaDelPerfil({ jurisdiction_code: "XX", timezone: "America/Santo_Domingo" })).toBe(ZONA_DO);
  });

  it("zonaNavegador() es la de Intl", async () => {
    await conTZ("Europe/Madrid", () => { expect(zonaNavegador()).toBe("Europe/Madrid"); });
  });
});

describe("hora de pared en America/New_York: verano (EDT) e invierno (EST)", () => {
  it.each([
    ["verano", "2026-07-15T12:30:00Z", 8, "08:30", [2026, 6, 15]],
    ["invierno mañana", "2026-01-15T12:30:00Z", 7, "07:30", [2026, 0, 15]],
    ["invierno tarde", "2026-01-15T23:30:00Z", 18, "18:30", [2026, 0, 15]],
    ["cambio de día", "2026-01-16T03:30:00Z", 22, "22:30", [2026, 0, 15]],
  ] as const)("%s: %s → %s en Miami", async (_n, iso, hora, texto, [y, m, d]) => {
    for (const tz of ["UTC", "Europe/Madrid", "Asia/Tokyo"]) {
      await conTZ(tz, () => {
        const now = new Date(iso);
        expect(horaEn(now, ZONA_FL)).toBe(hora);
        expect(hhmmEn(now, ZONA_FL)).toBe(texto);
        const r = relojEn(now, ZONA_FL);
        expect([r.getFullYear(), r.getMonth(), r.getDate(), r.getHours(), r.getMinutes()]).toEqual([y, m, d, hora, Number(texto.slice(3))]);
      });
    }
  });

  it("Santo Domingo es UTC-4 todo el año: 23:30Z de enero son 19:30 allí y 18:30 en Miami", () => {
    const now = new Date("2026-01-15T23:30:00Z");
    expect(hhmmEn(now, ZONA_DO)).toBe("19:30");
    expect(hhmmEn(now, ZONA_FL)).toBe("18:30");
    expect(hhmmEn(new Date("2026-01-16T03:30:00Z"), ZONA_DO)).toBe("23:30");
  });

  it("medianoche se escribe 00:00, no 24:00", () => {
    expect(hhmmEn(new Date("2026-07-15T04:00:00Z"), ZONA_FL)).toBe("00:00");
  });
});
