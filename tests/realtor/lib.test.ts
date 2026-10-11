import fs from "fs";
import path from "path";
import { fetchPanelAccess } from "@/lib/realtor/access";
import { ACCESS_PATH, isDemoAllowed, isPanelFlagOn, isProductionEnv } from "@/lib/realtor/config";
import { DATA_STATUSES } from "@/lib/realtor/types";
import { buildDemoDataset, PILOT_FILTERS } from "@/lib/realtor/demo-data";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));
beforeEach(() => mockApiFetch.mockReset());

describe("interruptor fail-closed (lib)", () => {
  it("positivo: solo un 200 abre el acceso, con GET y sin tenant", async () => {
    mockApiFetch.mockResolvedValue({ status: 200 });
    expect(await fetchPanelAccess()).toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith(ACCESS_PATH, expect.objectContaining({ method: "GET" }));
  });

  it.each([401, 403, 404, 500])("negativo: %s cierra el acceso", async (status) => {
    mockApiFetch.mockResolvedValue({ status });
    expect(await fetchPanelAccess()).toBe(false);
  });

  it("negativo: error de red cierra el acceso", async () => {
    mockApiFetch.mockRejectedValue(new Error("red"));
    expect(await fetchPanelAccess()).toBe(false);
  });

  it("apagado por defecto: solo el valor exacto 'on' enciende", () => {
    expect(isPanelFlagOn({})).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_DEMAND_RADAR: "true" })).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_DEMAND_RADAR: "on" })).toBe(true);
  });
});

describe("tenant ajeno: el cliente nunca envía tenant (lib)", () => {
  it("tenant sin acceso (403): la solicitud no lleva tenant y el acceso se cierra", async () => {
    mockApiFetch.mockResolvedValue({ status: 403 });
    expect(await fetchPanelAccess()).toBe(false);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });

  it("ningún archivo de lib/realtor menciona tenant", () => {
    const dir = path.join(process.cwd(), "lib/realtor");
    const files = fs.readdirSync(dir);
    expect(files.length).toBeGreaterThan(3);
    files.forEach((f) => expect(fs.readFileSync(path.join(dir, f), "utf8")).not.toMatch(/tenant/i));
  });
});

describe("DEMO nunca en producción (lib)", () => {
  it("positivo: con opt-in y fuera de producción se permite DEMO", () => {
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1" })).toBe(true);
  });

  it("negativo: sin opt-in o en producción no se permite DEMO", () => {
    expect(isDemoAllowed({})).toBe(false);
    expect(isProductionEnv({ NEXT_PUBLIC_APP_ENV: "production" })).toBe(true);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1", NEXT_PUBLIC_VERCEL_ENV: "production" })).toBe(false);
  });
});

describe("contenido de señales y Fair Housing (lib)", () => {
  it("cada señal trae tipo, fuente, fecha y estado válido", () => {
    const { signals } = buildDemoDataset(PILOT_FILTERS);
    expect(signals.length).toBeGreaterThan(0);
    signals.forEach((s) => {
      expect(s.signalType).toBeTruthy();
      expect(s.source).toBeTruthy();
      expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(DATA_STATUSES).toContain(s.status);
    });
  });

  it("negativo: fuera del piloto no se inventan cifras (UNAVAILABLE sin puntos)", () => {
    const { signals } = buildDemoDataset({ ...PILOT_FILTERS, city: "Otra ciudad" });
    signals.forEach((s) => { expect(s.status).toBe("UNAVAILABLE"); expect(s.points).toHaveLength(0); });
  });

  it("los filtros y datos no contienen atributos de personas ni nacionalidad", () => {
    expect(Object.keys(PILOT_FILTERS).join(" ")).not.toMatch(/national|origin|origen|nacionalidad|race|religion|familial|disab/i);
    expect(JSON.stringify(buildDemoDataset(PILOT_FILTERS))).not.toMatch(/nacionalidad|nationality|buyer_profile/i);
  });
});
